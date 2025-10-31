import { expect } from 'chai';
import { build } from 'astro';
import fs from 'fs/promises';
import path from 'path';
import * as cheerio from 'cheerio';

const TEST_OUT_DIR = path.resolve('test-dist');

describe('Astro Build Integration Test', () => {
  const sampleJson = path.resolve('test/sample-data/posts.json');

  function htmlFor(slug: string) {
    return path.join(TEST_OUT_DIR, 'posts', slug, 'index.html');
  }

  before(async function () {
    await fs.rm(TEST_OUT_DIR, { recursive: true, force: true });
    process.env.JSON_FILE_PATH = sampleJson;
    await build({
      root: process.cwd(),
      outDir: TEST_OUT_DIR,
      cacheDir: path.join(TEST_OUT_DIR, '.astro-cache'),
    });
  });

  after(async () => {
    await fs.rm(TEST_OUT_DIR, { recursive: true, force: true });
  });

  it('generates expected post HTML with correct title', async () => {
    const filePath = htmlFor('my-first-post');
    const stats = await fs.stat(filePath);
    expect(stats.isFile()).to.be.true;
    const $ = cheerio.load(await fs.readFile(filePath, 'utf-8'));
    expect($('h1').text()).to.equal('My First Post');
  });

  it('generates exactly the 3 expected post directories', async () => {
    const postsDir = path.join(TEST_OUT_DIR, 'posts');
    const dirs = await fs.readdir(postsDir);
    expect(dirs).to.have.members(['my-first-post', 'learning-astro', 'streaming-data']);
    expect(dirs).to.have.lengthOf(3);
  });
});