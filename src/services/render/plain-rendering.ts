import { createReadStream } from 'fs';
import * as fs from 'fs/promises';
import * as path from 'path';
import chain from 'stream-chain';
import parser from 'stream-json';
// @ts-ignore: dynamic runtime import without types in our TS config
import pick from 'stream-json/filters/Pick.js';
// @ts-ignore: dynamic runtime import without types in our TS config
import streamArray from 'stream-json/streamers/StreamArray.js';
import type { SiteRenderer } from '../siteGenerator.js';
import type { Post } from '../../types/types.js';

// A simple framework-agnostic renderer that reads the JSON array and writes one
// HTML file per post to outDir/posts/<slug>/index.html
// This purposefully avoids Astro and can be used in tests to validate the
// rendering contract independent of any static site framework.
export const plainRender: SiteRenderer = async (jsonPath, outDir, _cacheDir) => {
  const pipeline = new chain([
    parser(),
    new pick({ filter: '' }),
    new streamArray(),
  ] as any);

  await fs.mkdir(outDir, { recursive: true });
  createReadStream(jsonPath).pipe(pipeline);

  for await (const { value } of pipeline) {
    const post = value as Post;
    const postDir = path.join(outDir, 'posts', post.slug);
    await fs.mkdir(postDir, { recursive: true });
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${post.title}</title></head><body><h1>${post.title}</h1><p><em>By ${post.author}</em></p><hr><p>${post.content}</p></body></html>`;
    await fs.writeFile(path.join(postDir, 'index.html'), html, 'utf-8');
  }
};
