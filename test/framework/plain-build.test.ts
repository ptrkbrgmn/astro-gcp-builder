/**
 * Layer: Framework-agnostic renderer (plainRender)
 * Purpose: Validate plainRender produces expected HTML structure and directories.
 * Mirrors astro-build test but uses the generic renderer implementation.
 */
import { expect } from "chai";
import fs from "fs/promises";
import path from "path";
import * as cheerio from "cheerio";
import { SAMPLE_JSON, outDir, postHtml } from "../helpers/paths.ts";
import { plainRender } from "../../src/services/render/plain-rendering.ts";

describe("Plain Renderer Build Test", () => {
  const OUT_DIR = outDir("test-dist-plain");

  before(async () => {
    await fs.rm(OUT_DIR, { recursive: true, force: true });
    await plainRender(SAMPLE_JSON, OUT_DIR, path.join(OUT_DIR, ".cache"));
  });

  after(async () => {
    await fs.rm(outDir("test-dist-plain"), { recursive: true, force: true });
  });

  it("renders expected post HTML title", async () => {
    const filePath = postHtml(outDir("test-dist-plain"), "my-first-post");
    const stats = await fs.stat(filePath);
    expect(stats.isFile()).to.be.true;
    const $ = cheerio.load(await fs.readFile(filePath, "utf-8"));
    expect($("h1").text()).to.equal("My First Post");
  });

  it("produces exactly the 3 expected post directories", async () => {
    const postsDir = path.join(outDir("test-dist-plain"), "posts");
    const dirs = await fs.readdir(postsDir);
    expect(dirs).to.have.members([
      "my-first-post",
      "learning-astro",
      "streaming-data",
    ]);
    expect(dirs).to.have.lengthOf(3);
  });
});
