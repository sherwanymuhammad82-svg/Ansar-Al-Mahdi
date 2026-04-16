import AdmZip from 'adm-zip';
import fetch from 'node-fetch';

async function inspectZips() {
  const urls = [
    'https://github.com/sherwanymuhammad82-svg/my-book-api/releases/download/4/Hanbali_books.zip',
    'https://github.com/sherwanymuhammad82-svg/Fqh/archive/refs/heads/main.zip'
  ];

  for (const url of urls) {
    console.log(`Downloading ${url}...`);
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const zip = new AdmZip(Buffer.from(buffer));
    const entries = zip.getEntries();
    console.log(`Found ${entries.length} files in ${url}`);
    
    let totalSize = 0;
    for (const entry of entries) {
      totalSize += entry.header.size;
    }
    console.log(`Total uncompressed size: ${(totalSize / 1024 / 1024).toFixed(2)} MB\n`);
  }
}

inspectZips().catch(console.error);
