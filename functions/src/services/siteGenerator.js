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

// dependencies injected to facilitate testing
export async function generateSite(pathToLargeJsonFile, dependencies) {
  const { build, Storage } = dependencies;
  const storage = new Storage();

  // const unique = Date.now().toString();
  // const tempJsonPath = `/tmp/${unique}-data.json`;
  // const tempOutDir = `/tmp/${unique}-dist`;
  // const tempCacheDir = `/tmp/${unique}-cache`;
    
    const tempJsonPath = path.join('/tmp', 'data.json');
    const tempOutDir = path.join('/tmp', 'dist');
    const tempCacheDir = path.join('/tmp', 'cache');

  try {
    console.log(`Starting site generation process...`);

    // Step 1: Download
    console.log(`Downloading gs://${sourceBucketName}/${pathToLargeJsonFile}...`);
    await storage.bucket(sourceBucketName).file(pathToLargeJsonFile).download({
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
    const destBucket = storage.bucket(destBucketName);
    await uploadDirectory(tempOutDir, destBucket);
    console.log('All files uploaded to destination bucket.');

  } finally {
    // Clean up temp files after build
    await fs.rm(tempJsonPath, { force: true });
    await fs.rm(tempOutDir, { recursive: true, force: true });
    await fs.rm(tempCacheDir, { recursive: true, force: true });
  }

}