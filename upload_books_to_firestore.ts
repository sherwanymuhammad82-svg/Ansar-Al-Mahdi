import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import AdmZip from "adm-zip";

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'firebase-service-account.json'), 'utf8'));
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function uploadBooks() {
  console.log("🚀 Starting book upload to Firestore...");

  const zips = [
    {
      url: 'https://github.com/sherwanymuhammad82-svg/my-book-api/releases/download/4/Hanbali_books.zip',
      prefix: 'hanbali_'
    },
    {
      url: 'https://github.com/sherwanymuhammad82-svg/Fqh/archive/refs/heads/main.zip',
      prefix: ''
    }
  ];

  for (const zipInfo of zips) {
    console.log(`Downloading ${zipInfo.url}...`);
    const response = await fetch(zipInfo.url);
    if (!response.ok) throw new Error(`Failed to fetch ${zipInfo.url}`);
    
    const buffer = await response.buffer();
    const zip = new AdmZip(buffer);
    
    const entries = zip.getEntries().filter(e => e.entryName.endsWith('.json'));
    console.log(`Found ${entries.length} JSON files in ZIP.`);

    for (const entry of entries) {
      const contentStr = entry.getData().toString('utf8');
      let data;
      try {
        data = JSON.parse(contentStr);
      } catch (e) {
        console.warn(`Failed to parse ${entry.entryName}`);
        continue;
      }

      const text = data.content || data.text || '';
      if (!text) continue;

      // Extract book ID from filename (remove path and .json)
      const baseName = entry.entryName.split('/').pop()?.replace('.json', '') || '';
      // If the file is already named hanbali_something, don't add prefix again
      let bookId = baseName;
      if (zipInfo.prefix && !baseName.startsWith(zipInfo.prefix)) {
        bookId = `${zipInfo.prefix}${baseName}`;
      }

      // Split text if it's too large (Firestore limit is 1MB, let's split at 500,000 chars)
      const MAX_CHARS = 500000;
      let part = 1;
      for (let i = 0; i < text.length; i += MAX_CHARS) {
        const chunk = text.substring(i, i + MAX_CHARS);
        const docId = `${bookId}_${part}`;
        
        await db.collection('book_contents').doc(docId).set({
          id: docId,
          book_id: bookId,
          text: chunk,
          part: part
        });
        
        console.log(`✅ Uploaded ${docId}`);
        part++;
      }
    }
  }

  console.log("🏁 Book upload complete!");
}

uploadBooks().catch(console.error);
