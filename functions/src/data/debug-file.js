// debug-file.js
import fs from 'fs';
import path from 'path';

const filePath = path.resolve(process.cwd(), 'posts.json');
const buffer = fs.readFileSync(filePath);

// Log the first 5 bytes in hexadecimal format
console.log('First 5 bytes (hex):', buffer.slice(0, 5).toString('hex'));
console.log("A correct file starting with '[' should be '5b'");
console.log("A file with a BOM will start with 'efbbbf'");