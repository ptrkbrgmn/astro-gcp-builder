import admin from 'firebase-admin';
import path from 'path';

const PROJECT_ID = 'astro-gcp-builder-test-182e3';
const BUCKET_NAME = 'your-source-json-bucket';
const LARGE_FILE_NAME = 'large-data.json';
const LARGE_FILE_PATH = path.resolve(process.cwd(), `test/stress-test/${LARGE_FILE_NAME}`);

process.env.FIREBASE_STORAGE_EMULATOR_HOST = 'localhost:9199';
admin.initializeApp({ projectId: PROJECT_ID, storageBucket: BUCKET_NAME });
const bucket = admin.storage().bucket();

async function runStressTest() {
    try {
        console.log(`Starting upload of ${LARGE_FILE_NAME} to bucket: ${BUCKET_NAME}...`);
        await bucket.upload(LARGE_FILE_PATH, { destination: LARGE_FILE_NAME });
        console.log('Upload complete.');
        console.log('\n🔥 Function should now be running in the background.');
        console.log('Watch the emulator logs to see the progress...');

    } catch (error) {
        console.error('\n An error occurred during the upload:', error.message);
    }
}

runStressTest();