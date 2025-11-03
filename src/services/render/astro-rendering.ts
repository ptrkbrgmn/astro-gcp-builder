import { build as realAstroBuild } from 'astro';
import type { SiteRenderer } from '../siteGenerator.js';

export const astroRender: SiteRenderer = async (jsonPath: string, outDir: string, cacheDir: string) => {
  process.env.JSON_FILE_PATH = jsonPath;
  await realAstroBuild({
    root: process.cwd(),
    outDir,
    cacheDir,
  });
};