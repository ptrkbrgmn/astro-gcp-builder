/**
 * Layer: Unit / ordering
 * Verifies generateSite calls download -> renderSite -> upload (sequence) using manual fakes.
 */
import fs from 'fs/promises';
import path from 'path';
import type { Storage } from '@google-cloud/storage';
import { expect } from 'chai';
import { generateSite } from '../../src/services/siteGenerator.ts';
import type { SiteRenderer } from '../../src/services/siteGenerator.ts';

describe('Site Generation Logic (order)', () => {
  it('performs download, then render, then upload in order', async () => {
    const operations: string[] = [];
    const fakeRender: SiteRenderer = async (_jsonPath, outDir, _cacheDir) => {
      operations.push('render');
      await fs.mkdir(outDir, { recursive: true });
      await fs.writeFile(path.join(outDir, 'index.html'), '<h1>Test</h1>');
    };

    class FakeStorage implements Storage {
      // @ts-ignore minimal bucket interface
      bucket(_name: string) {
        return {
          file: (_fileName: string) => ({
            download: async ({ destination }: { destination: string }) => {
              operations.push('download');
              await fs.writeFile(destination, 'fake json data');
              return [Buffer.from('fake json data')];
            },
          }),
          upload: async (_localPath: string, opts: { destination: string }) => {
            operations.push(`upload:${opts.destination}`);
          },
        };
      }
    }

    await generateSite('test/data.json', { renderSite: fakeRender, Storage: FakeStorage as unknown as new () => Storage });

    expect(operations[0]).to.equal('download');
    expect(operations[1]).to.equal('render');
    expect(operations[2]).to.match(/^upload:/);
    expect(operations).to.have.lengthOf(3);
  });
});
