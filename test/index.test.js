import { expect } from 'chai';
import * as td from 'testdouble';
import fs from 'fs/promises';
import path from 'path';

import { generateSite } from '../functions/index.js';

describe('Site Generation Logic', () => {

    beforeEach(async () => {
        await fs.rm(path.join('/tmp', 'dist'), { recursive: true, force: true });
    });
    afterEach(async () => {
        await fs.rm(path.join('/tmp', 'dist'), { recursive: true, force: true });
    });

    it('should call download, build, and upload in order', async () => {
    
        const fakeBuild = td.func();
        const FakeStorage = td.constructor(class Storage {});
        const fakeFile = td.object(['download']);
        const fakeBucket = td.object(['file', 'upload']);

        td.when(new FakeStorage()).thenReturn({ bucket: () => fakeBucket });
        td.when(fakeBucket.file('test/data.json')).thenReturn(fakeFile);
        td.when(fakeFile.download(td.matchers.anything())).thenResolve();
        td.when(fakeBucket.upload(td.matchers.anything(), td.matchers.anything())).thenResolve();

        td.when(fakeBuild(td.matchers.anything())).thenDo(async () => {
            await fs.mkdir(path.join('/tmp', 'dist'), { recursive: true });
            await fs.writeFile(path.join('/tmp', 'dist', 'index.html'), '<h1>Test</h1>');
        });

        await generateSite('test/data.json', { build: fakeBuild, Storage: FakeStorage });


        td.verify(fakeBucket.upload(td.matchers.anything(), td.matchers.anything()), { times: 1 });
        td.verify(fakeBuild(td.matchers.anything()), { times: 1 });
    });
});