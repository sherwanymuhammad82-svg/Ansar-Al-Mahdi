import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager, 
  doc, 
  getDocFromServer 
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase SDK
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()?.[0];

// Initialize Firestore with modern persistent cache settings
const firestoreSettings = {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
};

export const db = initializeFirestore(
  app, 
  firestoreSettings, 
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)' 
    ? firebaseConfig.firestoreDatabaseId 
    : undefined
);

export const auth = getAuth(app);
export const storage = getStorage(app);

// Test connection
async function testConnection() {
  try {
    // Try to get a non-existent doc just to check connectivity/permissions
    await getDocFromServer(doc(db, '_connection_test_', 'ping'));
    console.log("Firestore connection test successful");
  } catch (error: any) {
    if (error.message?.includes('the client is offline')) {
      console.error("Firestore Error: The client is offline. Please check your Firebase configuration and internet connection.");
    } else {
      console.warn("Firestore connection test notice:", error.message);
    }
  }
}
testConnection();
