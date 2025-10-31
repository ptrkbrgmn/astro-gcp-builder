// import { onRequest } from 'firebase-functions/v2/https';
// import type { Request } from 'firebase-functions/v2/https';
// import type { Response } from 'express';
import { build as realAstroBuild } from 'astro';
import { Storage as RealGcpStorage } from '@google-cloud/storage';
import { generateSite } from './services/siteGenerator.js'; // Note the .js extension
import { SOURCE_BUCKET_NAME } from './config/env.js';
import { onObjectFinalized } from 'firebase-functions/v2/storage';

// export const handler = onRequest({
//     timeoutSeconds: 540,
//     memory: '1GiB',
//   }, 
//   async (req: Request, res: Response) => {
//     try {
//       const { pathToLargeJsonFile } = req.body;
//       if (!pathToLargeJsonFile) {
//         res.status(400).send('Missing "pathToLargeJsonFile" in request body.');
//         return;
//       }
//       await generateSite(pathToLargeJsonFile, {
//         build: realAstroBuild,
//         Storage: RealGcpStorage
//       });
//       res.status(200).send('Static site generated and uploaded successfully!');
//     } catch (error) {
//       console.error('An error occurred in the handler:', error);
//       res.status(500).send('Failed to build and deploy site.');
//     }
//   }
// );

export const generateOnUpload = onObjectFinalized({
  bucket: SOURCE_BUCKET_NAME, // Only listen to the source bucket
  timeoutSeconds: 3600,
  memory: '1GiB',
}, async (event) => {
  const { name: objectName, bucket } = event.data;

  if (!objectName?.endsWith('.json')) {
    console.log('[storage-trigger] Ignoring non-JSON object', { bucket, objectName });
    return;
  }

  console.log('[storage-trigger] Finalize event received', { path: `gs://${bucket}/${objectName}` });

  try {
    await generateSite(objectName, {
      build: realAstroBuild,
      Storage: RealGcpStorage,
    });
    console.log('[storage-trigger] Site generation succeeded', { source: objectName });
  } catch (error) {
    console.error('[storage-trigger] Site generation failed', {
      source: objectName,
      bucket,
      message: (error as Error).message,
    });
  }
});