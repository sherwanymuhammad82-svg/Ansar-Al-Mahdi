import AdmZip from 'adm-zip';
import path from 'path';

async function listZip() {
  const zipPath = path.join(process.cwd(), 'restore.zip');
  // I need to download it again because I deleted it.
  // Actually, I'll just list the current directory recursively.
}
