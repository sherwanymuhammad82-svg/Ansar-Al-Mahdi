import admin from "firebase-admin";
import fs from "fs";
import path from "path";

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'firebase-service-account.json'), 'utf8'));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrate() {
  console.log("🚀 Starting migration...");

  // 1. Banners
  const banners = [
    {
      imageUrl: 'https://lh3.googleusercontent.com/d/1UChpvocuXAUmU0drDCUCpyJNgiktMf4u',
      title: {
        ar: '80 صفة من صفات المهدي في الشيخ حسن التهامي - الجزء الأول',
        ku: '٨٠ سیفەتی ئیمام مەهدی لە شێخ حسن توهامی بەشی یەکەم'
      },
      target: { tab: 'home', section: 'tahami', postId: 'tahami-video-4' }
    },
    {
      imageUrl: 'https://lh3.googleusercontent.com/d/11JK5ftIiIUAf2q6dhwIh_cacQMcdXUQA',
      title: {
        ar: 'هل شك أحد في المهدي حتى الآن؟ انقر لتعرف',
        ku: 'ئایە کەس گومانی مەهدی لێکراوە تائێستا ؟ کلیک بکە و بزانە'
      },
      target: { tab: 'home', section: 'tahami', postId: 'tahami-video-1' }
    },
    {
      imageUrl: 'https://lh3.googleusercontent.com/d/1vqHKbVDZyBYlu1assk3s64uOfZE6nCVG',
      title: {
        ar: 'حرب الروم والفرس',
        ku: 'جەنگی نێوان ڕۆم و ئێران'
      },
      target: { tab: 'home', section: 'warplan' }
    },
    {
      imageUrl: 'https://lh3.googleusercontent.com/d/1Yzpu8qamiv7RymoguYvB10H9YwluyVs4',
      title: {
        ar: 'لماذا غُيب الشيخ محمد عبد الله؟ انقر لتعرف',
        ku: 'بێسەرو شوێنکردنی شێخ محمد عبدالله بۆچی؟ کلیك بکە و بزانە'
      },
      target: { tab: 'home', section: 'tahami', postId: 'tahami-video-2' }
    },
    {
      imageUrl: 'https://lh3.googleusercontent.com/d/1G2x-Kr3mHJ1UlgLhpGGflfeXFVTZhlWl',
      title: {
        ar: 'هل ادعى محمد عبد الله أنه المهدي؟',
        ku: 'ئایە محمد عبدالله بانگەشەی ئەوەی کردووە کە مەهدیە؟'
      },
      target: { tab: 'home', section: 'tahami', postId: 'tahami-video-3' }
    },
    {
      imageUrl: 'https://lh3.googleusercontent.com/d/1KYOrdnT3HJgJzlfm9CA2P_Fqc4WzJ-gP',
      title: {
        ar: 'خطب الشيخ حسن التهامي',
        ku: 'وتارەکانی شێخ حەسەن توهامی'
      },
      target: { tab: 'home', section: 'tahami_speeches' }
    },
    {
      imageUrl: 'https://lh3.googleusercontent.com/d/1AG2Sf6pbI8X3D97lLucIQwccCalm3s4s',
      title: {
        ar: '80 صفة من صفات المهدي في الشيخ حسن التهامي - الجزء الثاني',
        ku: '٨٠ سیفەتی ئیمام مەهدی لە شێخ حسن توهامی بەشی دووەم'
      },
      target: { tab: 'home', section: 'tahami', postId: 'tahami-video-5' }
    }
  ];

  for (const banner of banners) {
    await db.collection('Banners').add({
      ...banner,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`✅ Banner added: ${banner.title.ku}`);
  }

  // 2. Settings
  await db.collection('Settings').doc('main').set({
    backgroundImage: "https://lh3.googleusercontent.com/d/1vA_Y6hM6_S_8_S_8_S_8_S_8_S_8_S_8", // Placeholder
    primaryColor: "amber",
    appIcon: "https://lh3.googleusercontent.com/d/1vA_Y6hM6_S_8_S_8_S_8_S_8_S_8_S_8"
  }, { merge: true });
  console.log("✅ Settings migrated.");

  console.log("🏁 Migration complete!");
}

migrate().catch(console.error);
