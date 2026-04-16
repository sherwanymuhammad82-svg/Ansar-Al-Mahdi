import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChevronRight, ChevronLeft, BookOpen, Search, ArrowRight, Languages, Loader2, Quote, Download, Trash2, CheckCircle2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { openDB } from 'idb';
import { HADITH_API_BOOKS } from '../data/appData';

const DB_NAME = 'hadith_db';
const STORE_NAME = 'books';

async function initDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

export function HadithLibrary({ language, theme, onBack }: { language: 'ar' | 'ku' | 'en', theme: string, onBack?: () => void }) {
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [apiChapters, setApiChapters] = useState<{id: string, name: string}[]>([]);
  const [selectedApiChapter, setSelectedApiChapter] = useState<string | null>(null);
  const [apiHadiths, setApiHadiths] = useState<any[]>([]);
  const [apiHadithsPage, setApiHadithsPage] = useState(1);
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [translations, setTranslations] = useState<Record<number, string>>({});
  const [isTranslating, setIsTranslating] = useState<Record<number, boolean>>({});
  const [downloadedBooks, setDownloadedBooks] = useState<Record<string, boolean>>({});
  const [isDownloading, setIsDownloading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    checkDownloadedBooks();
  }, []);

  const getBookId = (bookId: string) => {
    if (bookId.startsWith('ara-') && language === 'en') {
      return bookId.replace('ara-', 'eng-');
    }
    return bookId;
  };

  const checkDownloadedBooks = async () => {
    const db = await initDB();
    const keys = await db.getAllKeys(STORE_NAME);
    const downloaded: Record<string, boolean> = {};
    keys.forEach(key => {
      downloaded[key as string] = true;
    });
    setDownloadedBooks(downloaded);
  };

  const handleDownload = async (e: React.MouseEvent, book: any) => {
    e.stopPropagation();
    const actualBookId = getBookId(book.id);
    if (downloadedBooks[actualBookId]) return;
    
    setIsDownloading(prev => ({ ...prev, [actualBookId]: true }));
    try {
      const response = await fetch(`https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/${actualBookId}.json`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      
      const db = await initDB();
      await db.put(STORE_NAME, data, actualBookId);
      
      setDownloadedBooks(prev => ({ ...prev, [actualBookId]: true }));
    } catch (error) {
      console.error("Error downloading book:", error);
      alert(
        language === 'ar' 
          ? 'حدث خطأ أثناء التنزيل' 
          : language === 'en'
          ? 'An error occurred during download'
          : 'هەڵەیەک ڕوویدا لە کاتی داگرتندا'
      );
    } finally {
      setIsDownloading(prev => ({ ...prev, [actualBookId]: false }));
    }
  };

  const handleDelete = async (e: React.MouseEvent, bookId: string) => {
    e.stopPropagation();
    const actualBookId = getBookId(bookId);
    const db = await initDB();
    await db.delete(STORE_NAME, actualBookId);
    setDownloadedBooks(prev => ({ ...prev, [actualBookId]: false }));
    if (selectedBook?.id === bookId) {
      setSelectedBook(null);
    }
  };

  const openBook = async (book: any) => {
    const actualBookId = getBookId(book.id);
    if (!downloadedBooks[actualBookId]) {
      return;
    }
    
    setIsLoadingApi(true);
    setSelectedBook(book);
    setApiChapters([]);
    setApiHadiths([]);
    setSelectedApiChapter(null);
    
    try {
      const db = await initDB();
      const data = await db.get(STORE_NAME, actualBookId);
      
      if (data) {
        const chapters = Object.entries(data.metadata.sections).map(([id, name]) => ({
          id,
          name: name as string
        })).filter(c => c.name);
        
        setApiChapters(chapters);
        setApiHadiths(data.hadiths || []);
      }
    } catch (error) {
      console.error("Error loading book data:", error);
    } finally {
      setIsLoadingApi(false);
    }
  };

  const translateHadith = async (hadithId: number, text: string) => {
    if (translations[hadithId]) return;
    
    setIsTranslating(prev => ({ ...prev, [hadithId]: true }));
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const targetLang = language === 'en' ? 'English' : 'Kurdish (Sorani)';
      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: `Translate this religious text to ${targetLang}. Only provide the translation, no other text or explanation:\n\n` + text,
      });
      setTranslations(prev => ({ ...prev, [hadithId]: response.text || 'Error translating' }));
    } catch (error) {
      console.error(error);
      alert(language === 'ku' ? 'هەڵەیەک ڕوویدا لە وەرگێڕاندا' : 'An error occurred during translation');
      setTranslations(prev => ({ ...prev, [hadithId]: language === 'en' ? 'An error occurred during translation' : 'هەڵەیەک ڕوویدا لە وەرگێڕاندا' }));
    } finally {
      setIsTranslating(prev => ({ ...prev, [hadithId]: false }));
    }
  };

  const filteredBooks = HADITH_API_BOOKS.filter(book => 
    !book.isNewApi && // We only want the ones from hadith-api
    (book.title_ar.includes(searchTerm) || book.title_ku.includes(searchTerm) || (book.title_en && book.title_en.includes(searchTerm)))
  );

  if (selectedBook && selectedApiChapter) {
    return (
      <motion.div 
        key="api-book-hadiths"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="p-6 max-w-md mx-auto w-full pb-24"
      >
        <button 
          onClick={() => setSelectedApiChapter(null)} 
          className="flex items-center gap-2 text-gold mb-6 bg-olive/10 px-4 py-2 rounded-full hover:bg-olive/20 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
          <span className="font-medium text-sm">{language === 'ar' ? 'رجوع للأبواب' : language === 'en' ? 'Back to Chapters' : 'گەڕانەوە بۆ بەشەکان'}</span>
        </button>

        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-olive to-gold mb-2">
            {apiChapters.find(c => c.id === selectedApiChapter)?.name}
          </h2>
        </div>

        <div className="space-y-6">
          {apiHadiths
            .filter(h => h.reference.book.toString() === selectedApiChapter)
            .slice(0, apiHadithsPage * 20)
            .map((hadith: any, idx: number) => {
              const number = hadith.hadithnumber;
              const text = hadith.text;
              const grade = hadith.grades?.[0]?.grade || '';
              
              return (
              <motion.div
                key={number || idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (idx % 20) * 0.05 }}
                className="bg-white/5 border border-gold/10 p-6 rounded-2xl relative overflow-hidden shadow-sm"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-gold/10 to-transparent rounded-bl-3xl" />
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center border border-gold/30">
                      <span className="text-gold font-bold text-sm">{number}</span>
                    </div>
                    <h4 className="text-gold font-medium text-sm">
                      {language === 'ar' ? 'الحديث' : language === 'en' ? 'Hadith' : 'فەرموودە'}
                    </h4>
                  </div>
                  
                  {language === 'ku' && (
                    <button
                      onClick={() => translateHadith(number, text)}
                      disabled={isTranslating[number]}
                      className="flex items-center gap-2 text-xs bg-olive/10 text-gold border border-olive/30 px-3 py-1.5 rounded-lg hover:bg-olive/20 transition-colors disabled:opacity-50"
                    >
                      {isTranslating[number] ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Languages className="w-3.5 h-3.5" />
                      )}
                      وەرگێڕان بۆ کوردی
                    </button>
                  )}
                </div>
                
                <p className="text-white text-lg leading-relaxed font-serif text-justify mb-4">
                  {text}
                </p>

                  {translations[number] && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 pt-4 border-t border-olive/20 bg-olive/5 p-4 rounded-xl"
                    >
                      <p className="text-gold text-base leading-relaxed text-justify" dir={language === 'en' ? 'ltr' : 'rtl'}>
                        {translations[number]}
                      </p>
                    </motion.div>
                  )}

                {grade && (
                  <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap gap-2">
                    <span className="text-xs px-2 py-1 rounded-md bg-white/5 text-slate-400 border border-white/10">
                      {grade}
                    </span>
                  </div>
                )}
              </motion.div>
            )})}
          
          {apiHadiths.filter(h => h.reference.book.toString() === selectedApiChapter).length > apiHadithsPage * 20 && (
              <button
                onClick={() => setApiHadithsPage(p => p + 1)}
                className="w-full py-3 rounded-xl bg-olive/10 text-gold border border-olive/30 font-medium hover:bg-olive/20 transition-colors"
              >
                {language === 'ar' ? 'عرض المزيد' : language === 'en' ? 'Show More' : 'بینینی زیاتر'}
              </button>
          )}
        </div>
      </motion.div>
    );
  }

  if (selectedBook && !selectedApiChapter) {
    return (
      <motion.div 
        key="api-book-chapters"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="p-6 max-w-md mx-auto w-full pb-24"
      >
        <button 
          onClick={() => {
            setSelectedBook(null);
            setApiChapters([]);
            setApiHadiths([]);
          }} 
          className="flex items-center gap-2 text-gold mb-6 bg-olive/10 px-4 py-2 rounded-full hover:bg-olive/20 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
          <span className="font-medium text-sm">{language === 'ar' ? 'رجوع' : language === 'en' ? 'Back' : 'گەڕانەوە'}</span>
        </button>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-olive to-gold mb-2">
            {language === 'ar' ? selectedBook.title_ar : language === 'en' ? selectedBook.title_en || selectedBook.title_ar : selectedBook.title_ku}
          </h2>
          <p className="text-slate-400 text-sm">{language === 'ar' ? 'الأبواب والكتب' : language === 'en' ? 'Chapters and Books' : 'بەشەکان و کتێبەکان'}</p>
        </div>

        {isLoadingApi ? (
          <div className="text-center text-slate-400 py-10 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
            <span>{language === 'ar' ? 'جاري تحميل الأبواب...' : language === 'en' ? 'Loading chapters...' : 'لە بارکردنی بەشەکان...'}</span>
          </div>
        ) : (
          <div className="space-y-3">
            {apiChapters.map((chapter, idx) => {
              const chapterHadithsCount = apiHadiths.filter(h => h.reference.book.toString() === chapter.id).length;
              return (
                <motion.div
                  key={chapter.id}
                  onClick={() => {
                    setSelectedApiChapter(chapter.id);
                    setApiHadithsPage(1);
                  }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (idx % 20) * 0.05 }}
                  className="w-full bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between hover:bg-opacity-80 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gold/20 flex items-center justify-center text-gold font-bold text-sm">
                      {chapter.id}
                    </div>
                    <h3 className="text-white font-medium text-right">{chapter.name}</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 bg-black/50 px-2 py-1 rounded-md">
                      {chapterHadithsCount} {language === 'ar' ? 'حديث' : language === 'en' ? 'Hadith' : 'فەرموودە'}
                    </span>
                    <ChevronLeft className="w-4 h-4 text-slate-500" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      key="hadith_lib"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="p-6 max-w-md mx-auto w-full pb-24"
    >
      <button 
        onClick={onBack} 
        className="flex items-center gap-2 text-gold bg-olive/10 px-4 py-2 rounded-full mb-8 hover:bg-olive/20 transition-colors"
      >
        <ChevronRight className="w-5 h-5" />
        <span className="font-medium text-sm">{language === 'ar' ? 'رجوع' : language === 'en' ? 'Back' : 'گەڕانەوە'}</span>
      </button>
      
      <div className="text-center mb-6 pt-4">
        <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-olive to-gold mb-2">
          {language === 'ar' ? 'مكتبة الحديث' : language === 'en' ? 'Hadith Library' : 'کتێبخانەی فەرموودە'}
        </h2>
      </div>

      <div className="relative mb-6">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/40" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={language === 'ar' ? 'بحث في الكتب...' : language === 'en' ? 'Search books...' : 'گەڕان لە کتێبەکان...'}
          className="w-full bg-white/5 border border-gold/20 rounded-2xl py-4 pr-12 pl-4 text-sm focus:outline-none focus:border-gold/50 transition-colors text-white"
        />
      </div>

      <div className="space-y-4">
        {filteredBooks.map((book) => {
          const actualBookId = getBookId(book.id);
          return (
          <motion.div
            key={book.id}
            whileHover={{ scale: 1.01 }}
            className="flex flex-col p-5 bg-white/5 border border-gold/10 rounded-2xl text-right hover:bg-white/10 transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-1 h-full bg-gold opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-start justify-between mb-3">
              <div className="flex gap-2">
                {downloadedBooks[actualBookId] ? (
                  <button 
                    onClick={(e) => handleDelete(e, book.id)}
                    className="p-2 bg-red-500/10 rounded-lg text-red-500 hover:bg-red-500/20 transition-colors"
                    title={language === 'ar' ? 'حذف' : 'سڕینەوە'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                ) : (
                  <button 
                    onClick={(e) => handleDownload(e, book)}
                    disabled={isDownloading[actualBookId]}
                    className="p-2 bg-gold/10 rounded-lg text-gold hover:bg-gold/20 transition-colors disabled:opacity-50"
                    title={language === 'ar' ? 'تنزيل' : 'داگرتن'}
                  >
                    {isDownloading[actualBookId] ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                  </button>
                )}
                <button 
                  onClick={() => openBook(book)}
                  disabled={!downloadedBooks[actualBookId]}
                  className={`p-2 rounded-lg transition-colors ${downloadedBooks[actualBookId] ? 'bg-gold/10 text-gold hover:bg-gold/20' : 'bg-white/5 text-white/30 cursor-not-allowed'}`}
                >
                  <BookOpen className="w-4 h-4" />
                </button>
              </div>
              <h3 
                className={`text-lg font-bold group-hover:text-white transition-colors ${downloadedBooks[actualBookId] ? 'text-gold cursor-pointer' : 'text-white/50'}`} 
                onClick={() => openBook(book)}
              >
                {language === 'ar' ? book.title_ar : language === 'en' ? book.title_en || book.title_ar : book.title_ku}
                {downloadedBooks[actualBookId] && <CheckCircle2 className="inline-block mr-2 w-4 h-4 text-green-500" />}
              </h3>
            </div>
            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed" onClick={() => openBook(book)}>
              {language === 'ar' ? book.description_ar : language === 'en' ? book.description_en || book.description_ar : book.description_ku}
            </p>
          </motion.div>
        )})}
      </div>
    </motion.div>
  );
}
