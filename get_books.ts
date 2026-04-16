import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function getBooks() {
  const snapshot = await getDocs(collection(db, 'books'));
  snapshot.forEach(doc => {
    console.log(doc.id, doc.data().title, doc.data().title_ku);
  });
  process.exit(0);
}
getBooks();
