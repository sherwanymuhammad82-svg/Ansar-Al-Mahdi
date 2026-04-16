import fetch from 'node-fetch';
import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';

async function listZip() {
  const url = 'https://github.com/sherwanymuhammad82-svg/my-book-api/releases/download/5/ansar-app313.zip';
  const zipPath = path.join(process.cwd(), 'restore.zip');

  console.log('Downloading zip...');
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
  const buffer = await response.buffer();
  fs.writeFileSync(zipPath, buffer);

  console.log('Listing zip...');
  const zip = new AdmZip(zipPath);
  const zipEntries = zip.getEntries();
  zipEntries.forEach(entry => {
    console.log(entry.entryName);
  });
}

listZip().catch(console.error);
