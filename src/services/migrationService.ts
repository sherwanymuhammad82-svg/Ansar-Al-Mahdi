import { db } from '../firebase';
import { collection, addDoc, writeBatch, doc, query, getDocs, where, serverTimestamp } from 'firebase/firestore';
import { METHODOLOGY_CONTENT } from '../data/methodology';
import { FATWAS_CONTENT } from '../data/fatwas';
import { TAHAMI_CONTENT } from '../data/tahami';
import { MAHDI_CONTENT } from '../data/mahdi';

export const migrateDataToFirestore = async () => {
    const batch = writeBatch(db);

    // Migrate Methodology
    const methodologyRef = doc(collection(db, 'methodology'));
    batch.set(methodologyRef, METHODOLOGY_CONTENT);

    // Migrate Fatwas
    if (FATWAS_CONTENT.items) {
        FATWAS_CONTENT.items.forEach(fatwa => {
            const fatwaRef = doc(collection(db, 'fatwas'));
            batch.set(fatwaRef, fatwa);
        });
    }

    // Migrate Tahami
    if (TAHAMI_CONTENT.items) {
        TAHAMI_CONTENT.items.forEach(item => {
            const tahamiRef = doc(collection(db, 'tahami'));
            batch.set(tahamiRef, item);
        });
    }

    // Migrate Mahdi
    const mahdiItems = (MAHDI_CONTENT as any).items || (MAHDI_CONTENT as any).sections || (MAHDI_CONTENT as any).chapters || [];
    mahdiItems.forEach((item: any) => {
        const mahdiRef = doc(collection(db, 'mahdi'));
        batch.set(mahdiRef, item);
    });

    await batch.commit();
    console.log("Data migrated successfully");
};

export const syncSingleBookToAll = async (bookData: any, collectionName: string) => {
    const TARGET_LANGS = ['ku', 'en', 'ps', 'fa', 'tr', 'fr', 'in', 'es', 'ru', 'uz'];
    let syncedCount = 0;
    
    try {
        const collRef = collection(db, collectionName);
        const title = bookData.title || bookData.title_ar;

        for (const lang of TARGET_LANGS) {
            // Check if book already exists in this language
            const q = query(collRef, where('language', '==', lang), where('title', '==', title));
            const snapshot = await getDocs(q);
            
            if (snapshot.empty) {
                await addDoc(collRef, {
                    ...bookData,
                    id: undefined, // Let Firestore generate new ID
                    language: lang,
                    syncedFrom: 'ar',
                    createdAt: serverTimestamp()
                });
                syncedCount++;
            }
        }
    } catch (error) {
        console.error("Error syncing single book:", error);
        throw error;
    }
    
    return syncedCount;
};

export const syncArabicToAll = async () => {
    const collectionsToSync = ['PdfBooks', 'Books'];
    const TARGET_LANGS = ['ku', 'en', 'ps', 'fa', 'tr', 'fr', 'in', 'es', 'ru', 'uz'];
    let totalSynced = 0;
    let quotaExceeded = false;

    for (const collName of collectionsToSync) {
        if (quotaExceeded) break;
        try {
            const collRef = collection(db, collName);
            const qAr = query(collRef, where('language', '==', 'ar'));
            const arSnapshot = await getDocs(qAr);
            
            if (arSnapshot.empty) continue;

            for (const lang of TARGET_LANGS) {
                if (quotaExceeded) break;
                const qTarget = query(collRef, where('language', '==', lang));
                const targetSnapshot = await getDocs(qTarget);
                const existingTitles = new Set(targetSnapshot.docs.map(doc => doc.data().title || doc.data().title_ar || doc.data().title_ku));

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
                        
                        // Commit every 400 docs to avoid batch limit (500)
                        if (batchCount >= 400) {
                            try {
                                await batch.commit();
                                batchCount = 0;
                            } catch (err: any) {
                                if (err.message?.includes('resource-exhausted')) {
                                    quotaExceeded = true;
                                    break;
                                }
                                throw err;
                            }
                        }
                    }
                }

                if (batchCount > 0 && !quotaExceeded) {
                    try {
                        await batch.commit();
                        console.log(`Synced ${batchCount} books from Arabic to ${lang} in collection: ${collName}`);
                    } catch (err: any) {
                        if (err.message?.includes('resource-exhausted')) {
                            quotaExceeded = true;
                        } else {
                            throw err;
                        }
                    }
                }
            }
        } catch (error: any) {
            console.error(`Error syncing ${collName} to all languages:`, error);
            if (error.message?.includes('resource-exhausted')) {
                quotaExceeded = true;
            }
        }
    }

    if (quotaExceeded) {
        throw new Error('quota-exceeded');
    }

    return totalSynced;
};

export const syncArabicToKurdish = async () => {
    const collectionsToSync = ['PdfBooks', 'Books'];
    let totalSynced = 0;

    for (const collName of collectionsToSync) {
        try {
            const collRef = collection(db, collName);
            const qAr = query(collRef, where('language', '==', 'ar'));
            const arSnapshot = await getDocs(qAr);
            
            const qKu = query(collRef, where('language', '==', 'ku'));
            const kuSnapshot = await getDocs(qKu);
            const kuTitles = new Set(kuSnapshot.docs.map(doc => doc.data().title || doc.data().title_ar));

            const batch = writeBatch(db);
            let batchCount = 0;

            for (const arDoc of arSnapshot.docs) {
                const data = arDoc.data();
                const title = data.title || data.title_ar;
                
                // Only sync if not already present in Kurdish
                if (!kuTitles.has(title)) {
                    const newRef = doc(collRef);
                    batch.set(newRef, {
                        ...data,
                        language: 'ku',
                        syncedFrom: 'ar',
                        createdAt: serverTimestamp()
                    });
                    batchCount++;
                    totalSynced++;
                }
            }

            if (batchCount > 0) {
                await batch.commit();
                console.log(`Synced ${batchCount} books from Arabic to Kurdish in collection: ${collName}`);
            }
        } catch (error) {
            console.error(`Error syncing ${collName}:`, error);
        }
    }

    return totalSynced;
};
