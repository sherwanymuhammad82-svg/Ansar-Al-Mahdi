import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI } from '@google/genai';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Book, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle,
  Download,
  BookOpen, 
  Languages, 
  Loader2,
  ArrowLeft,
  Info,
  Calendar,
  User,
  Hash
} from 'lucide-react';
import { bookService, Book as BookMetadata, BookContent } from '../services/bookService';
import tarikhMetadata from '../data/tarikh_books_metadata.json';

interface HistoryLibraryProps {
  language: 'ar' | 'ku' | 'en' | null;
  onBack: () => void;
  theme?: 'night' | 'white' | 'cream';
}

const HistoryLibrary: React.FC<HistoryLibraryProps> = ({ language, onBack, theme = 'night' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBook, setSelectedBook] = useState<BookMetadata | null>(null);
  const [bookContent, setBookContent] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'reader'>('grid');
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showReader, setShowReader] = useState(false);

  const lang = language || 'en';

  useEffect(() => {
    if (selectedBook) {
      const cacheKey = `book_cache_${selectedBook.id}`;
      setIsDownloaded(!!localStorage.getItem(cacheKey));
    }
  }, [selectedBook]);

  const filteredBooks = useMemo(() => {
    return (tarikhMetadata as BookMetadata[]).filter(book => {
      const titleAr = book.title_ar || '';
      const titleKu = book.title_ku || '';
      const titleEn = book.title_en || '';
      const descAr = book.description_ar || '';
      const descKu = book.description_ku || '';
      const descEn = book.description_en || '';

      return titleAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
        titleKu.toLowerCase().includes(searchTerm.toLowerCase()) ||
        titleEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        descAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
        descKu.toLowerCase().includes(searchTerm.toLowerCase()) ||
        descEn.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [searchTerm]);

  const handleBookSelect = async (book: BookMetadata) => {
    setSelectedBook(book);
    setViewMode('reader');
    setShowReader(false);
    setCurrentPage(0);
    setTranslatedContent(null);
    setBookContent(null);
    
    let isPdfOrWord = false;
    if (book.contentUrl) {
      try {
        const url = new URL(book.contentUrl);
        const pathname = decodeURIComponent(url.pathname).toLowerCase();
        if (pathname.endsWith('.pdf') || pathname.endsWith('.doc') || pathname.endsWith('.docx')) {
          isPdfOrWord = true;
        }
      } catch (e) {
        const urlLower = book.contentUrl.toLowerCase();
        if (urlLower.includes('.pdf') || urlLower.includes('.doc') || urlLower.includes('.docx')) {
          isPdfOrWord = true;
        }
      }
    }

    if (isPdfOrWord) {
      setShowReader(true);
      return;
    }

    const isDownloaded = bookService.getDownloadedBookIds().includes(book.id);
    setIsDownloaded(isDownloaded);
    
    if (isDownloaded) {
      try {
        const content = await bookService.fetchBookContent(book.id, book.contentUrl);
        if (content.length === 1 && content[0].text === 'BINARY_DOCUMENT') {
          setShowReader(true);
          return;
        }
        setBookContent({
          book_title: lang === 'ar' ? book.title_ar : lang === 'en' ? book.title_en || book.title_ar : book.title_ku,
          contents: content.map((c: any) => ({ id: c.part || c.id, text: c.text }))
        });
      } catch (err) {
        console.error("Error fetching local book content:", err);
      }
    } else {
      // Fetch from remote via bookService (which uses proxy)
      setLoading(true);
      try {
        const content = await bookService.fetchBookContent(book.id, book.contentUrl);
        if (content.length === 1 && content[0].text === 'BINARY_DOCUMENT') {
          setShowReader(true);
          return;
        }
        setBookContent({
          book_title: lang === 'ar' ? book.title_ar : lang === 'en' ? book.title_en || book.title_ar : book.title_ku,
          contents: content.map((c: any) => ({ id: c.part || c.id, text: c.text }))
        });
      } catch (err) {
        console.error("Error fetching remote book content:", err);
        if (err instanceof Error && err.message === 'Response was not valid JSON' && book.contentUrl) {
          setShowReader(true);
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDownload = async () => {
    if (!selectedBook || isDownloading) return;
    
    setIsDownloading(true);
    try {
      const success = await bookService.downloadBook(selectedBook);
      if (success) {
        setIsDownloaded(true);
        const content = await bookService.fetchBookContent(selectedBook.id, selectedBook.contentUrl);
        setBookContent({
          book_title: lang === 'ar' ? selectedBook.title_ar : selectedBook.title_ku,
          contents: content.map((c: any) => ({ id: c.part || c.id, text: c.text }))
        });
      }
    } catch (error) {
      console.error('Error downloading book:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const translateContent = async (text: string) => {
    if (!text || isTranslating) return;
    
    setIsTranslating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const targetLang = lang === 'en' ? 'English' : 'Sorani Kurdish';
      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: `Translate the following Arabic historical text to ${targetLang}. Keep the tone formal and historical. Only provide the translation:\n\n${text}`,
      });
      
      setTranslatedContent(response.text || (lang === 'en' ? 'Translation not available' : 'وەرگێڕان بەردەست نییە'));
    } catch (error) {
      console.error('Translation error:', error);
      alert(lang === 'ku' ? 'هەڵەیەک ڕوویدا لە وەرگێڕاندا' : 'An error occurred during translation');
      setTranslatedContent(lang === 'en' ? 'An error occurred during translation' : 'هەڵەیەک ڕوویدا لە کاتی وەرگێڕان');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleBack = () => {
    if (viewMode === 'reader') {
      if (showReader) {
        setShowReader(false);
      } else {
        setViewMode('grid');
        setSelectedBook(null);
        setBookContent(null);
        setTranslatedContent(null);
      }
    } else if (onBack) {
      onBack();
    }
  };

  return (
    <div className={`min-h-screen ${language === 'ar' ? 'font-serif' : 'font-sans'} pb-20`}>
      <AnimatePresence mode="wait">
        {viewMode === 'grid' ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-4xl mx-auto p-6"
          >
            <div className="flex items-center justify-between mb-8">
              <button 
                onClick={onBack}
                className="flex items-center gap-2 text-gold bg-gold/10 px-4 py-2 rounded-full hover:bg-gold/20 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
                <span className="font-medium text-sm">{lang === 'ar' ? 'رجوع' : lang === 'en' ? 'Back' : 'گەڕانەوە'}</span>
              </button>
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold to-gold">
                {lang === 'ar' ? 'مكتبة التاريخ' : lang === 'en' ? 'History Library' : 'کتێبخانەی مێژوو'}
              </h2>
            </div>

            <div className="relative mb-8">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/50 w-5 h-5" />
              <input
                type="text"
                placeholder={lang === 'ar' ? 'بحث في الكتب...' : lang === 'en' ? 'Search books...' : 'گەڕان لە کتێبەکان...'}
                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gold/30 focus:ring-2 focus:ring-gold/50 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              {filteredBooks.map((book, idx) => (
                <motion.div
                  key={book.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ scale: 1.02, x: -4 }}
                  className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-white/10 transition-all group"
                  onClick={() => handleBookSelect(book)}
                >
                  <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center shrink-0">
                    <Book className="w-6 h-6 text-gold" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-lg">{lang === 'ar' ? book.title_ar : lang === 'en' ? book.title_en || book.title_ar : book.title_ku}</h3>
                    <p className="text-gold/60 text-xs line-clamp-1">{lang === 'ar' ? book.description_ar : lang === 'en' ? book.description_en || book.description_ar : book.description_ku}</p>
                  </div>
                  <ChevronLeft className="w-5 h-5 text-gold/30 group-hover:text-gold transition-colors" />
                </motion.div>
              ))}
            </div>

            {filteredBooks.length === 0 && (
              <div className="text-center py-20 text-gold/50">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>{lang === 'ar' ? 'لا توجد نتائج' : lang === 'en' ? 'No results found' : 'هیچ ئەنجامێک نەدۆزرایەوە'}</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="reader"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-4xl mx-auto p-6"
          >
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-gold bg-gold/10 px-4 py-2 rounded-full mb-8 hover:bg-gold/20 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
              <span className="font-medium text-sm">{lang === 'ar' ? 'رجوع' : lang === 'en' ? 'Back' : 'گەڕانەوە'}</span>
            </button>

            <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl">
              {!showReader ? (
                <div className="p-8 flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-3xl bg-gold/20 flex items-center justify-center mb-6">
                    <Book className="w-12 h-12 text-gold" />
                  </div>
                  
                  <h2 className="text-3xl font-bold text-white mb-4">
                    {lang === 'ar' ? selectedBook?.title_ar : lang === 'en' ? selectedBook?.title_en || selectedBook?.title_ar : selectedBook?.title_ku}
                  </h2>
                  
                  <div className="flex flex-wrap justify-center gap-4 mb-8">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-gold/80">
                      <User className="w-4 h-4" />
                      <span className="text-sm">{lang === 'ar' ? 'المؤلف: غير معروف' : lang === 'en' ? 'Author: Unknown' : 'نووسەر: نەناسراو'}</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-gold/80">
                      <Hash className="w-4 h-4" />
                      <span className="text-sm">ID: {selectedBook?.id.substring(0, 8)}...</span>
                    </div>
                  </div>

                  <div className="max-w-xl mb-10">
                    <p className="text-white/70 leading-relaxed text-lg italic">
                      {lang === 'ar' ? selectedBook?.description_ar : lang === 'en' ? selectedBook?.description_en || selectedBook?.description_ar : selectedBook?.description_ku}
                    </p>
                  </div>

                  <div className="w-full max-w-sm">
                    {isDownloading ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-center gap-3 text-gold">
                          <Loader2 className="w-6 h-6 animate-spin" />
                          <span className="font-bold">{lang === 'ar' ? 'جاري التحميل...' : lang === 'en' ? 'Downloading...' : 'لە داگرتندایە...'}</span>
                        </div>
                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-gold"
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                        </div>
                      </div>
                    ) : isDownloaded ? (
                      <button
                        onClick={() => setShowReader(true)}
                        className="w-full py-4 bg-gold text-olive rounded-2xl font-bold text-xl flex items-center justify-center gap-3 hover:bg-gold/90 transition-all shadow-lg shadow-gold/20"
                      >
                        <BookOpen className="w-6 h-6" />
                        {lang === 'ar' ? 'اقرأ الآن' : lang === 'en' ? 'Read Now' : 'ئێستا بخوێنەرەوە'}
                      </button>
                    ) : (
                      <button
                        onClick={handleDownload}
                        className="w-full py-4 bg-white/10 text-gold border border-gold/30 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 hover:bg-white/20 transition-all"
                      >
                        <Download className="w-6 h-6" />
                        {lang === 'ar' ? 'تحميل الكتاب' : lang === 'en' ? 'Download Book' : 'داگرتنی کتێبەکە'}
                      </button>
                    )}
                  </div>
                  
                  {isDownloaded && (
                    <div className="mt-6 flex items-center gap-2 text-green-400 text-sm font-medium">
                      <CheckCircle className="w-4 h-4" />
                      {lang === 'ar' ? 'الكتاب محفوظ محلياً' : lang === 'en' ? 'Book saved locally' : 'کتێبەکە بە ناوخۆیی پاشەکەوت کراوە'}
                    </div>
                  )}
                </div>
              ) : (() => {
                let isPdfOrWord = false;
                if (selectedBook?.contentUrl) {
                  try {
                    const url = new URL(selectedBook.contentUrl);
                    const pathname = decodeURIComponent(url.pathname).toLowerCase();
                    if (pathname.endsWith('.pdf') || pathname.endsWith('.doc') || pathname.endsWith('.docx')) {
                      isPdfOrWord = true;
                    }
                  } catch (e) {
                    const urlLower = selectedBook.contentUrl.toLowerCase();
                    if (urlLower.includes('.pdf') || urlLower.includes('.doc') || urlLower.includes('.docx')) {
                      isPdfOrWord = true;
                    }
                  }
                }

                if (!isPdfOrWord && bookContent?.contents?.length === 1 && bookContent.contents[0].text === 'BINARY_DOCUMENT') {
                  isPdfOrWord = true;
                }

                if (isPdfOrWord) {
                  return (
                    <div className="flex flex-col h-[80vh]">
                      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                        <h2 className="text-xl font-bold text-white truncate px-4">
                          {lang === 'ar' ? selectedBook?.title_ar : lang === 'en' ? selectedBook?.title_en || selectedBook?.title_ar : selectedBook?.title_ku}
                        </h2>
                      </div>
                      <iframe 
                        src={`https://docs.google.com/gview?url=${encodeURIComponent(selectedBook!.contentUrl!)}&embedded=true`}
                        className="w-full flex-1 border-0"
                        title="Document Viewer"
                      />
                    </div>
                  );
                }

                return bookContent ? (
                <div className="flex flex-col">
                  <div className="p-6 border-b border-white/10 bg-white/5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-2xl font-bold text-white mb-1" dir="rtl">
                          {bookContent?.book_title}
                        </h2>
                      </div>
                      <button
                        onClick={() => translateContent(bookContent?.contents?.[currentPage]?.text || '')}
                        disabled={isTranslating}
                        className="flex items-center gap-2 px-6 py-2 bg-gold text-olive rounded-xl hover:bg-gold/80 disabled:opacity-50 transition-all font-bold"
                      >
                        {isTranslating ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Languages className="w-4 h-4" />
                        )}
                        {lang === 'ar' ? 'ترجمة للكردية' : lang === 'en' ? 'Translate to English' : 'وەرگێڕان بۆ کوردی'}
                      </button>
                    </div>
                  </div>

                  <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    <div className="space-y-8">
                      <div className="space-y-4">
                        <h3 className="text-xl font-bold text-gold border-r-4 border-gold pr-4" dir="rtl">
                          {lang === 'ar' ? 'الجزء' : lang === 'en' ? 'Part' : 'بەش'} {bookContent?.contents?.[currentPage]?.id}
                        </h3>
                        <div className="text-xl leading-relaxed text-white font-serif whitespace-pre-wrap text-justify" dir="rtl">
                          {bookContent?.contents?.[currentPage]?.text}
                        </div>
                      </div>

                      {translatedContent && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-gold/10 p-6 rounded-2xl border border-gold/20"
                        >
                          <div className="flex items-center gap-2 text-gold font-bold mb-4">
                            <Languages className="w-5 h-5" />
                            {lang === 'ar' ? 'الترجمة الكردية' : lang === 'en' ? 'English Translation' : 'وەرگێڕانی کوردی'}
                          </div>
                          <div className="text-xl leading-relaxed text-white font-medium whitespace-pre-wrap text-justify">
                            {translatedContent}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  <div className="p-6 border-t border-white/10 bg-white/5 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setCurrentPage(prev => Math.max(0, prev - 1));
                        setTranslatedContent(null);
                      }}
                      disabled={currentPage === 0}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-white hover:bg-white/5 disabled:opacity-20 transition-all"
                    >
                      <ChevronRight className="w-5 h-5" />
                      {lang === 'ar' ? 'السابق' : lang === 'en' ? 'Previous' : 'پێشوو'}
                    </button>
                    
                    <span className="text-gold/50 font-bold">
                      {currentPage + 1} / {bookContent?.contents?.length || 0}
                    </span>

                    <button
                      onClick={() => {
                        setCurrentPage(prev => Math.min((bookContent?.contents?.length || 1) - 1, prev + 1));
                        setTranslatedContent(null);
                      }}
                      disabled={currentPage === (bookContent?.contents?.length || 1) - 1}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold text-olive hover:bg-gold/80 disabled:opacity-20 transition-all font-bold"
                    >
                      {lang === 'ar' ? 'التالي' : lang === 'en' ? 'Next' : 'داهاتوو'}
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-[500px] flex flex-col items-center justify-center gap-4 text-gold/50">
                  <Info className="w-12 h-12 opacity-20" />
                  <p>{lang === 'ar' ? 'فشل تحميل الكتاب' : lang === 'en' ? 'Failed to load book' : 'بارکردنی کتێبەکە سەرکەوتوو نەبوو'}</p>
                </div>
              )
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HistoryLibrary;
