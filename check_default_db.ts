import admin from 'firebase-admin';
import fs from 'fs';

const serviceAccount = JSON.parse(fs.readFileSync('./firebase-service-account.json', 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function check() {
  const db = admin.firestore();
  const snapshot = await db.collection('Books').get();
  const categories = new Set();
  snapshot.forEach(doc => categories.add(doc.data().category));
  console.log("Categories in default DB:", Array.from(categories));
  process.exit(0);
}
check();
