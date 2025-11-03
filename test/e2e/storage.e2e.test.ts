/**
 * Layer: End-to-End (Emulator trigger)
 * Purpose: Validate storage finalize trigger generates and uploads HTML via full Astro renderer.
 */
import { expect } from 'chai';
import admin from 'firebase-admin';
import * as cheerio from 'cheerio';
import type { Post } from '../../src/types/types';

const PROJECT_ID = 'astro-gcp-builder-test-182e3';
const SOURCE_BUCKET_NAME = 'your-source-json-bucket';
const DEST_BUCKET_NAME = 'your-final-static-site-bucket';

process.env.FIREBASE_STORAGE_EMULATOR_HOST = 'localhost:9199';
if (!admin.apps.length) {
  admin.initializeApp({ projectId: PROJECT_ID });
}
const sourceBucket = admin.storage().bucket(SOURCE_BUCKET_NAME);
const destBucket = admin.storage().bucket(DEST_BUCKET_NAME);

async function waitForFile(path: string, timeoutMs = 20000, intervalMs = 1000): Promise<Buffer> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const [contents] = await destBucket.file(path).download();
      return contents; // Success
    } catch (err) {
      // Swallow not-found errors and retry.
    }
    await new Promise(r => setTimeout(r, intervalMs));
  }
  throw new Error(`Timed out waiting for file: ${path}`);
}

describe('Storage-Triggered E2E Test', () => {
  before(async () => {
    await sourceBucket.deleteFiles({ force: true });
    await destBucket.deleteFiles({ force: true });
  });

  it('generates the site when a JSON file is uploaded', async () => {
    // 1. Upload trigger JSON.
    const testPost: Post[] = [{
      slug: 'storage-test',
      title: 'Storage Trigger Test',
      author: 'E2E Test',
      content: 'Content generated for storage trigger end-to-end test.'
    }];
    const triggerFile = 'storage-trigger.json';
    await sourceBucket.file(triggerFile).save(JSON.stringify(testPost));
    console.log('[e2e] Uploaded trigger JSON; waiting for function...');

    // 2. Wait for generated HTML via polling (faster & less brittle than fixed sleep).
    const finalHtmlPath = `posts/${testPost[0].slug}/index.html`;
    const fileContents = await waitForFile(finalHtmlPath);

    // 3. Assert page content.
    const $ = cheerio.load(fileContents.toString());
    expect($('h1').text()).to.equal('Storage Trigger Test');
    console.log('[e2e] Generated HTML verified successfully.');
  });
});
