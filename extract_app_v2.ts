import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs';

async function extractApp() {
  const zipPath = path.join(process.cwd(), 'restore.zip');
  const zip = new AdmZip(zipPath);
  zip.extractEntryTo('src/App.tsx', path.join(process.cwd(), 'src'), false, true);
  console.log('Extracted src/App.tsx');
}

extractApp().catch(console.error);
