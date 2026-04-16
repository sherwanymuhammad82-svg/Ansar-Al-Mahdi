import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs';

async function restore() {
  const zipPath = path.join(process.cwd(), 'restore.zip');
  const zip = new AdmZip(zipPath);
  
  console.log('Restoring all files from zip...');
  
  // Extract everything to a temporary directory first to see what's inside
  const tempDir = path.join(process.cwd(), 'temp_restore');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
  zip.extractAllTo(tempDir, true);
  
  // Now move everything from tempDir to root, overwriting
  function moveRecursive(src: string, dest: string) {
    const files = fs.readdirSync(src);
    for (const file of files) {
      const srcPath = path.join(src, file);
      const destPath = path.join(dest, file);
      const stat = fs.statSync(srcPath);
      if (stat.isDirectory()) {
        if (!fs.existsSync(destPath)) fs.mkdirSync(destPath);
        moveRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
  
  moveRecursive(tempDir, process.cwd());
  
  // Clean up tempDir
  fs.rmSync(tempDir, { recursive: true, force: true });
  
  console.log('Restore complete!');
}

restore().catch(console.error);
