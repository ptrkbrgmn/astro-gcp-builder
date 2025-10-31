import { onRequest } from 'firebase-functions/v2/https';
import type { Request } from 'firebase-functions/v2/https';
import type { Response } from 'express'; // Firebase uses Express.js types for req/res
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
    
    const { name: filePath, bucket } = event.data;

    console.log(`File ${filePath} uploaded to bucket ${bucket}. Starting site generation.`);
    
    try {
      // 3. Call the exact same shared logic
      await generateSite(filePath, {
        build: realAstroBuild,
        Storage: RealGcpStorage
      });
      console.log('Storage-triggered function executed successfully.');
    } catch (error) {
      console.error('An error occurred during storage-triggered site generation:', error);
      // In a background function, we log errors for monitoring. There's no user to respond to.
    }
  });