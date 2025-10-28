import { onRequest } from 'firebase-functions/v2/https';
import { build as realAstroBuild } from 'astro';
import { Storage as RealGcpStorage } from '@google-cloud/storage';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const sourceBucketName = 'your-source-json-bucket';
const destBucketName = 'your-final-static-site-bucket';

/**
 * Recursively uploads files from a local directory to a GCS bucket.
 * @param {string} directoryPath The local directory to upload.
 * @param {object} bucket The GCS bucket object.
 */
async function uploadDirectory(directoryPath, bucket) {
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

export async function generateSite(pathToLargeJsonFile, dependencies) {
  const { build, Storage } = dependencies;
  const storage = new Storage();

  const tempJsonPath = path.join('/tmp', 'data.json');
  const tempOutDir = path.join('/tmp', 'dist');

  // Step 1: Download
  console.log(`Downloading gs://${sourceBucketName}/${pathToLargeJsonFile}...`);
  await storage.bucket(sourceBucketName).file(pathToLargeJsonFile).download({
    destination: tempJsonPath,
  });
  console.log('Download complete.');

  // Step 2: Build
  process.env.JSON_FILE_PATH = tempJsonPath;
  await build({
    root: __dirname,
    outDir: tempOutDir,
    });
  console.log('Astro build finished successfully.');

  // Step 3: Upload
  const destBucket = storage.bucket(destBucketName);
  await uploadDirectory(tempOutDir, destBucket);
  console.log('All files uploaded to destination bucket.');
}

export const handler = onRequest(async (req, res) => {
  try {
    const { pathToLargeJsonFile } = req.body;
    if (!pathToLargeJsonFile) {
      return res.status(400).send('Missing "pathToLargeJsonFile" in request body.');
    }

    // Call the core logic with the real dependencies
    await generateSite(pathToLargeJsonFile, {
      build: realAstroBuild,
      Storage: RealGcpStorage
    });

    // If it succeeds, send a 200 OK
    res.status(200).send('Static site generated and uploaded successfully!');
  } catch (error) {
    // If it throws an error, send a 500 Internal Server Error
    console.error('An error occurred in the handler:', error);
    res.status(500).send('Failed to build and deploy site.');
  }
});