import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function check() {
  const snapshot = await getDocs(collection(db, 'Books'));
  const categories = new Set();
  snapshot.forEach(doc => categories.add(doc.data().category));
  console.log("Categories:", Array.from(categories));
  process.exit(0);
}
check();
