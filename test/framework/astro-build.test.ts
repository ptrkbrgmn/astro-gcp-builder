/**
 * Layer: Framework-specific build (Astro)
 * Purpose: Validate Astro's dynamic route generation & HTML output given JSON_FILE_PATH.
 * Orchestration (download/upload) is tested elsewhere; this isolates the build.
 */
import { expect } from "chai";
import { astroRender } from "../../src/services/render/astro-rendering.ts";
import fs from "fs/promises";
import path from "path";
import * as cheerio from "cheerio";
import { SAMPLE_JSON, outDir, postHtml } from "../helpers/paths.ts";

describe("Astro Build Integration Test", () => {
  const OUT_DIR = outDir("test-dist-astro");

  before(async () => {
    await fs.rm(OUT_DIR, { recursive: true, force: true });
    await astroRender(SAMPLE_JSON, OUT_DIR, path.join(OUT_DIR, ".astro-cache"));
  });

  after(async () => {
    await fs.rm(OUT_DIR, { recursive: true, force: true });
  });

  it("renders expected post HTML title", async () => {
    const filePath = postHtml(OUT_DIR, "my-first-post");
    const stats = await fs.stat(filePath);
    expect(stats.isFile()).to.be.true;
    const $ = cheerio.load(await fs.readFile(filePath, "utf-8"));
    expect($("h1").text()).to.equal("My First Post");
  });

  it("produces exactly the 3 expected post directories", async () => {
    const postsDir = path.join(OUT_DIR, "posts");
    const dirs = await fs.readdir(postsDir);
    expect(dirs).to.have.members([
      "my-first-post",
      "learning-astro",
      "streaming-data",
    ]);
    expect(dirs).to.have.lengthOf(3);
  });
});
