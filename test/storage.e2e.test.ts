// test/storage.e2e.test.js
import { expect } from 'chai';
import admin from 'firebase-admin';
import * as cheerio from 'cheerio';

// --- Configuration ---
const PROJECT_ID = 'astro-gcp-builder-test-182e3';
const SOURCE_BUCKET_NAME = 'your-source-json-bucket';
const DEST_BUCKET_NAME = 'your-final-static-site-bucket';

// --- Initialize Admin SDK ---
process.env.FIREBASE_STORAGE_EMULATOR_HOST = 'localhost:9199';
if (!admin.apps.length) {
  admin.initializeApp({ projectId: PROJECT_ID });
}
const sourceBucket = admin.storage().bucket(SOURCE_BUCKET_NAME);
const destBucket = admin.storage().bucket(DEST_BUCKET_NAME);

describe('Storage-Triggered E2E Test', function () {
  this.timeout(30000);

  before(async () => {
    await sourceBucket.deleteFiles({ force: true });
    await destBucket.deleteFiles({ force: true });
  });

  it('should generate the site when a file is uploaded', async () => {
    // 1. ARRANGE: Create and upload the test file. This is the trigger.
    const testPost = [{ slug: 'storage-test', title: 'Storage Trigger Test' }];
    const testFileName = 'storage-trigger.json';
    await sourceBucket.file(testFileName).save(JSON.stringify(testPost));
    console.log('E2E (Storage): Uploaded test file, function should trigger automatically.');

    // 2. ACT: Wait for the background function to do its work.
    console.log('E2E (Storage): Waiting 15 seconds for build to complete...');
    await new Promise(resolve => setTimeout(resolve, 15000));

    // 3. ASSERT: Check the destination bucket for the result.
    const finalHtmlPath = `posts/${testPost[0].slug}/index.html`;
    const [fileContents] = await destBucket.file(finalHtmlPath).download();

    const $ = cheerio.load(fileContents.toString());
    const h1Text = $('h1').text();

    expect(h1Text).to.equal('Storage Trigger Test');
    console.log('E2E (Storage): HTML content verified successfully!');
  });
});