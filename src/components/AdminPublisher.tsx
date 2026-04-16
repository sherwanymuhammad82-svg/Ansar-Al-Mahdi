import React, { useState, useEffect } from 'react';
import { Shield, RefreshCw, CheckCircle, AlertCircle, Plus, Video, Image as ImageIcon, Type, Trash2, Upload, Code, Book, Youtube } from 'lucide-react';
import { db, storage, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

interface AdminPublisherProps {
  sectionId: string;
  language: string;
  theme: 'night' | 'white' | 'cream';
}

export default function AdminPublisher({ sectionId, language, theme }: AdminPublisherProps) {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerVideoUrl, setBannerVideoUrl] = useState('');
  const [bannerImageUrl, setBannerImageUrl] = useState('');
  const [isAddingBanner, setIsAddingBanner] = useState(false);
  const [bannerStatus, setBannerStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [banners, setBanners] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [isAddingPost, setIsAddingPost] = useState(false);
  const [postStatus, setPostStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postImageUrl, setPostImageUrl] = useState('');
  const [postVideoUrl, setPostVideoUrl] = useState('');
  const [isHtml, setIsHtml] = useState(false);

  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    return url;
  };

  const handleFileUpload = async (file: File, path: string) => {
    if (!auth.currentUser) {
      console.error("No authenticated user found for upload");
      throw new Error("You must be logged in to upload files.");
    }

    return new Promise<string>((resolve, reject) => {
      try {
        const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on('state_changed', 
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          }, 
          (error) => {
            console.error("Upload task error:", error);
            setUploadProgress(null);
            reject(error);
          }, 
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              setUploadProgress(null);
              resolve(downloadURL);
            } catch (err) {
              console.error("Error getting download URL:", err);
              reject(err);
            }
          }
        );
      } catch (err) {
        console.error("Error initializing upload:", err);
        reject(err);
      }
    });
  };

  useEffect(() => {
    if (sectionId === 'home') {
      const q = query(collection(db, 'Banners'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const b = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setBanners(b);
      });
      return unsubscribe;
    } else {
      const q = query(collection(db, 'admin_posts'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const p = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter((post: any) => post.sectionId === sectionId);
        setPosts(p);
      });
      return unsubscribe;
    }
  }, [sectionId]);

  const t = (key: string) => {
    const strings: any = {
      adminPanel: { ar: 'لوحة الإدارة', ku: 'بەشی بەڕێوەبردن', en: 'Admin Panel', in: 'Panel Admin' },
      manageContent: { ar: 'إدارة محتوى التطبيق والبيانات', ku: 'بەڕێوەبردنی ناوەڕۆکی ئەپ و زانیارییەکان', en: 'Manage app content and data', in: 'Kelola konten dan data aplikasi' },
      addBanner: { ar: 'إضافة إعلان جديد (بانر)', ku: 'زیادکردنی ڕیکلامی نوێ (بانەر)', en: 'Add New Banner', in: 'Tambah Banner Baru' },
      titleAr: { ar: 'العنوان (عربي)', ku: 'ناونیشان (عەرەبی)', en: 'Title (Arabic)', in: 'Judul (Arab)' },
      titleKu: { ar: 'العنوان (کوردی)', ku: 'ناونیشان (کوردی)', en: 'Title (Kurdish)', in: 'Judul (Kurdi)' },
      titleEn: { ar: 'العنوان (إنجليزي)', ku: 'ناونیشان (ئینگلیزی)', en: 'Title (English)', in: 'Judul (Inggris)' },
      videoUrl: { ar: 'رابط الفيديو', ku: 'لینکی ڤیدیۆ', en: 'Video URL', in: 'URL Video' },
      imageUrl: { ar: 'رابط الصورة', ku: 'لینکی وێنە', en: 'Image URL', in: 'URL Gambar' },
      publish: { ar: 'نشر', ku: 'بڵاوکردنەوە', en: 'Publish', in: 'Terbitkan' },
      currentBanners: { ar: 'الإعلانات الحالية', ku: 'ڕیکلامە ئێستاکانی', en: 'Current Banners', in: 'Banner Saat Ini' },
      noBanners: { ar: 'لا توجد إعلانات', ku: 'هیچ ڕیکلامێک نییە', en: 'No banners', in: 'Tidak ada banner' },
      addPost: { ar: 'إضافة منشور جديد', ku: 'زیادکردنی پۆستی نوێ', en: 'Add New Post', in: 'Tambah Postingan Baru' },
      contentAr: { ar: 'المحتوى (عربي)', ku: 'ناوەڕۆک (عەرەبی)', en: 'Content (Arabic)', in: 'Konten (Arab)' },
      contentKu: { ar: 'المحتوى (کوردی)', ku: 'ناوەڕۆک (کوردی)', en: 'Content (Kurdish)', in: 'Konten (Kurdi)' },
      contentEn: { ar: 'المحتوى (إنجليزي)', ku: 'ناوەڕۆک (ئینگلیزی)', en: 'Content (English)', in: 'Konten (Inggris)' },
      htmlContent: { ar: 'محتوى HTML', ku: 'ناوەڕۆکی HTML', en: 'HTML Content', in: 'Konten HTML' },
      success: { ar: 'تم بنجاح', ku: 'بە سەرکەوتوویی ئەنجامدرا', en: 'Success', in: 'Berhasil' },
      error: { ar: 'حدث خطأ', ku: 'هەڵەیەک ڕوویدا', en: 'Error', in: 'Kesalahan' },
      confirmDelete: { ar: 'هل أنت متأكد من الحذف؟', ku: 'ئایا دڵنیایت لە سڕینەوە؟', en: 'Are you sure you want to delete?', in: 'Apakah Anda yakin ingin menghapus?' },
      publishPost: { ar: 'نشر المنشور', ku: 'بڵاوکردنەوەی پۆست', en: 'Publish Post', in: 'Terbitkan Postingan' },
      currentPosts: { ar: 'المنشورات الحالية', ku: 'پۆستە ئێستاکانی', en: 'Current Posts', in: 'Postingan Saat Ini' },
      noPosts: { ar: 'لا توجد منشورات', ku: 'هیچ پۆستێک نییە', en: 'No posts', in: 'Tidak ada postingan' },
      back: { ar: 'رجوع', ku: 'گەڕانەوە', en: 'Back', in: 'Kembali' },
      publishedSuccess: { ar: 'تم النشر بنجاح', ku: 'بە سەرکەوتوویی بڵاوکرایەوە', en: 'Published successfully', in: 'Berhasil diterbitkan' },
      publishedError: { ar: 'حدث خطأ', ku: 'هەڵەیەک ڕوویدا', en: 'An error occurred', in: 'Terjadi kesalahan' },
    };
    return strings[key]?.[language] || strings[key]?.['en'] || key;
  };

  const handleDeleteBanner = async (banner: any) => {
    if (banner.id.startsWith('default-')) {
      console.warn('Cannot delete default banners.');
      return;
    }
    try {
      await deleteDoc(doc(db, 'Banners', banner.id));
    } catch (error) {
      console.error('Error deleting banner:', error);
    }
  };

  const handleDeletePost = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'admin_posts', id));
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleAddPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle) return;
    
    setIsAddingPost(true);
    setPostStatus('idle');
    try {
      let finalVideoUrl = postVideoUrl;
      if (postVideoUrl.includes('youtube.com') || postVideoUrl.includes('youtu.be')) {
        finalVideoUrl = getYouTubeEmbedUrl(postVideoUrl);
      }

      await addDoc(collection(db, 'admin_posts'), {
        title: { [language]: postTitle },
        content: { [language]: postContent },
        imageUrl: postImageUrl || null,
        videoUrl: finalVideoUrl || null,
        isHtml,
        sectionId,
        language,
        createdAt: new Date().toISOString(),
        type: finalVideoUrl ? 'video' : 'post'
      });
      setPostStatus('success');
      setPostTitle('');
      setPostContent('');
      setPostImageUrl(''); setPostVideoUrl('');
      setTimeout(() => setPostStatus('idle'), 3000);
    } catch (error) {
      console.error('Error adding post:', error);
      setPostStatus('error');
    } finally {
      setIsAddingPost(false);
    }
  };

  const handleAddBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerTitle || (!bannerVideoUrl && !bannerImageUrl)) return;
    
    setIsAddingBanner(true);
    setBannerStatus('idle');
    try {
      let finalVideoUrl = bannerVideoUrl;
      if (bannerVideoUrl.includes('youtube.com') || bannerVideoUrl.includes('youtu.be')) {
        finalVideoUrl = getYouTubeEmbedUrl(bannerVideoUrl);
      }

      await addDoc(collection(db, 'Banners'), {
        title: { [language]: bannerTitle },
        videoUrl: finalVideoUrl || null,
        imageUrl: bannerImageUrl || null,
        language: language,
        createdAt: serverTimestamp(),
        target: { tab: 'home' }
      });
      setBannerStatus('success');
      setBannerTitle('');
      setBannerVideoUrl('');
      setBannerImageUrl('');
      setTimeout(() => setBannerStatus('idle'), 3000);
    } catch (error) {
      console.error('Error adding banner:', error);
      setBannerStatus('error');
    } finally {
      setIsAddingBanner(false);
    }
  };

  return (
    <div className={`p-6 space-y-8 mb-8 rounded-3xl border ${theme === 'night' ? 'bg-stone-900/50 border-stone-800' : theme === 'cream' ? 'bg-[#fdfbf7] border-stone-200' : 'bg-slate-50 border-stone-200'}`}>
      {uploadProgress !== null && (
        <div className="fixed inset-x-0 top-0 z-[100] p-4 pointer-events-none">
          <div className="max-w-md mx-auto bg-slate-800 rounded-2xl shadow-2xl border border-olive/20 p-4 pointer-events-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-olive">
                {language === 'ar' ? 'جاري الرفع...' : language === 'en' ? 'Uploading...' : 'خەریکی بەرزکردنەوەیە...'}
              </span>
              <span className="text-xs font-bold text-olive">{Math.round(uploadProgress)}%</span>
            </div>
            <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-olive transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-10 h-10 bg-olive rounded-xl flex items-center justify-center text-white shadow-lg">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight">
            {t('adminPanel')}
          </h2>
          <p className="text-xs opacity-60">
            {t('manageContent')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Add Banner Form - Only show on Home section */}
        {sectionId === 'home' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`p-6 rounded-2xl border transition-all ${theme === 'night' ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200 shadow-sm'}`}>
              <div className="flex items-center gap-3 mb-4">
                <Video className="w-5 h-5 text-olive" />
                <h3 className="font-bold">{t('addBanner')}</h3>
              </div>
              
              <form onSubmit={handleAddBanner} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold mb-1 opacity-70">{language === 'ar' ? 'العنوان' : language === 'en' ? 'Title' : 'ناونیشان'}</label>
                  <input 
                    type="text" 
                    value={bannerTitle}
                    onChange={(e) => setBannerTitle(e.target.value)}
                    className={`w-full p-3 rounded-xl border text-sm ${theme === 'night' ? 'bg-black/50 border-stone-800 text-white' : 'bg-slate-50 border-stone-200 text-black'}`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 opacity-70">{t('videoUrl')}</label>
                  <div className="flex gap-2">
                    <input 
                      type="url" 
                      value={bannerVideoUrl}
                      onChange={(e) => setBannerVideoUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className={`flex-1 p-3 rounded-xl border text-sm ${theme === 'night' ? 'bg-black/50 border-stone-800 text-white' : 'bg-slate-50 border-stone-200 text-black'}`}
                    />
                    <label className={`p-3 rounded-xl border cursor-pointer flex items-center justify-center transition-colors ${theme === 'night' ? 'bg-white/5 border-stone-800 hover:bg-white/10' : 'bg-stone-100 border-stone-200 hover:bg-stone-200'}`}>
                      <Upload className="w-4 h-4 text-olive" />
                      <input 
                        type="file" 
                        accept="video/*" 
                        className="hidden" 
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              setBannerStatus('idle');
                              const url = await handleFileUpload(file, 'banners/videos');
                              setBannerVideoUrl(url);
                              setBannerStatus('success');
                            } catch (err: any) {
                              console.error("Banner video upload failed:", err);
                              setBannerStatus('error');
                              alert(`Upload failed: ${err.message || 'Unknown error'}`);
                            }
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 opacity-70">{t('imageUrl')}</label>
                  <div className="flex gap-2">
                    <input 
                      type="url" 
                      value={bannerImageUrl}
                      onChange={(e) => setBannerImageUrl(e.target.value)}
                      className={`flex-1 p-3 rounded-xl border text-sm ${theme === 'night' ? 'bg-black/50 border-stone-800 text-white' : 'bg-slate-50 border-stone-200 text-black'}`}
                    />
                    <label className={`p-3 rounded-xl border cursor-pointer flex items-center justify-center transition-colors ${theme === 'night' ? 'bg-white/5 border-stone-800 hover:bg-white/10' : 'bg-stone-100 border-stone-200 hover:bg-stone-200'}`}>
                      <Upload className="w-4 h-4 text-olive" />
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              setBannerStatus('idle');
                              const url = await handleFileUpload(file, 'banners/images');
                              setBannerImageUrl(url);
                              setBannerStatus('success');
                            } catch (err: any) {
                              console.error("Banner image upload failed:", err);
                              setBannerStatus('error');
                              alert(`Upload failed: ${err.message || 'Unknown error'}`);
                            }
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={isAddingBanner || (!bannerVideoUrl && !bannerImageUrl)}
                  className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${isAddingBanner || (!bannerVideoUrl && !bannerImageUrl) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'} bg-olive text-white shadow-lg shadow-olive/20 mt-4`}
                >
                  {isAddingBanner ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {t('publish')}
                </button>

                {bannerStatus !== 'idle' && (
                  <div className={`mt-4 p-3 rounded-xl flex items-center gap-2 ${bannerStatus === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    {bannerStatus === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span className="text-xs font-medium">
                      {bannerStatus === 'success' 
                        ? t('success') 
                        : t('error')}
                    </span>
                  </div>
                )}
              </form>
            </div>

            {/* Banner List */}
            <div className={`p-6 rounded-2xl border transition-all ${theme === 'night' ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200 shadow-sm'}`}>
              <h3 className="font-bold mb-4">{t('currentBanners')}</h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {banners.length === 0 ? (
                  <p className="text-xs opacity-50 text-center py-4">{t('noBanners')}</p>
                ) : (
                  banners.map((banner) => (
                    <div key={banner.id} className={`p-3 rounded-xl border flex items-center justify-between gap-4 ${theme === 'night' ? 'bg-black/30 border-stone-800' : 'bg-slate-50 border-stone-100'}`}>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{banner.title?.[language] || banner.title?.ar || banner.title?.en || banner.title?.ku || 'Untitled'}</p>
                        <p className="text-[10px] opacity-50 truncate">{banner.videoUrl || banner.imageUrl}</p>
                      </div>
                      <button 
                        onClick={() => handleDeleteBanner(banner)}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Add Post Form - Show on other sections */}
        {sectionId !== 'home' && sectionId !== 'library' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`p-6 rounded-2xl border transition-all ${theme === 'night' ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200 shadow-sm'}`}>
              <div className="flex items-center gap-3 mb-4">
                <Type className="w-5 h-5 text-olive" />
                <h3 className="font-bold">{t('addPost')}</h3>
              </div>
              
              <form onSubmit={handleAddPost} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold mb-1 opacity-70">{language === 'ar' ? 'العنوان' : language === 'en' ? 'Title' : 'ناونیشان'}</label>
                  <input 
                    type="text" 
                    value={postTitle}
                    onChange={(e) => setPostTitle(e.target.value)}
                    className={`w-full p-3 rounded-xl border text-sm ${theme === 'night' ? 'bg-black/50 border-stone-800 text-white' : 'bg-slate-50 border-stone-200 text-black'}`}
                    required
                  />
                </div>
                
                <div className="flex items-center gap-4 mb-2">
                  <button
                    type="button"
                    onClick={() => setIsHtml(!isHtml)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isHtml ? 'bg-gold text-stone-900' : 'bg-stone-200 text-stone-600'}`}
                  >
                    <Code className="w-3.5 h-3.5" />
                    {t('htmlContent')}
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1 opacity-70">{language === 'ar' ? 'المحتوى' : language === 'en' ? 'Content' : 'ناوەڕۆک'}</label>
                  <textarea 
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    rows={5}
                    placeholder={isHtml ? "<div>...</div>" : ""}
                    className={`w-full p-3 rounded-xl border text-sm ${theme === 'night' ? 'bg-black/50 border-stone-800 text-white' : 'bg-slate-50 border-stone-200 text-black'} font-mono`}
                  />
                </div>

                <div className={`grid ${sectionId === 'tahami' ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
                  {sectionId !== 'tahami' && (
                    <div>
                      <label className="block text-xs font-bold mb-1 opacity-70">{t('imageUrl')}</label>
                      <div className="flex gap-2">
                        <input 
                          type="url" 
                          value={postImageUrl}
                          onChange={(e) => setPostImageUrl(e.target.value)}
                          className={`flex-1 p-3 rounded-xl border text-sm ${theme === 'night' ? 'bg-black/50 border-stone-800 text-white' : 'bg-slate-50 border-stone-200 text-black'}`}
                        />
                        <label className={`p-3 rounded-xl border cursor-pointer flex items-center justify-center transition-colors ${theme === 'night' ? 'bg-white/5 border-stone-800 hover:bg-white/10' : 'bg-stone-100 border-stone-200 hover:bg-stone-200'}`}>
                          <Upload className="w-4 h-4 text-olive" />
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  setPostStatus('idle');
                                  const url = await handleFileUpload(file, 'posts/images');
                                  setPostImageUrl(url);
                                  setPostStatus('success');
                                } catch (err: any) {
                                  console.error("Post image upload failed:", err);
                                  setPostStatus('error');
                                  alert(`Upload failed: ${err.message || 'Unknown error'}`);
                                }
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  )}
                  {sectionId === 'tahami' && (
                    <div className="hidden">
                      {/* Blacked out image upload for Tahami as requested */}
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-bold mb-1 opacity-70">{sectionId === 'tahami' ? 'YouTube Link' : t('videoUrl')}</label>
                    <div className="flex gap-2">
                      <input 
                        type="url" 
                        value={postVideoUrl}
                        onChange={(e) => {
                          setPostVideoUrl(e.target.value);
                          // Auto-fill title if it's a YouTube link and title is empty
                          if (e.target.value.includes('youtu') && !postTitle) {
                            setPostTitle('YouTube Video');
                          }
                        }}
                        placeholder={sectionId === 'tahami' ? "https://youtube.com/..." : ""}
                        className={`flex-1 p-3 rounded-xl border text-sm ${theme === 'night' ? 'bg-black/50 border-stone-800 text-white' : 'bg-slate-50 border-stone-200 text-black'}`}
                      />
                      {sectionId === 'tahami' ? (
                        <div className={`p-3 rounded-xl border flex items-center justify-center ${theme === 'night' ? 'bg-black border-stone-800' : 'bg-stone-200 border-stone-300'}`}>
                          <Youtube className="w-4 h-4 text-red-600" />
                        </div>
                      ) : (
                        <label className={`p-3 rounded-xl border cursor-pointer flex items-center justify-center transition-colors ${theme === 'night' ? 'bg-white/5 border-stone-800 hover:bg-white/10' : 'bg-stone-100 border-stone-200 hover:bg-stone-200'}`}>
                          <Upload className="w-4 h-4 text-olive" />
                          <input 
                            type="file" 
                            accept="video/*" 
                            className="hidden" 
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  setPostStatus('idle');
                                  const url = await handleFileUpload(file, 'posts/videos');
                                  setPostVideoUrl(url);
                                  setPostStatus('success');
                                } catch (err: any) {
                                  console.error("Post video upload failed:", err);
                                  setPostStatus('error');
                                  alert(`Upload failed: ${err.message || 'Unknown error'}`);
                                }
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={isAddingPost || !postTitle}
                  className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${isAddingPost || !postTitle ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'} bg-olive text-white shadow-lg shadow-olive/20 mt-4`}
                >
                  {isAddingPost ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {t('publishPost')}
                </button>

                {postStatus !== 'idle' && (
                  <div className={`mt-4 p-3 rounded-xl flex items-center gap-2 ${postStatus === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    {postStatus === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span className="text-xs font-medium">
                      {postStatus === 'success' 
                        ? t('publishedSuccess') 
                        : t('publishedError')}
                    </span>
                  </div>
                )}
              </form>
            </div>

            {/* Post List */}
            <div className={`p-6 rounded-2xl border transition-all ${theme === 'night' ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200 shadow-sm'}`}>
              <h3 className="font-bold mb-4">{t('currentPosts')}</h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {posts.length === 0 ? (
                  <p className="text-xs opacity-50 text-center py-4">{t('noPosts')}</p>
                ) : (
                  posts.map((post) => (
                    <div key={post.id} className={`p-3 rounded-xl border flex items-center justify-between gap-4 ${theme === 'night' ? 'bg-black/30 border-stone-800' : 'bg-slate-50 border-stone-100'}`}>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{language === 'ar' ? post.title?.ar : language === 'en' ? post.title?.en || post.title?.ar : post.title?.ku}</p>
                        <p className="text-[10px] opacity-50 truncate">{post.sectionId}</p>
                      </div>
                      <button 
                        onClick={() => handleDeletePost(post.id)}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Data Migration removed */}
        
        {status !== 'idle' && (
          <div className={`mt-4 p-4 rounded-xl flex items-center gap-3 ${status === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
            {status === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="text-sm font-medium">{message}</span>
          </div>
        )}
      </div>
    </div>
  );
}
