import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Save, Image as ImageIcon, Palette, Plus, Trash2, Send, Layout, Database, Youtube, RefreshCw } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, updateDoc, setDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { migrateDataToFirestore, syncArabicToKurdish, syncArabicToAll } from '../services/migrationService';
import { safeFetch } from '../utils/fetchUtils';

export default function AdminSettings({ language, appSettings, setAppSettings, currentUser, setCurrentUser }: { language: string, appSettings: any, setAppSettings: any, currentUser: any, setCurrentUser: (user: any) => void }) {
  const [settings, setSettings] = useState(appSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Posting Tool State
  const [postTitleAr, setPostTitleAr] = useState('');
  const [postTitleKu, setPostTitleKu] = useState('');
  const [postContentAr, setPostContentAr] = useState('');
  const [postContentKu, setPostContentKu] = useState('');
  const [postImageUrl, setPostImageUrl] = useState('');
  const [postCategory, setPostCategory] = useState('mahdi');
  const [isPosting, setIsPosting] = useState(false);
  const [adminPosts, setAdminPosts] = useState<any[]>([]);

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      setIsAuthenticated(true);
    }
  }, [currentUser]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAdminPosts();
    }
  }, [isAuthenticated]);

  const fetchAdminPosts = async () => {
    try {
      const q = query(collection(db, 'admin_posts'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const posts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAdminPosts(posts);
    } catch (error: any) {
      handleFirestoreError(error, OperationType.GET, 'admin_posts');
    }
  };

  const t = (key: string) => {
    const strings: any = {
      adminLogin: { ar: 'تسجيل دخول الإدارة', ku: 'چوونە ژوورەوەی بەڕێوەبەر', en: 'Admin Login', in: 'Login Admin' },
      enterPin: { ar: 'أدخل الرمز السري للوصول إلى أدوات الإدارة', ku: 'کۆدی نهێنی بنووسە بۆ دەستگەیشتن بە ئامرازەکانی بەڕێوەبەر', en: 'Enter PIN to access admin tools', in: 'Masukkan PIN untuk mengakses alat admin' },
      confirm: { ar: 'تأكيد', ku: 'پشتڕاستکردنەوە', en: 'Confirm', in: 'Konfirmasi' },
      wrongPin: { ar: 'رمز خاطئ', ku: 'کۆدەکە هەڵەیە', en: 'Wrong PIN', in: 'PIN Salah' },
      fillAll: { ar: 'يرجى ملء جميع الحقول', ku: 'تکایە هەموو خانەکان پڕ بکەرەوە', en: 'Please fill all fields', in: 'Harap isi semua bidang' },
      success: { ar: 'تم بنجاح', ku: 'بە سەرکەوتوویی ئەنجامدرا', en: 'Success', in: 'Berhasil' },
      error: { ar: 'حدث خطأ', ku: 'هەڵەیەک ڕوویدا', en: 'Error', in: 'Kesalahan' },
      confirmAction: { ar: 'هل أنت متأكد؟', ku: 'ئایا دڵنیایت؟', en: 'Are you sure?', in: 'Apakah Anda yakin?' },
      appSettings: { ar: 'إعدادات التطبيق', ku: 'ڕێکخستنەکانی ئەپ', en: 'App Settings', in: 'Pengaturan Aplikasi' },
      bgImage: { ar: 'رابط صورة الخلفية', ku: 'بەستەری وێنەی پاشبنەمای', en: 'Background Image URL', in: 'URL Gambar Latar Belakang' },
      primaryColor: { ar: 'اللون الأساسي', ku: 'ڕەنگی سەرەکی', en: 'Primary Color', in: 'Warna Utama' },
      saveSettings: { ar: 'حفظ الإعدادات', ku: 'پاشەکەوتکردنی ڕێکخستنەکان', en: 'Save Settings', in: 'Simpan Pengaturan' },
      youtubeChannels: { ar: 'قنوات اليوتيوب أو قوائم التشغيل', ku: 'کەناڵەکانی یوتوب یان پلەیلیست', en: 'YouTube Channels or Playlists', in: 'Saluran atau Daftar Putar YouTube' },
      channelKu: { ar: 'قناة الكردية (ID أو رابط)', ku: 'کەناڵی کوردی (ئایدی یان لینک)', en: 'Kurdish Channel (ID or URL)', in: 'Saluran Kurdi (ID atau URL)' },
      channelAr: { ar: 'قناة العربية (ID أو رابط)', ku: 'کەناڵی عەرەبی (ئایدی یان لینک)', en: 'Arabic Channel (ID or URL)', in: 'Saluran Arab (ID atau URL)' },
      channelEn: { ar: 'قناة الإنجليزية (ID أو رابط)', ku: 'کەناڵی ئینگلیزی (ئایدی یان لینک)', en: 'English Channel (ID or URL)', in: 'Saluran Inggris (ID atau URL)', fr: 'Chaîne Anglaise (ID ou URL)' },
      channelIn: { ar: 'قناة الإندونيسية (ID أو رابط)', ku: 'کەناڵی ئەندۆنیسی (ئایدی یان لینک)', en: 'Indonesian Channel (ID or URL)', in: 'Saluran Indonesia (ID atau URL)', fr: 'Chaîne Indonésienne (ID ou URL)' },
      channelFr: { ar: 'قناة الفرنسية (ID أو رابط)', ku: 'کەناڵی فەڕەنسی (ئایدی یان لینک)', en: 'French Channel (ID or URL)', in: 'Saluran Prancis (ID atau URL)', fr: 'Chaîne Française (ID ou URL)' },
      channelPs: { ar: 'قناة البشتوية (ID أو رابط)', ku: 'کەناڵی پەشتۆ (ئایدی یان لینک)', en: 'Pashto Channel (ID or URL)', in: 'Saluran Pashto (ID atau URL)', fr: 'Chaîne Pachto (ID ou URL)' },
      channelFa: { ar: 'قناة الفارسية (ID أو رابط)', ku: 'کەناڵی فارسی (ئایدی یان لینک)', en: 'Persian Channel (ID or URL)', in: 'Saluran Persia (ID atau URL)', fr: 'Chaîne Persane (ID ou URL)' },
      channelTr: { ar: 'قناة التركية (ID أو رابط)', ku: 'کەناڵی تورکی (ئایدی یان لینک)', en: 'Turkish Channel (ID or URL)', in: 'Saluran Turki (ID atau URL)', fr: 'Chaîne Turque (ID ou URL)' },
      channelEs: { ar: 'قناة الإسبانية (ID أو رابط)', ku: 'کەناڵی ئیسپانی (ئایدی یان لینک)', en: 'Spanish Channel (ID or URL)', in: 'Saluran Spanyol (ID atau URL)', fr: 'Chaîne Espagnole (ID ou URL)' },
      channelRu: { ar: 'قناة الروسية (ID أو رابط)', ku: 'کەناڵی ڕووسی (ئایدی یان لینک)', en: 'Russian Channel (ID or URL)', ru: 'Русский канал (ID или URL)', uz: 'Rus kanali (ID yoki URL)' },
      channelUz: { ar: 'قناة الأوزبكية (ID أو رابط)', ku: 'کەناڵی ئۆزبەکستانی (ئایدی یان لینک)', en: 'Uzbek Channel (ID or URL)', ru: 'Узбекский канал (ID или URL)', uz: 'O\'zbek kanali (ID yoki URL)' },
      advancedPosting: { ar: 'أداة النشر المتقدمة', ku: 'ئامرازی بڵاوکردنەوەی پێشکەوتوو', en: 'Advanced Posting Tool', in: 'Alat Posting Lanjutan' },
      migrateData: { ar: 'نقل البيانات إلى قاعدة البيانات', ku: 'گواستنەوەی داتاکان بۆ بنکەی زانیاری', en: 'Migrate Data to Firestore', in: 'Migrasi Data ke Firestore' },
      fetchGithub: { ar: 'جلب الكتب من GitHub', ku: 'هێنانی کتێبەکان لە GitHub', en: 'Fetch Books from GitHub', in: 'Ambil Buku dari GitHub' },
      publishNow: { ar: 'نشر الآن', ku: 'بڵاوکردنەوەی ئێستا', en: 'Publish Now', in: 'Terbitkan Sekarang' },
      managePosts: { ar: 'إدارة المنشورات', ku: 'بەڕێوەبردنی بڵاوکراوەکان', en: 'Manage Posts', in: 'Kelola Postingan' },
      titleAr: { ar: 'العنوان (عربي)', ku: 'ناونیشان (عەرەبی)', en: 'Title (Arabic)', in: 'Judul (Arab)' },
      titleKu: { ar: 'العنوان (کوردی)', ku: 'ناونیشان (کوردی)', en: 'Title (Kurdish)', in: 'Judul (Kurdi)' },
      contentAr: { ar: 'المحتوى (عربي)', ku: 'ناوەڕۆک (عەرەبی)', en: 'Content (Arabic)', in: 'Konten (Arab)' },
      contentKu: { ar: 'ناوەرۆک (کوردی)', ku: 'ناوەرۆک (کوردی)', en: 'Content (Kurdish)', in: 'Konten (Kurdi)' },
      imageUrl: { ar: 'رابط الصورة (Image URL)', ku: 'لینکی وێنە (Image URL)', en: 'Image URL', in: 'URL Gambar' },
      themeSelection: { ar: 'المظهر', ku: 'ڕووکار', en: 'Appearance', in: 'Penampilan' },
      oliveGold: { ar: 'الزيتوني والذهبي', ku: 'زەیتونی و زێڕین', en: 'Olive & Gold', in: 'Zaitun & Emas' },
      blue: { ar: 'أزرق', ku: 'شین', en: 'Blue', in: 'Biru' },
      purple: { ar: 'أرجواني', ku: 'مۆر', en: 'Purple', in: 'Ungu' },
      red: { ar: 'أحمر', ku: 'سوور', en: 'Red', in: 'Merah' },
      success_msg: { ar: 'تم الحفظ بنجاح', ku: 'بە سەرکەوتوویی پاشەکەوت کرا', en: 'Saved successfully', in: 'Berhasil disimpan' },
      error_msg: { ar: 'حدث خطأ أثناء الحفظ', ku: 'هەڵەیەک ڕوویدا لە کاتی پاشەکەوتکردن', en: 'Error saving settings', in: 'Gagal menyimpan pengaturan' },
      mahdiSection: { ar: 'قسم الإمام المهدي', ku: 'بەشی ئیمام مەهدی', en: 'Imam Mahdi Section', in: 'Bagian Imam Mahdi' },
      generalSection: { ar: 'قسم عام', ku: 'بەشی گشتی', en: 'General Section', in: 'Bagian Umum' },
      newsSection: { ar: 'قسم الأخبار', ku: 'بەشی هەواڵەکان', en: 'News Section', in: 'Bagian Berita' },
      syncContent: { ar: 'مزامنة المحتوى (عربي -> كوردي)', ku: 'هاوکاتکردنی ناوەڕۆک (عەرەبی -> کوردی)', en: 'Sync Content (AR -> KU)', in: 'Sinkronkan Konten (AR -> KU)' },
      syncToAll: { ar: 'مزامنة مع جميع اللغات', ku: 'هاوکاتکردن لەگەڵ هەموو زمانەکان', en: 'Sync to All Languages', in: 'Sinkronkan ke Semua Bahasa' },
      syncing: { ar: 'جاري المزامنة...', ku: 'هاوکاتکردن دەکرێت...', en: 'Syncing...', in: 'Sinkronisasi...' },
    };
    return strings[key]?.[language] || strings[key]?.['en'] || key;
  };

  if (!isAuthenticated) {
    return (
      <div className="p-6 pb-32 max-w-2xl mx-auto flex flex-col items-center justify-center h-full">
        <h2 className="text-2xl font-bold text-gold mb-6">
          {t('adminLogin')}
        </h2>
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 w-full max-w-sm shadow-2xl backdrop-blur-sm">
          <button
            onClick={() => setIsAuthenticated(true)}
            className="w-full bg-olive text-gold py-3 rounded-xl font-bold hover:bg-olive/80 transition-colors"
          >
            {t('confirm')}
          </button>
        </div>
      </div>
    );
  }

  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncContent = async () => {
    if (!window.confirm(t('confirmAction'))) return;
    setIsSyncing(true);
    try {
      const count = await syncArabicToKurdish();
      alert(`${t('success')}: ${count} items synced.`);
    } catch (error) {
      alert(t('error'));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncToAll = async () => {
    if (!window.confirm(t('confirmAction'))) return;
    setIsSyncing(true);
    try {
      const count = await syncArabicToAll();
      alert(`${t('success')}: ${count} items synced across all languages.`);
    } catch (error) {
      alert(t('error'));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCreatePost = async () => {
    if (!postTitleAr || !postTitleKu || !postContentAr || !postContentKu) {
      alert(t('fillAll'));
      return;
    }

    setIsPosting(true);
    try {
      await addDoc(collection(db, 'admin_posts'), {
        title: { ar: postTitleAr, ku: postTitleKu },
        content: { ar: postContentAr, ku: postContentKu },
        imageUrl: postImageUrl,
        category: postCategory,
        author: { ar: 'المهاجر العراقي', ku: 'المهاجر العراقي' },
        createdAt: new Date().toISOString()
      });
      
      setPostTitleAr('');
      setPostTitleKu('');
      setPostContentAr('');
      setPostContentKu('');
      setPostImageUrl('');
      fetchAdminPosts();
      alert(t('success'));
    } catch (error: any) {
      handleFirestoreError(error, OperationType.CREATE, 'admin_posts');
    } finally {
      setIsPosting(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!window.confirm(t('confirmAction'))) return;
    try {
      await deleteDoc(doc(db, 'admin_posts', id));
      fetchAdminPosts();
    } catch (error: any) {
      handleFirestoreError(error, OperationType.DELETE, `admin_posts/${id}`);
    }
  };

  // API Key Management
  const [apiKeys, setApiKeys] = useState<string[]>([]);
  
  useEffect(() => {
    if (appSettings?.geminiApiKeys) {
      setApiKeys(appSettings.geminiApiKeys);
    }
  }, [appSettings]);
  
  const handleAddApiKey = () => setApiKeys([...apiKeys, '']);
  const handleRemoveApiKey = (index: number) => setApiKeys(apiKeys.filter((_, i) => i !== index));
  const handleApiKeyChange = (index: number, value: string) => {
    const newKeys = [...apiKeys];
    newKeys[index] = value;
    setApiKeys(newKeys);
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const settingsToSave = { ...settings, geminiApiKeys: apiKeys.filter(k => k.trim() !== '') };
      await setDoc(doc(db, 'Settings', 'main'), settingsToSave, { merge: true });
      setAppSettings(settingsToSave);
      alert(t('success'));
    } catch (error: any) {
      handleFirestoreError(error, OperationType.WRITE, 'Settings/main');
      alert(t('error'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 pb-32 max-w-2xl mx-auto space-y-12">
      {/* App Settings */}
      <section>
        <h2 className="text-2xl font-bold text-gold mb-6 flex items-center gap-3">
          <Palette className="w-6 h-6" />
          {t('appSettings')}
        </h2>
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6 shadow-xl backdrop-blur-sm">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
              <Database className="w-4 h-4 text-gold" />
              Gemini API Keys
            </label>
            {apiKeys.map((key, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="password"
                  value={key}
                  onChange={(e) => handleApiKeyChange(index, e.target.value)}
                  className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold/50"
                  placeholder="Enter API Key"
                />
                <button onClick={() => handleRemoveApiKey(index)} className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
            <button onClick={handleAddApiKey} className="w-full py-2 border border-dashed border-gold/50 rounded-xl text-gold text-sm font-bold hover:bg-gold/10">
              <Plus className="w-4 h-4 inline mr-2" /> Add Key
            </button>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-gold" />
              {t('bgImage')}
            </label>
            <input
              type="text"
              value={settings.backgroundImage || ''}
              onChange={(e) => setSettings({ ...settings, backgroundImage: e.target.value })}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold/50"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
              <Palette className="w-4 h-4 text-gold" />
              {t('primaryColor')}
            </label>
            <select
              value={settings.primaryColor || 'olive'}
              onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold/50"
            >
              <option value="olive">{t('oliveGold')}</option>
              <option value="blue">{t('blue')}</option>
              <option value="purple">{t('purple')}</option>
              <option value="red">{t('red')}</option>
            </select>
          </div>

          <div className="pt-4 border-t border-white/10">
            <h3 className="text-gold font-bold mb-4 flex items-center gap-2">
              <Youtube className="w-4 h-4" />
              {t('youtubeChannels')}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">{t('channelKu')}</label>
                <input
                  type="text"
                  value={settings.youtubeChannelKu || ''}
                  onChange={(e) => setSettings({ ...settings, youtubeChannelKu: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-gold/50"
                  placeholder="Channel ID"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">{t('channelAr')}</label>
                <input
                  type="text"
                  value={settings.youtubeChannelAr || ''}
                  onChange={(e) => setSettings({ ...settings, youtubeChannelAr: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-gold/50"
                  placeholder="Channel ID"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">{t('channelEn')}</label>
                <input
                  type="text"
                  value={settings.youtubeChannelEn || ''}
                  onChange={(e) => setSettings({ ...settings, youtubeChannelEn: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-gold/50"
                  placeholder="Channel ID"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">{t('channelIn')}</label>
                <input
                  type="text"
                  value={settings.youtubeChannelIn || ''}
                  onChange={(e) => setSettings({ ...settings, youtubeChannelIn: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-gold/50"
                  placeholder="Channel ID"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">{t('channelFr')}</label>
                <input
                  type="text"
                  value={settings.youtubeChannelFr || ''}
                  onChange={(e) => setSettings({ ...settings, youtubeChannelFr: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-gold/50"
                  placeholder="Channel ID"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">{t('channelPs')}</label>
                <input
                  type="text"
                  value={settings.youtubeChannelPs || ''}
                  onChange={(e) => setSettings({ ...settings, youtubeChannelPs: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-gold/50"
                  placeholder="Channel ID"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">{t('channelFa')}</label>
                <input
                  type="text"
                  value={settings.youtubeChannelFa || ''}
                  onChange={(e) => setSettings({ ...settings, youtubeChannelFa: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-gold/50"
                  placeholder="Channel ID"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">{t('channelTr')}</label>
                <input
                  type="text"
                  value={settings.youtubeChannelTr || ''}
                  onChange={(e) => setSettings({ ...settings, youtubeChannelTr: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-gold/50"
                  placeholder="Channel ID"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">{t('channelEs')}</label>
                <input
                  type="text"
                  value={settings.youtubeChannelEs || ''}
                  onChange={(e) => setSettings({ ...settings, youtubeChannelEs: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-gold/50"
                  placeholder="Channel ID"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">{t('channelRu')}</label>
                <input
                  type="text"
                  value={settings.youtubeChannelRu || ''}
                  onChange={(e) => setSettings({ ...settings, youtubeChannelRu: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-gold/50"
                  placeholder="Channel ID"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">{t('channelUz')}</label>
                <input
                  type="text"
                  value={settings.youtubeChannelUz || ''}
                  onChange={(e) => setSettings({ ...settings, youtubeChannelUz: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-gold/50"
                  placeholder="Channel ID"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10">
            <h3 className="text-gold font-bold mb-4 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Logo Settings
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Logo URL</label>
                <input
                  type="text"
                  value={settings.logoUrl || ''}
                  onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-gold/50"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Size</label>
                  <input
                    type="number"
                    value={settings.logoSize || 96}
                    onChange={(e) => setSettings({ ...settings, logoSize: parseInt(e.target.value) })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-gold/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Top</label>
                  <input
                    type="number"
                    value={settings.logoTop || 8}
                    onChange={(e) => setSettings({ ...settings, logoTop: parseInt(e.target.value) })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-gold/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Right</label>
                  <input
                    type="number"
                    value={settings.logoRight || 8}
                    onChange={(e) => setSettings({ ...settings, logoRight: parseInt(e.target.value) })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-gold/50"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="w-full bg-olive text-gold font-bold py-3 rounded-xl hover:bg-olive/80 transition-colors disabled:opacity-50"
          >
            {isSaving ? '...' : t('saveSettings')}
          </button>

          <div className="pt-4 border-t border-white/10 space-y-3">
            <button
              onClick={handleSyncContent}
              disabled={isSyncing}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? t('syncing') : t('syncContent')}
            </button>
            
            <button
              onClick={handleSyncToAll}
              disabled={isSyncing}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? t('syncing') : t('syncToAll')}
            </button>
            <p className="text-[10px] text-slate-500 mt-2 text-center">
              Copies current Arabic PDF books and General library books to ALL supported languages (without duplicates)
            </p>
          </div>
        </div>
      </section>

      {/* Advanced Posting Tool */}
      <section>
        <h2 className="text-2xl font-bold text-gold mb-6 flex items-center gap-3">
          <Plus className="w-6 h-6" />
          {t('advancedPosting')}
        </h2>
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4 shadow-xl backdrop-blur-sm">
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder={t('titleAr')}
              value={postTitleAr}
              onChange={(e) => setPostTitleAr(e.target.value)}
              className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold/50"
            />
            <input
              type="text"
              placeholder={t('titleKu')}
              value={postTitleKu}
              onChange={(e) => setPostTitleKu(e.target.value)}
              className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold/50 text-right"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <textarea
              placeholder={t('contentAr')}
              value={postContentAr}
              onChange={(e) => setPostContentAr(e.target.value)}
              className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold/50 min-h-[100px]"
            />
            <textarea
              placeholder={t('contentKu')}
              value={postContentKu}
              onChange={(e) => setPostContentKu(e.target.value)}
              className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold/50 min-h-[100px] text-right"
            />
          </div>
          <input
            type="text"
            placeholder={t('imageUrl')}
            value={postImageUrl}
            onChange={(e) => setPostImageUrl(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold/50"
            dir="ltr"
          />
          <select
            value={postCategory}
            onChange={(e) => setPostCategory(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold/50"
          >
            <option value="mahdi">{t('mahdiSection')}</option>
            <option value="general">{t('generalSection')}</option>
            <option value="news">{t('newsSection')}</option>
          </select>
          <button
            onClick={handleCreatePost}
            disabled={isPosting}
            className="w-full bg-gradient-to-r from-olive to-gold text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <Send className="w-5 h-5" />
            {isPosting ? '...' : t('publishNow')}
          </button>
        </div>
      </section>

      {/* Manage Posts */}
      <section>
        <h2 className="text-2xl font-bold text-gold mb-6 flex items-center gap-3">
          <Layout className="w-6 h-6" />
          {t('managePosts')}
        </h2>
        <div className="space-y-4">
          {adminPosts.map(post => (
            <div key={post.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex justify-between items-center shadow-xl backdrop-blur-sm">
              <div className="flex items-center gap-4">
                {post.imageUrl && <img src={post.imageUrl} className="w-12 h-12 rounded-lg object-cover" />}
                <div>
                  <h4 className="text-white font-medium">{post.title[language]}</h4>
                  <span className="text-xs text-gold uppercase">{post.category}</span>
                </div>
              </div>
              <button onClick={() => handleDeletePost(post.id)} className="text-red-500/50 hover:text-red-500 p-2">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
