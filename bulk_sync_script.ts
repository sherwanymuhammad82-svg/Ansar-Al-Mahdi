import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { readFileSync } from 'fs';

const configStr = readFileSync('./firebase-applet-config.json', 'utf-8');
const config = JSON.parse(configStr);

const app = initializeApp(config);
// Use the custom database ID if provided in the config
const db = getFirestore(app, config.firestoreDatabaseId || '(default)');

const TARGET_LANGS = ['ku', 'en', 'ps', 'fa', 'tr', 'fr', 'in', 'es', 'ru', 'uz'];
const collectionsToSync = ['PdfBooks', 'Books'];

async function runSync() {
    console.log('Starting bulk sync from Arabic to all languages...');
    let totalSynced = 0;

    for (const collName of collectionsToSync) {
        try {
            console.log(`Checking collection: ${collName}`);
            const collRef = collection(db, collName);
            const qAr = query(collRef, where('language', '==', 'ar'));
            const arSnapshot = await getDocs(qAr);
            
            if (arSnapshot.empty) {
                console.log(`No Arabic books found in ${collName}`);
                continue;
            }

            console.log(`Found ${arSnapshot.docs.length} Arabic books in ${collName}. Syncing to ${TARGET_LANGS.length} languages...`);

            for (const lang of TARGET_LANGS) {
                const qTarget = query(collRef, where('language', '==', lang));
                const targetSnapshot = await getDocs(qTarget);
                const existingTitles = new Set(targetSnapshot.docs.map(doc => {
                    const d = doc.data();
                    return d.title || d.title_ar || d.title_ku;
                }));

                const batch = writeBatch(db);
                let batchCount = 0;

                for (const arDoc of arSnapshot.docs) {
                    const data = arDoc.data();
                    const title = data.title || data.title_ar;
                    
                    if (!existingTitles.has(title)) {
                        const newRef = doc(collRef);
                        batch.set(newRef, {
                            ...data,
                            language: lang,
                            syncedFrom: 'ar',
                            createdAt: serverTimestamp()
                        });
                        batchCount++;
                        totalSynced++;
                        
                        if (batchCount >= 400) {
                            await batch.commit();
                            console.log(`  - Committed block for ${lang}`);
                            batchCount = 0;
                        }
                    }
                }

                if (batchCount > 0) {
                    await batch.commit();
                }
                console.log(`  - Completed sync for ${lang}.`);
            }
        } catch (error) {
            console.error(`Error syncing ${collName}:`, error);
        }
    }

    console.log(`Sync completed! Total records synchronized: ${totalSynced}`);
    process.exit(0);
}

runSync().catch(err => {
    console.error('Fatal sync error:', err);
    process.exit(1);
});
