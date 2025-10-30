import { expect } from 'chai';
import { build } from 'astro';
import fs from 'fs/promises';
import path from 'path';
import * as cheerio from 'cheerio';

const TEST_OUT_DIR = path.resolve(process.cwd(), 'test-dist');

describe('Astro Build Integration Test', () => {

  before(async function() {
    this.timeout(30000);

    await fs.rm(TEST_OUT_DIR, { recursive: true, force: true });
    
    process.env.JSON_FILE_PATH = path.resolve(process.cwd(), 'test/sample-data/posts.json');
    
    console.log('--- Starting real Astro build for integration test... ---');
    await build({
      // ✅ The fix: Pass the string path directly, not a URL object.
      root: path.resolve(process.cwd(), 'functions'),
      outDir: TEST_OUT_DIR,
    });
    console.log('--- Astro build complete. ---');
  });
  
  // After all tests are done, clean up the generated files.
  after(async () => {
    await fs.rm(TEST_OUT_DIR, { recursive: true, force: true });
  });

  it('should create an HTML file for the post "my-first-post"', async () => {
    // Astro creates a folder for each dynamic route.
    const filePath = path.join(TEST_OUT_DIR, 'posts', 'my-first-post', 'index.html');
    
    // The simplest check: does the file exist?
    // fs.stat throws an error if the file doesn't exist, which fails the test.
    const stats = await fs.stat(filePath);
    expect(stats.isFile()).to.be.true;
  });
// 
  it('should have the correct title in the H1 tag for "my-first-post"', async () => {
    const filePath = path.join(TEST_OUT_DIR, 'posts', 'my-first-post', 'index.html');
    
    // 1. Read the content of the generated HTML file.
    const htmlContent = await fs.readFile(filePath, 'utf-8');
    
    // 2. Parse the HTML with cheerio so we can query it.
    const $ = cheerio.load(htmlContent);
    
    // 3. Find the <h1> tag and check its text content.
    const h1Text = $('h1').text();
    expect(h1Text).to.equal('My First Post');
  });

  it('should correctly generate all 3 posts from the sample JSON', async () => {
    const postsDir = path.join(TEST_OUT_DIR, 'posts');
    const files = await fs.readdir(postsDir);
    // We expect a directory for each of the 3 posts in our sample file.
    expect(files).to.have.lengthOf(3);
    expect(files).to.include.members(['my-first-post', 'learning-astro', 'streaming-data']);
  });
});