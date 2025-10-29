import fs from 'fs';
import path from 'path';

const FILE_PATH = path.resolve(process.cwd(), 'test/stress-test/large-data.json');
const NUM_RECORDS = 1_000_000;

console.log(`Generating a large JSON file with ${NUM_RECORDS.toLocaleString()} records...`);

const writeStream = fs.createWriteStream(FILE_PATH);

writeStream.write('[');

for (let i = 0; i < NUM_RECORDS; i++) {
    const post = {
        slug: `stress-test-post-${i}`,
        title: `Stress Test Post Number ${i}`,
        author: `Automated Script`,
        content: `This is the content for post number ${i}. It includes some extra text to make the file a bit larger and more realistic. Lorem ipsum dolor sit amet.`
    };

    if (i > 0) {
        writeStream.write(',');
    }

    writeStream.write(JSON.stringify(post, null, 2));

    if (i % 10000 === 0) {
        console.log(`...wrote ${i.toLocaleString()} records`);
    }
}

writeStream.write(']');

writeStream.end();

writeStream.on('finish', () => {
    const stats = fs.statSync(FILE_PATH);
    const fileSizeInMB = stats.size / (1024 * 1024);
    console.log('✅ Generation complete!');
    console.log(`File path: ${FILE_PATH}`);
        console.log(`File size: ${fileSizeInMB.toFixed(2)} MB`);
});

writeStream.on('error', (err) => {
    console.error('Error writing file:', err);
});