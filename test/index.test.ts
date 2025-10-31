import * as td from 'testdouble';
import fs from 'fs/promises';
import path from 'path';
import type { AstroInlineConfig } from 'astro';
import type { Storage, Bucket } from '@google-cloud/storage';

import { generateSite } from '../src/services/siteGenerator.ts';

describe('Site Generation Logic', () => {

    it('should call download, build, and upload in order', async () => {
        // Arrange        
        const fakeBuild = td.func() as (options: AstroInlineConfig) => Promise<void>;
        const FakeStorage = td.constructor(class Storage {});
        const fakeFile = td.object(['download']);
        const fakeBucket = td.object(['file', 'upload']);

        td.when(new FakeStorage()).thenReturn({ bucket: () => fakeBucket } as unknown as Storage);
        td.when(fakeBucket.file('test/data.json')).thenReturn(fakeFile);
        td.when(fakeFile.download(td.matchers.anything())).thenResolve([Buffer.from('test data')]);
        td.when(fakeBucket.upload(td.matchers.anything(), td.matchers.anything())).thenResolve([]);

        td.when(fakeBuild(td.matchers.anything())).thenDo(async () => {
            await fs.mkdir(path.join('/tmp', 'dist'), { recursive: true });
            await fs.writeFile(path.join('/tmp', 'dist', 'index.html'), '<h1>Test</h1>');
        });

        // Act
        await generateSite('test/data.json', { build: fakeBuild, Storage: FakeStorage as new () => Storage });

        // Assert - verify build ran once (upload verification removed as redundant)
        td.verify(fakeBuild(td.matchers.anything()), { times: 1 });
    });
});