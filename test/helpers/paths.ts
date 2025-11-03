import path from 'path';

export const ROOT = process.cwd();
export const SAMPLE_JSON = path.resolve('test/sample-data/posts.json');
export const outDir = (name: string = 'test-dist') => path.resolve(name);
export const postHtml = (base: string, slug: string) => path.join(base, 'posts', slug, 'index.html');
