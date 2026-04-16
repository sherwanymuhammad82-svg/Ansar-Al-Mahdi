import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs';

async function extractApp() {
  const zipPath = path.join(process.cwd(), 'restore.zip');
  const zip = new AdmZip(zipPath);
  zip.extractEntryTo('src/App.tsx', process.cwd(), false, true, 'App_Original.tsx');
  console.log('Extracted App_Original.tsx');
}

extractApp().catch(console.error);
