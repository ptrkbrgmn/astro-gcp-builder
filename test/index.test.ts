import fs from "fs/promises";
import path from "path";
import type { Storage } from "@google-cloud/storage";
import { expect } from "chai";
import { generateSite } from "../src/services/siteGenerator.ts";

// This test focuses on orchestration order (download -> build -> upload) using
// lightweight manual fakes instead of a mocking library for clarity.
describe("Site Generation Logic", () => {
  it("performs download, then build, then upload (in order)", async () => {
    const operations: string[] = [];

    async function fakeBuild() {
      operations.push("build");
      const distDir = path.join("/tmp", "dist");
      await fs.mkdir(distDir, { recursive: true });
      await fs.writeFile(path.join(distDir, "index.html"), "<h1>Test</h1>");
    }

    class FakeStorage implements Storage {
      // @ts-ignore - Implement only required surface for the test.
      bucket(name: string) {
        return {
          file: (fileName: string) => ({
            download: async ({ destination }: { destination: string }) => {
              operations.push("download");
              await fs.writeFile(destination, "fake json data");
              return [Buffer.from("fake json data")];
            },
          }),
          upload: async (localPath: string, opts: { destination: string }) => {
            operations.push(`upload:${opts.destination}`);
          },
        };
      }
    }

    await generateSite("test/data.json", {
      build: fakeBuild,
      Storage: FakeStorage as unknown as new () => Storage,
    });

    // Expect strict order: download -> build -> upload of index.html
    expect(operations[0]).to.equal("download");
    expect(operations[1]).to.equal("build");
    expect(operations[2]).to.match(/^upload:/);
    expect(operations).to.have.lengthOf(3);
  });
});
