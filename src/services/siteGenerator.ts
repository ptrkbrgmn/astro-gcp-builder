import * as path from "path";
import * as fs from "fs/promises";
import type { Storage, Bucket } from "@google-cloud/storage";
import { SOURCE_BUCKET_NAME, DEST_BUCKET_NAME } from "../config/env.js";

/**
 * Recursively uploads files from a local directory to a GCS bucket.k
 * @param {string} directoryPath
 * @param {object} bucket
 */
async function uploadDirectory(
  directoryPath: string,
  bucket: Bucket
): Promise<void> {
  const files = await fs.readdir(directoryPath, { withFileTypes: true });
  for (const file of files) {
    const localPath = path.join(directoryPath, file.name);
    if (file.isDirectory()) {
      await uploadDirectory(localPath, bucket);
    } else {
      const destinationPath = path.relative(
        path.join("/tmp", "dist"),
        localPath
      );
      await bucket.upload(localPath, {
        destination: destinationPath,
        metadata: { cacheControl: "public, max-age=3600" },
      });
      console.log(`Uploaded ${destinationPath}`);
    }
  }
}

export type SiteRenderer = (jsonPath: string, outDir: string, cacheDir: string) => Promise<void>;

interface GenerateSiteDependencies {
  // Function responsible for turning the downloaded JSON into a static site
  // inside the provided output directory. It must write files into outDir.
  renderSite: SiteRenderer;
  Storage: new () => Storage;
}

export async function generateSite(
  pathToLargeJsonFile: string,
  { renderSite, Storage }: GenerateSiteDependencies
): Promise<void> {
  const storage = new Storage();
  const tempJsonPath = path.join("/tmp", "data.json");
  const tempOutDir = path.join("/tmp", "dist");
  const tempCacheDir = path.join("/tmp", "cache");

  try {
    console.log(`Starting site generation process...`);

    // Step 1: Download
    console.log(
      `Downloading gs://${SOURCE_BUCKET_NAME}/${pathToLargeJsonFile}...`
    );
    await storage
      .bucket(SOURCE_BUCKET_NAME)
      .file(pathToLargeJsonFile)
      .download({
        destination: tempJsonPath,
      });
    console.log("Download complete.");

    // 2. RENDER (framework-agnostic)
    await renderSite(tempJsonPath, tempOutDir, tempCacheDir);
    console.log("Site rendering finished successfully.");

    // Step 3: Upload
    const destBucket = storage.bucket(DEST_BUCKET_NAME);
    await uploadDirectory(tempOutDir, destBucket);
    console.log("All files uploaded to destination bucket.");
  } finally {
    await fs.rm(tempJsonPath, { force: true });
    await fs.rm(tempOutDir, { recursive: true, force: true });
    await fs.rm(tempCacheDir, { recursive: true, force: true });
  }
}
