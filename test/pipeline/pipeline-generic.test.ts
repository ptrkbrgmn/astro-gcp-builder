/**
 * Layer: Pipeline orchestration (framework-agnostic)
 * Purpose: Ensure generateSite downloads, invokes renderer, and uploads outputs using fake renderer.
 */
import { expect } from 'chai';
import path from 'path';
import * as fs from 'fs/promises';
import type { Storage } from '@google-cloud/storage';
import { generateSite } from '../../src/services/siteGenerator.ts';
import type { SiteRenderer } from '../../src/services/siteGenerator.ts';

describe('Pipeline (generic renderer)', () => {
  const SOURCE_KEY = 'test/data.json';
  const fakeJsonContent = JSON.stringify([
    { slug: 'p1', title: 'Post One', author: 'A', content: 'C1' },
    { slug: 'p2', title: 'Post Two', author: 'B', content: 'C2' }
  ]);

  const uploads: Record<string, string> = {}; // destinationPath -> file contents
  const invokedArgs: { jsonPath?: string; outDir?: string; cacheDir?: string } = {};

  const fakeRenderer: SiteRenderer = async (jsonPath, outDir, _cacheDir) => {
    invokedArgs.jsonPath = jsonPath;
    invokedArgs.outDir = outDir;
    invokedArgs.cacheDir = _cacheDir;
    const posts = [
      { slug: 'p1', title: 'Post One' },
      { slug: 'p2', title: 'Post Two' }
    ];
    for (const p of posts) {
      const postDir = path.join(outDir, 'posts', p.slug);
      await fs.mkdir(postDir, { recursive: true });
      await fs.writeFile(path.join(postDir, 'index.html'), `<h1>${p.title}</h1>`, 'utf-8');
    }
  };

  class FakeStorage implements Storage {
    // @ts-ignore minimal bucket implementation
    bucket(_name: string) {
      return {
        file: (_key: string) => ({
          download: async ({ destination }: { destination: string }) => {
            await fs.writeFile(destination, fakeJsonContent, 'utf-8');
            return [Buffer.from(fakeJsonContent)];
          }
        }),
        upload: async (localPath: string, opts: { destination: string }) => {
          const content = await fs.readFile(localPath, 'utf-8');
          uploads[opts.destination] = content;
        }
      };
    }
  }

  beforeEach(() => {
    for (const k of Object.keys(uploads)) delete uploads[k];
    for (const k of Object.keys(invokedArgs)) delete (invokedArgs as any)[k];
  });

  it('uploads two rendered HTML pages', async () => {
    await generateSite(SOURCE_KEY, { renderSite: fakeRenderer, Storage: FakeStorage as unknown as new () => Storage });
    const uploadedPaths = Object.keys(uploads);
    expect(uploadedPaths).to.include.members([
      path.join('posts', 'p1', 'index.html'),
      path.join('posts', 'p2', 'index.html'),
    ]);
    expect(uploadedPaths).to.have.length(2);
    expect(uploads[path.join('posts', 'p1', 'index.html')]).to.include('<h1>Post One</h1>');
    // Assert renderer received parameters (json downloaded to provided path)
    expect(invokedArgs.jsonPath).to.be.a('string');
    expect(invokedArgs.outDir).to.be.a('string');
  });
});
