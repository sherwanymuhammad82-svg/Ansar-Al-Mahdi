import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { FileText, Upload, Plus, X, Loader2, Download, Trash2, Github, Languages, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, Image as ImageIcon, Database, RefreshCw } from 'lucide-react';
import { db, storage, auth } from '../firebase';
import { collection, addDoc, query, where, onSnapshot, orderBy, deleteDoc, doc, serverTimestamp, updateDoc, getDocs, setDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { GoogleGenAI } from '@google/genai';
import { syncSingleBookToAll, syncArabicToAll } from '../services/migrationService';

interface PdfBook {
  id: string;
  title: string;
  description: string;
  content?: string;
  pdfUrl?: string;
  language: string;
  uploadedBy: string;
  uploaderName: string;
  createdAt: any;
  order?: number;
  coverUrl?: string;
}

const TranslatedTitle = ({ title, bookId, currentLang }: { title: string, bookId: string, currentLang: string }) => {
  const [displayTitle, setDisplayTitle] = useState(title);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    if (currentLang === 'ku') {
      const cached = localStorage.getItem(`title_ku_${bookId}`);
      if (cached) {
        setDisplayTitle(cached);
      } else {
        setIsTranslating(true);
        fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=ckb&dt=t&q=${encodeURIComponent(title)}`)
          .then(res => res.json())
          .then(data => {
            const translated = data[0].map((item: any) => item[0]).join('');
            setDisplayTitle(translated);
            localStorage.setItem(`title_ku_${bookId}`, translated);
          })
          .catch(err => console.error(err))
          .finally(() => setIsTranslating(false));
      }
    } else {
      setDisplayTitle(title);
    }
  }, [title, currentLang, bookId]);

  return <span className={isTranslating ? 'opacity-50 italic' : ''}>{displayTitle}</span>;
};

export function PdfLibrary({ theme, language, currentUser, appSettings }: { theme: 'night' | 'white' | 'cream', language: string, currentUser: any, appSettings: any }) {
  const [books, setBooks] = useState<PdfBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showGithubModal, setShowGithubModal] = useState(false);
  const [githubUrl, setGithubUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [readingBook, setReadingBook] = useState<PdfBook | null>(null);
  const [readerTheme, setReaderTheme] = useState<'dark' | 'light'>('dark');
  const [isTranslating, setIsTranslating] = useState<Record<number, boolean>>({});
  const [translatedContent, setTranslatedContent] = useState<Record<number, string>>({});
  const [visiblePages, setVisiblePages] = useState(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [isSyncingBook, setIsSyncingBook] = useState<Record<string, boolean>>({});
  const WORDS_PER_PAGE = 400;

  const translatePage = async (text: string, pageIndex: number, autoNext = false) => {
    if (translatedContent[pageIndex] || isTranslating[pageIndex]) return;
    
    setIsTranslating(prev => ({ ...prev, [pageIndex]: true }));
    try {
      // Check cache in Firestore (use hash for long text to avoid index limits)
      const textHash = Array.from(text).reduce((s, c) => Math.imul(31, s) + c.charCodeAt(0) | 0, 0).toString();
      const cacheQuery = query(collection(db, 'Translations'), where('hash', '==', textHash), where('targetLang', '==', 'ckb'));
      const cacheSnapshot = await getDocs(cacheQuery);
      if (!cacheSnapshot.empty) {
        setTranslatedContent(prev => ({ ...prev, [pageIndex]: cacheSnapshot.docs[0].data().translatedText }));
        return;
      }

      // Use Gemini
      const apiKeys = [...(appSettings?.geminiApiKeys || []), process.env.GEMINI_API_KEY as string].filter(Boolean);
      if (apiKeys.length === 0) throw new Error('No API keys configured');
      
      const apiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: "Translate to Sorani Kurdish. Only provide the translation, no other text or explanation:\n\n" + text,
      });
      const translatedText = response.text || '';
      
      // Use setDoc with hash as ID for idempotency and better tracking
      const translationRef = doc(db, 'Translations', textHash + '_ckb');
      await setDoc(translationRef, {
        hash: textHash,
        originalTextPreview: text.substring(0, 100),
        translatedText,
        targetLang: 'ckb',
        createdAt: serverTimestamp()
      });

      setTranslatedContent(prev => ({ ...prev, [pageIndex]: translatedText }));
      
      // Auto-translate next page only if user is actively reading and we have quota
      // For now, let's disable automatic chaining to save quota as per user's exhausted limit
      /*
      if (autoNext && readingBook) {
        const totalPages = Math.ceil((readingBook.content?.split(/\s+/)?.length || 0) / WORDS_PER_PAGE);
        if (pageIndex + 1 < totalPages) {
          const nextPageText = readingBook.content?.split(/\s+/).slice((pageIndex + 1) * WORDS_PER_PAGE, (pageIndex + 2) * WORDS_PER_PAGE).join(' ') || '';
          setTimeout(() => translatePage(nextPageText, pageIndex + 1, true), 500);
        }
      }
      */
    } catch (error: any) {
      console.error("Translation error:", error);
      alert(language === 'ku' ? 'هەڵەیەک ڕوویدا لە وەرگێڕاندا. تکایە دواتر تاقی بکەرەوە.' : 'Error in translation. Please try again later.');
    } finally {
      setIsTranslating(prev => ({ ...prev, [pageIndex]: false }));
    }
  };

  // API Key Management
  const [apiKeys, setApiKeys] = useState<string[]>(appSettings?.geminiApiKeys || ['']);
  const [isSavingKeys, setIsSavingKeys] = useState(false);

  const handleAddApiKey = () => setApiKeys([...apiKeys, '']);
  const handleRemoveApiKey = (index: number) => setApiKeys(apiKeys.filter((_, i) => i !== index));
  const handleApiKeyChange = (index: number, value: string) => {
    const newKeys = [...apiKeys];
    newKeys[index] = value;
    setApiKeys(newKeys);
  };

  const handleSaveApiKeys = async () => {
    setIsSavingKeys(true);
    try {
      await setDoc(doc(db, 'Settings', 'main'), { geminiApiKeys: apiKeys.filter(k => k.trim() !== '') }, { merge: true });
      alert('تم حفظ المفاتيح بنجاح');
    } catch (error: any) {
      handleFirestoreError(error, OperationType.WRITE, 'Settings/main');
      alert('حدث خطأ');
    } finally {
      setIsSavingKeys(false);
    }
  };

  useEffect(() => {
    const q = query(
      collection(db, 'PdfBooks'),
      where('language', '==', language),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedBooks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PdfBook[];
      
      // Sort in memory to handle missing 'order' fields and maintain custom order
      fetchedBooks.sort((a, b) => {
        const orderA = a.order ?? 999999;
        const orderB = b.order ?? 999999;
        if (orderA !== orderB) return orderA - orderB;
        return 0; // Maintain Firestore's createdAt order if orders are equal
      });

      setBooks(fetchedBooks);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'PdfBooks');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [language]);

  const moveBook = async (book: PdfBook, direction: 'up' | 'down') => {
    const index = books.findIndex(b => b.id === book.id);
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === books.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const targetBook = books[targetIndex];

    // Swap orders
    const currentOrder = book.order || 0;
    const targetOrder = targetBook.order || 0;

    try {
      await updateDoc(doc(db, 'PdfBooks', book.id), { order: targetOrder || index - (direction === 'up' ? 1 : -1) });
      await updateDoc(doc(db, 'PdfBooks', targetBook.id), { order: currentOrder || index });
    } catch (error) {
      console.error("Error moving book:", error);
    }
  };

  const handleSyncBook = async (e: React.MouseEvent, book: PdfBook) => {
    e.stopPropagation();
    setIsSyncingBook(prev => ({ ...prev, [book.id]: true }));
    try {
      const count = await syncSingleBookToAll(book, 'PdfBooks');
      alert(language === 'ar' ? `تمت المزامنة بنجاح مع ${count} لغات.` : `Synced successfully with ${count} languages.`);
    } catch (error) {
      alert(language === 'ar' ? 'فشلت المزامنة.' : 'Sync failed.');
    } finally {
      setIsSyncingBook(prev => ({ ...prev, [book.id]: false }));
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim() || !currentUser) return;

    // Check file size (limit to 50MB)
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_FILE_SIZE) {
      alert("قەبارەی فایلەکە زۆر گەورەیە. تکایە فایلێک هەڵبژێرە کە قەبارەکەی لە ٥٠ مێگابایت کەمتر بێت.");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      let downloadURL = '';
      let coverURL = '';
      let storagePath = '';

      // 1. Upload PDF/File to Storage if exists
      if (file) {
        const safeFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        const storageRef = ref(storage, `pdf_books/${language}/${Date.now()}_${safeFileName}`);
        const uploadTask = uploadBytesResumable(storageRef, file);
        
        await new Promise((resolve, reject) => {
          uploadTask.on('state_changed', 
            (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
            reject,
            async () => {
              downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              storagePath = uploadTask.snapshot.ref.fullPath;
              resolve(null);
            }
          );
        });
      }

      // 2. Upload Cover Image if exists
      if (coverFile) {
        const coverRef = ref(storage, `book_covers/${Date.now()}_${coverFile.name}`);
        const uploadTask = uploadBytesResumable(coverRef, coverFile);
        await new Promise((resolve, reject) => {
          uploadTask.on('state_changed', null, reject, async () => {
            coverURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(null);
          });
        });
      }

      // 3. Save metadata to Firestore
      await addDoc(collection(db, 'PdfBooks'), {
        title: title.trim(),
        description: description.trim(),
        pdfUrl: downloadURL,
        coverUrl: coverURL,
        storagePath,
        language,
        order: books.length, // Put at the end by default
        uploadedBy: auth.currentUser?.uid || currentUser.uid || currentUser.id,
        uploaderName: currentUser.name || currentUser.displayName || 'Unknown',
        createdAt: serverTimestamp()
      });

      // Reset form
      setTitle('');
      setDescription('');
      setFile(null);
      setCoverFile(null);
      setShowUploadModal(false);
      setUploading(false);
    } catch (error: any) {
      console.error("Upload error:", error);
      setUploading(false);
      alert(`هەڵەیەک ڕوویدا: ${error.message}`);
    }
  };

  const handleDelete = async (book: PdfBook) => {
    if (!window.confirm('دڵنیایت لە سڕینەوەی ئەم کتێبە؟')) return;

    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'PdfBooks', book.id));
      
      // Delete from Storage if storagePath exists
      if ((book as any).storagePath) {
        const fileRef = ref(storage, (book as any).storagePath);
        await deleteObject(fileRef).catch(err => console.error("Error deleting file from storage:", err));
      }
    } catch (error) {
      console.error("Error deleting book:", error);
      alert("هەڵەیەک ڕوویدا لە کاتی سڕینەوەی کتێبەکە");
    }
  };

  const handleGithubImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubUrl.trim() || !currentUser) return;

    setIsImporting(true);
    try {
      const response = await fetch(githubUrl);
      if (!response.ok) throw new Error('Failed to fetch from GitHub');
      
      const data = await response.json();
      const booksToImport = Array.isArray(data) ? data : [data];

      let importedCount = 0;
      for (const book of booksToImport) {
        // Handle different possible field names
        const title = book.title || book.Title || book.name || book.Name || book.book_name || book.book_title || book.titl || book.tit;
        const pdfUrl = book.pdfUrl || book.pdfurl || book.url || book.Url || book.link || book.Link || book.pdf_link || book.file_url || book.fileUrl || '';
        const rawContent = book.content || book.Content || book.text || book.Text || book.body || book.data || book.matn || book.text_content || '';
        const chapters = book.chapters || book.Chapters || book.sections || book.parts || book.fusuul || [];
        const description = book.description || book.Description || book.desc || book.Desc || book.info || book.summary || '';

        // Join content if it's an array or has chapters
        let finalContent = '';
        if (Array.isArray(chapters) && chapters.length > 0) {
          finalContent = chapters.map((c: any) => {
            const cTitle = c.title || c.Title || c.name || '';
            const cText = c.text || c.Text || c.content || c.body || '';
            return (cTitle ? `### ${cTitle}\n\n` : '') + cText;
          }).join('\n\n---\n\n');
        } else if (Array.isArray(rawContent)) {
          finalContent = rawContent.join('\n\n');
        } else if (typeof rawContent === 'string') {
          finalContent = rawContent;
        }

        // Only import if we have a title
        if (title) {
          await addDoc(collection(db, 'PdfBooks'), {
            title: String(title).trim(),
            description: String(description).trim(),
            content: finalContent,
            pdfUrl: pdfUrl ? String(pdfUrl).trim() : '',
            language,
            uploadedBy: auth.currentUser?.uid || currentUser.uid || currentUser.id,
            uploaderName: currentUser.name || currentUser.displayName || 'GitHub Import',
            createdAt: serverTimestamp()
          });
          importedCount++;
        } else {
          console.warn('Skipping book due to missing title:', book);
        }
      }

      alert(`بەسەرکەوتوویی ${importedCount} کتێب هاوردە کرا.`);
      setGithubUrl('');
      setShowGithubModal(false);
    } catch (error: any) {
      console.error("Import error:", error);
      alert(`هەڵەیەک ڕوویدا لە کاتی هاوردەکردن: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      title: { ar: 'مكتبة PDF', ku: 'کتێبخانەی PDF', en: 'PDF Library', in: 'Perpustakaan PDF' },
      upload: { ar: 'رفع كتاب', ku: 'بارکردنی کتێب', en: 'Upload Book', in: 'Unggah Buku' },
      bookTitle: { ar: 'عنوان الكتاب', ku: 'ناوی کتێب', en: 'Book Title', in: 'Judul Buku' },
      bookDesc: { ar: 'وصف الكتاب', ku: 'پێناسەی کتێب', en: 'Book Description', in: 'Deskripsi Buku' },
      selectFile: { ar: 'اختر ملف PDF', ku: 'فایلی PDF هەڵبژێرە', en: 'Select PDF File', in: 'Pilih File PDF' },
      cancel: { ar: 'إلغاء', ku: 'پاشگەزبوونەوە', en: 'Cancel', in: 'Batal' },
      save: { ar: 'حفظ', ku: 'پاشەکەوتکردن', en: 'Save', in: 'Simpan' },
      noBooks: { ar: 'لا توجد كتب بعد', ku: 'هیچ کتێبێک نییە', en: 'No books yet', in: 'Belum ada buku' },
      download: { ar: 'تحميل', ku: 'داگرتن', en: 'Download', in: 'Unduh' },
      read: { ar: 'قراءة', ku: 'خوێندنەوە', en: 'Read', in: 'Baca' },
      page: { ar: 'صفحة', ku: 'لاپەڕە', en: 'Page', in: 'Halaman' },
      next: { ar: 'التالي', ku: 'دواتر', en: 'Next', in: 'Selanjutnya' },
      prev: { ar: 'السابق', ku: 'پێشتر', en: 'Previous', in: 'Sebelumnya' },
      rawLink: { ar: 'رابط المصدر', ku: 'لینکی سەرچاوە', en: 'Source Link', in: 'Link Sumber' },
      lightTheme: { ar: 'الوضع الفاتح', ku: 'دۆخی ڕووناک', en: 'Light Mode', in: 'Mode Terang' },
      darkTheme: { ar: 'الوضع الليلي', ku: 'دۆخی تاریک', en: 'Dark Mode', in: 'Mode Gelap' },
      translate: { ar: 'ترجمة للسورانية', ku: 'وەرگێڕان بۆ سۆرانی', en: 'Translate to Sorani', in: 'Terjemahkan ke Sorani' },
      showOriginal: { ar: 'إظهار الأصلي', ku: 'پیشاندانی دەقە ئەسڵییەکە', en: 'Show Original', in: 'Tampilkan Asli' },
      translating: { ar: 'جاري الترجمة...', ku: 'وەرگێڕان دەکرێت...', en: 'Translating...', in: 'Menerjemahkan...' },
      close: { ar: 'إغلاق', ku: 'داخستن', en: 'Close', in: 'Tutup' },
      loginRequired: { ar: 'يجب تسجيل الدخول لرفع الكتب', ku: 'پێویستە بچیتە ژوورەوە بۆ بارکردنی کتێب', en: 'Login required to upload books', in: 'Login diperlukan untuk mengunggah buku' },
      syncAll: { ar: 'مزامنة الكل لجميع اللغات', ku: 'هاوکاتکردنی هەموو بۆ هەموو زمانەکان', en: 'Sync All to All Languages' },
      confirmSyncAll: { ar: 'هل تريد مزامنة جميع كتب القسم العربي مع باقي اللغات؟', ku: 'ئایا دەتەوێت هەموو کتێبەکانی بەشی عەرەبی لەگەڵ زمانەکانی تر هاوکات بکەیت؟', en: 'Do you want to sync all Arabic books to all other languages?' }
    };
    return translations[key]?.[language] || translations[key]?.['ku'] || key;
  };

  return (
    <div className="space-y-6 p-4 pb-24 max-w-full overflow-x-hidden">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gold flex items-center gap-2">
          <FileText className="w-6 h-6" />
          {t('title')}
        </h2>
        
        {currentUser && currentUser.role === 'admin' && (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-6">
            <h3 className="text-gold font-bold mb-4 flex items-center gap-2">
              <Database className="w-4 h-4" />
              Gemini API Keys
            </h3>
            {apiKeys.map((key, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="password"
                  value={key}
                  onChange={(e) => handleApiKeyChange(index, e.target.value)}
                  className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-gold/50"
                  placeholder="Enter API Key"
                />
                <button onClick={() => handleRemoveApiKey(index)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <div className="flex gap-2 mt-2">
              <button onClick={handleAddApiKey} className="flex-1 py-2 border border-dashed border-gold/50 rounded-xl text-gold text-xs font-bold hover:bg-gold/10">
                <Plus className="w-3 h-3 inline mr-2" /> Add Key
              </button>
              <button onClick={handleSaveApiKeys} disabled={isSavingKeys} className="flex-1 py-2 bg-olive text-gold rounded-xl text-xs font-bold hover:bg-olive/80">
                {isSavingKeys ? '...' : 'Save Keys'}
              </button>
            </div>
          </div>
        )}

        {currentUser && currentUser.role === 'admin' && language === 'ar' && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={async (e) => {
                e.stopPropagation();
                setIsLoading(true);
                try {
                  const count = await syncArabicToAll();
                  alert(language === 'ar' ? `تمت المزامنة بنجاح: ${count}` : `Sync successful: ${count}`);
                } catch (error: any) {
                  if (error.message === 'quota-exceeded') {
                    alert(language === 'ar' ? 'تم تجاوز حصة البيانات المجانية. يرجى المحاولة غداً.' : 'Free quota exceeded. Please try again tomorrow.');
                  } else {
                    alert(language === 'ar' ? 'خطأ في المزامنة' : 'Error in sync');
                  }
                } finally {
                  setIsLoading(false);
                }
              }}
              className="flex items-center gap-2 bg-emerald-600 active:scale-95 text-white px-4 py-2 rounded-xl text-[10px] md:text-sm font-bold shadow-lg hover:bg-emerald-700 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              {t('syncAll')}
            </button>
            <button
              onClick={() => setShowGithubModal(true)}
              className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-xl text-[10px] md:text-sm font-bold shadow-lg hover:bg-slate-700 transition-colors"
            >
              <Github className="w-4 h-4" />
              {language === 'ar' ? 'استيراد' : 'GitHub'}
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-olive to-gold text-white px-4 py-2 rounded-xl text-[10px] md:text-sm font-bold shadow-lg hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              {t('upload')}
            </button>
          </div>
        )}

        {currentUser && currentUser.role === 'admin' && language !== 'ar' && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowGithubModal(true)}
              className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg hover:bg-slate-700 transition-colors"
            >
              <Github className="w-4 h-4" />
              {language === 'ar' ? 'استيراد من GitHub' : language === 'en' ? 'GitHub Import' : 'هاوردەکردن لە GitHub'}
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-olive to-gold text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              {t('upload')}
            </button>
          </div>
        )}
        
        {currentUser && currentUser.role !== 'admin' && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-olive to-gold text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            {t('upload')}
          </button>
        )}

        {!currentUser && (
          <div className="text-xs text-slate-500 italic">
            {t('loginRequired')}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-gold animate-spin" />
        </div>
      ) : books.length === 0 ? (
        <div className={`text-center py-12 rounded-2xl border ${theme === 'night' ? 'border-white/10 bg-black/20' : 'border-stone-200 bg-stone-50'}`}>
          <FileText className={`w-12 h-12 mx-auto mb-4 ${theme === 'night' ? 'text-slate-600' : 'text-slate-300'}`} />
          <p className={theme === 'night' ? 'text-slate-400' : 'text-slate-500'}>{t('noBooks')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {books.map((book) => (
            <motion.div
              key={book.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-2xl border ${theme === 'night' ? 'bg-[#0b0e14] border-[#1f242d]' : 'bg-white border-stone-200'} shadow-sm flex flex-col`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-14 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0 overflow-hidden border border-gold/10">
                    {book.coverUrl ? (
                      <img src={book.coverUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <FileText className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <h3 className={`font-bold text-xs md:text-sm leading-snug break-words ${theme === 'night' ? 'text-white' : 'text-black'}`}>
                      <TranslatedTitle title={book.title} bookId={book.id} currentLang={language} />
                    </h3>
                    <p className={`text-[9px] ${theme === 'night' ? 'text-slate-400' : 'text-slate-500'}`}>
                      {book.uploaderName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {currentUser?.role === 'admin' && (
                    <div className="flex flex-col gap-1 mr-2">
                      <button onClick={() => moveBook(book, 'up')} className="p-1 hover:bg-gold/10 text-gold rounded transition-colors">
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button onClick={() => moveBook(book, 'down')} className="p-1 hover:bg-gold/10 text-gold rounded transition-colors">
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  {(currentUser?.uid === book.uploadedBy || currentUser?.id === book.uploadedBy || auth.currentUser?.uid === book.uploadedBy || currentUser?.role === 'admin') && (
                    <button 
                      onClick={() => handleDelete(book)}
                      className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="mt-auto pt-2">
                {book.pdfUrl ? (
                  <a
                    href={book.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2 bg-stone-100 hover:bg-stone-200 dark:bg-white/5 dark:hover:bg-white/10 text-stone-900 dark:text-white rounded-xl text-xs font-medium transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {t('download')}
                  </a>
                ) : book.content ? (
                  <button
                    onClick={() => {
                      setReadingBook(book);
                      setVisiblePages(1);
                      setTranslatedContent({});
                    }}
                    className="flex items-center justify-center gap-2 w-full py-2 bg-gold/10 hover:bg-gold/20 text-gold rounded-xl text-xs font-bold transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    {t('read')}
                  </button>
                ) : null}

                {currentUser?.role === 'admin' && language === 'ar' && (
                  <button
                    type="button"
                    onClick={(e) => handleSyncBook(e, book)}
                    disabled={isSyncingBook[book.id]}
                    className="flex justify-center items-center gap-2 w-full py-2 mt-2 bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-95 text-emerald-500 rounded-xl text-[10px] font-bold transition-all border border-emerald-500/20 cursor-pointer z-10"
                  >
                    {isSyncingBook[book.id] ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3" />
                    )}
                    {language === 'ar' ? 'مزامنة مع الكل' : 'Sync to All'}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Reader Modal */}
      {readingBook && (
        <div className={`fixed inset-0 z-[110] flex flex-col overflow-hidden transition-colors duration-500 ${readerTheme === 'dark' ? 'bg-black' : 'bg-stone-100'}`}>
          {/* Top Header */}
          <div className={`p-4 flex items-center justify-between border-b ${readerTheme === 'dark' ? 'bg-black border-white/10' : 'bg-white border-stone-200'}`}>
            <div className="flex items-center gap-3">
              <button onClick={() => {
                setReadingBook(null);
                setTranslatedContent({});
                setVisiblePages(1);
              }} className={`p-2 rounded-full transition-colors ${readerTheme === 'dark' ? 'hover:bg-white/10 text-white' : 'hover:bg-stone-100 text-black'}`}>
                <X className="w-6 h-6" />
              </button>
              <h3 className={`font-bold truncate max-w-[150px] md:max-w-md ${readerTheme === 'dark' ? 'text-white' : 'text-black'}`}>
                <TranslatedTitle title={readingBook.title} bookId={readingBook.id} currentLang={language} />
              </h3>
            </div>
            
            <div className="flex items-center gap-4">
               <button 
                 onClick={() => setReaderTheme(prev => prev === 'dark' ? 'light' : 'dark')}
                 className={`p-2 rounded-xl transition-colors ${readerTheme === 'dark' ? 'bg-white/10 text-white' : 'bg-stone-100 text-black'}`}
               >
                 {readerTheme === 'dark' ? <Plus className="w-5 h-5 rotate-45" /> : <FileText className="w-5 h-5" />}
               </button>
               {readingBook.pdfUrl && (
                 <a href={readingBook.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-gold hover:underline flex items-center gap-2">
                   <Download className="w-4 h-4" />
                   <span className="hidden md:inline">{t('rawLink')}</span>
                 </a>
               )}
            </div>
          </div>

          {/* Infinite Scroll Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
            <div className="max-w-3xl mx-auto space-y-8 pb-20">
              {Array.from({ length: Math.min(visiblePages, Math.ceil((readingBook.content?.split(/\s+/)?.length || 0) / WORDS_PER_PAGE)) }).map((_, idx) => {
                const pageText = readingBook.content?.split(/\s+/).slice(idx * WORDS_PER_PAGE, (idx + 1) * WORDS_PER_PAGE).join(' ') || '';
                const isPageTranslated = !!translatedContent[idx];
                
                return (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-8 md:p-16 rounded-[2rem] shadow-2xl relative ${readerTheme === 'dark' ? 'bg-[#111] text-stone-300' : 'bg-white text-stone-800'}`}
                    style={{ direction: isPageTranslated ? 'rtl' : (language === 'en' ? 'ltr' : 'rtl') }}
                  >
                    <div className="flex justify-between items-center mb-8 border-b border-gold/10 pb-4">
                      <span className="text-xs font-bold text-gold uppercase tracking-widest">{t('page')} {idx + 1}</span>
                      
                      {/* Only show translation in Kurdish section */}
                      {language === 'ku' && (
                        <button
                          onClick={() => {
                            if (isPageTranslated) {
                              setTranslatedContent(prev => {
                                const next = { ...prev };
                                delete next[idx];
                                return next;
                              });
                            } else {
                              translatePage(pageText, idx, true);
                            }
                          }}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            isPageTranslated 
                              ? 'bg-emerald-500 text-white' 
                              : 'bg-gold/10 text-gold hover:bg-gold/20'
                          }`}
                        >
                          {isTranslating[idx] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Languages className="w-3 h-3" />}
                          {isPageTranslated ? t('showOriginal') : isTranslating[idx] ? t('translating') : t('translate')}
                        </button>
                      )}
                    </div>

                    <div className={`text-xl leading-[2.2] whitespace-pre-wrap font-serif ${isPageTranslated ? 'kurmanji-font' : ''}`}>
                      {translatedContent[idx] || pageText}
                    </div>
                  </motion.div>
                );
              })}

              {/* Load More Trigger */}
              {visiblePages * WORDS_PER_PAGE < (readingBook.content?.split(/\s+/)?.length || 0) && (
                <button 
                  onClick={() => setVisiblePages(prev => prev + 1)}
                  className="w-full py-8 text-gold font-bold hover:bg-gold/5 rounded-3xl border-2 border-dashed border-gold/20 transition-colors"
                >
                  {language === 'ku' ? 'بینینی لاپەڕەی زیاتر...' : 'Load More Pages...'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* GitHub Import Modal */}
      {showGithubModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`w-full max-w-md rounded-3xl p-6 ${theme === 'night' ? 'bg-[#0b0e14] border border-white/10' : 'bg-white border border-stone-200'}`}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-xl font-bold ${theme === 'night' ? 'text-white' : 'text-black'}`}>
                {language === 'ar' ? 'استيراد من GitHub' : language === 'en' ? 'GitHub Import' : 'هاوردەکردن لە GitHub'}
              </h3>
              <button onClick={() => setShowGithubModal(false)} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleGithubImport} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === 'night' ? 'text-slate-300' : 'text-slate-700'}`}>
                  {language === 'ar' ? 'رابط GitHub Raw (JSON)' : language === 'en' ? 'GitHub Raw URL (JSON)' : 'لینکی GitHub Raw (JSON)'}
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://raw.githubusercontent.com/..."
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border ${theme === 'night' ? 'bg-black/50 border-white/10 text-white' : 'bg-stone-50 border-stone-200 text-black'} focus:outline-none focus:border-gold`}
                />
                <p className="text-[10px] text-slate-500 mt-2">
                  Format: [&#123; "title": "...", "description": "...", "pdfUrl": "..." &#125;]
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowGithubModal(false)}
                  disabled={isImporting}
                  className={`flex-1 py-3 rounded-xl font-bold ${theme === 'night' ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isImporting || !githubUrl.trim()}
                  className="flex-1 py-3 rounded-xl font-bold bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isImporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Github className="w-5 h-5" />}
                  {language === 'ar' ? 'استيراد' : language === 'en' ? 'Import' : 'هاوردەکردن'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`w-full max-w-md rounded-3xl p-6 ${theme === 'night' ? 'bg-[#0b0e14] border border-white/10' : 'bg-white border border-stone-200'}`}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-xl font-bold ${theme === 'night' ? 'text-white' : 'text-black'}`}>
                {t('upload')}
              </h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === 'night' ? 'text-slate-300' : 'text-slate-700'}`}>
                  {t('bookTitle')} *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border ${theme === 'night' ? 'bg-black/50 border-white/10 text-white' : 'bg-stone-50 border-stone-200 text-black'} focus:outline-none focus:border-gold`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === 'night' ? 'text-slate-300' : 'text-slate-700'}`}>
                  {t('bookDesc')}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border h-24 resize-none ${theme === 'night' ? 'bg-black/50 border-white/10 text-white' : 'bg-stone-50 border-stone-200 text-black'} focus:outline-none focus:border-gold`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === 'night' ? 'text-slate-300' : 'text-slate-700'}`}>
                  {language === 'ku' ? 'وێنەی بەرگی کتێب (ئارەزوومەندانە)' : 'Book Cover Image (Optional)'}
                </label>
                <div className="flex items-center gap-4">
                  <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${theme === 'night' ? 'border-white/10 hover:border-gold/50 text-slate-400' : 'border-stone-200 hover:border-gold text-slate-500'}`}>
                    <ImageIcon className="w-5 h-5" />
                    <span className="text-xs font-bold truncate">{coverFile ? coverFile.name : (language === 'ku' ? 'وێنەیەک هەڵبژێرە' : 'Choose Image')}</span>
                    <input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} className="hidden" />
                  </label>
                  {coverFile && (
                    <button type="button" onClick={() => setCoverFile(null)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg">
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === 'night' ? 'text-slate-300' : 'text-slate-700'}`}>
                  {t('selectFile')} *
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  required
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className={`w-full px-4 py-3 rounded-xl border ${theme === 'night' ? 'bg-black/50 border-white/10 text-white' : 'bg-stone-50 border-stone-200 text-black'} focus:outline-none focus:border-gold file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gold/10 file:text-gold hover:file:bg-gold/20`}
                />
              </div>

              {uploading && (
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 mb-4 overflow-hidden">
                  <div className="bg-gold h-2.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  disabled={uploading}
                  className={`flex-1 py-3 rounded-xl font-bold ${theme === 'night' ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={uploading || !file || !title.trim()}
                  className="flex-1 py-3 rounded-xl font-bold bg-gradient-to-r from-olive to-gold text-white hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                  {t('save')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
