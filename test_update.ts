import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function test() {
  try {
    const docRef = doc(db, 'books', 'احادیث_الفتن_ودورنا_مع_التعامل_معھا');
    await updateDoc(docRef, { title_ku: "test" });
    console.log("Update successful");
  } catch (e) {
    console.error("Error:", e);
  }
  process.exit(0);
}
test();
