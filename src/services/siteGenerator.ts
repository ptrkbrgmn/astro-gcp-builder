import * as path from 'path';
import * as fs from 'fs/promises';
import { fileURLToPath } from 'url';
import type { AstroInlineConfig } from 'astro';
import type { Storage, Bucket } from '@google-cloud/storage';
import { SOURCE_BUCKET_NAME, DEST_BUCKET_NAME } from '../config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Bucket names now sourced from environment (with defaults) via config/env.ts

/**
 * Recursively uploads files from a local directory to a GCS bucket.
 * @param {string} directoryPath The local directory to upload.
 * @param {object} bucket The GCS bucket object.
 */
async function uploadDirectory(directoryPath: string, bucket: Bucket): Promise<void> {
  const files = await fs.readdir(directoryPath, { withFileTypes: true });
  for (const file of files) {
    const localPath = path.join(directoryPath, file.name);
    if (file.isDirectory()) {
      await uploadDirectory(localPath, bucket);
    } else {
      const destinationPath = path.relative(path.join('/tmp', 'dist'), localPath);
      await bucket.upload(localPath, {
        destination: destinationPath,
        metadata: { cacheControl: 'public, max-age=3600' },
      });
      console.log(`Uploaded ${destinationPath}`);
    }
  }
}

interface GenerateSiteDependencies {
  build: (options: AstroInlineConfig) => Promise<void>;
  Storage: new () => Storage;
}

// dependencies injected to facilitate testing
export async function generateSite(pathToLargeJsonFile: string, dependencies: GenerateSiteDependencies): Promise<void> {
  const { build, Storage } = dependencies;
  const storage = new Storage();
  const tempJsonPath = path.join('/tmp', 'data.json');
  const tempOutDir = path.join('/tmp', 'dist');
  const tempCacheDir = path.join('/tmp', 'cache');

  try {
    console.log(`Starting site generation process...`);

    // Step 1: Download
  console.log(`Downloading gs://${SOURCE_BUCKET_NAME}/${pathToLargeJsonFile}...`);
  await storage.bucket(SOURCE_BUCKET_NAME).file(pathToLargeJsonFile).download({
      destination: tempJsonPath,
    });
    console.log('Download complete.');

    // 2. BUILD
    process.env.JSON_FILE_PATH = tempJsonPath;
    await build({
      root: path.resolve(__dirname, '..', '..'),
      outDir: tempOutDir,
      cacheDir: tempCacheDir,
    });
    console.log('Astro build finished successfully.');

    // Step 3: Upload
  const destBucket = storage.bucket(DEST_BUCKET_NAME);
    await uploadDirectory(tempOutDir, destBucket);
    console.log('All files uploaded to destination bucket.');

  } finally {
    await fs.rm(tempJsonPath, { force: true });
    await fs.rm(tempOutDir, { recursive: true, force: true });
    await fs.rm(tempCacheDir, { recursive: true, force: true });
  }

}