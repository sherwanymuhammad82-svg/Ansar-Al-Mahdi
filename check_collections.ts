import admin from 'firebase-admin';
import fs from 'fs';

const serviceAccount = JSON.parse(fs.readFileSync('./firebase-service-account.json', 'utf8'));
const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${config.projectId}.firebaseio.com`
});

async function check() {
  const db = admin.firestore();
  const collections = await db.listCollections();
  console.log("Collections:", collections.map(c => c.id));
  process.exit(0);
}
check();
