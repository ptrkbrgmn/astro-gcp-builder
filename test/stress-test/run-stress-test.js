import admin from 'firebase-admin';
import path from 'path';
import fetch from 'node-fetch';

// --- Configuration ---
const PROJECT_ID = 'astro-gcp-builder-test-182e3'; // ⚠️ Your specific project ID
const BUCKET_NAME = 'your-source-json-bucket';
const LARGE_FILE_NAME = 'large-data.json';
const LARGE_FILE_PATH = path.resolve(process.cwd(), `test/stress-test/${LARGE_FILE_NAME}`);
const FUNCTION_URL = `http://127.0.0.1:5001/${PROJECT_ID}/us-central1/handler`;

// --- Connect to Emulators ---
process.env.FIREBASE_STORAGE_EMULATOR_HOST = 'localhost:9199';
admin.initializeApp({ projectId: PROJECT_ID, storageBucket: BUCKET_NAME });
const bucket = admin.storage().bucket();

// --- Main Execution Logic ---
async function runStressTest() {
    try {
        // 1. Upload the large file
        console.log(`🚀 Starting upload of ${LARGE_FILE_NAME} to bucket: ${BUCKET_NAME}...`);
        await bucket.upload(LARGE_FILE_PATH, { destination: LARGE_FILE_NAME });
        console.log('✅ Upload complete.');

        // 2. Trigger the HTTP function
        console.log(`\n🔥 Triggering function at ${FUNCTION_URL}...`);
        const response = await fetch(FUNCTION_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pathToLargeJsonFile: LARGE_FILE_NAME }),
        });

        // 3. Report the result
        const responseText = await response.text();
        console.log(`\n🏁 Function responded with status: ${response.status}`);
        console.log(`📝 Response body: "${responseText}"`);

        if (!response.ok) {
            throw new Error('Function execution failed.');
        }
        console.log('\n🎉 Stress test completed successfully!');

    } catch (error) {
        console.error('\n❌ An error occurred during the stress test:', error.message);
    }
}

runStressTest();