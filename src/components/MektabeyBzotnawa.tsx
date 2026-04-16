import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  BookOpen, 
  ArrowRight, 
  Loader2, 
  Download,
  Trash2,
  CheckCircle2,
  WifiOff
} from 'lucide-react';
import { bookService, Book, BookContent } from '../services/bookService';

export function MektabeyBzotnawa({ onBack, language, theme, initialBookId }: { onBack?: () => void, language: string, theme: any, initialBookId?: string }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLang, setFilterLang] = useState<'all' | 'ar' | 'ku' | 'en'>('all');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [bookContent, setBookContent] = useState<BookContent[]>([]);
  const [isDownloading, setIsDownloading] = useState<Record<string, boolean>>({});
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    loadBooks();
  }, [language]);

  const loadBooks = async () => {
    setIsLoading(true);
    const fetchedBooks = await bookService.fetchBooks('general');
    // Auto-translate missing metadata if online
    const translatedBooks = isOnline ? await bookService.translateMetadata(fetchedBooks, language) : fetchedBooks;
    setBooks(translatedBooks);
    setIsLoading(false);

    if (initialBookId) {
      const book = translatedBooks.find(b => b.id === initialBookId);
      if (book) {
        setSearchTerm(book.title?.ar || book.title_ar || '');
      }
    }
  };

  const handleDownload = async (e: React.MouseEvent, book: Book) => {
    e.stopPropagation();
    if (book.isDownloaded) return;
    
    // Check if it's a PDF/Word file
    if (book.contentUrl) {
      let isPdfOrWord = false;
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
      
      if (isPdfOrWord) {
        window.open(book.contentUrl, '_blank');
        return;
      }
    }

    setIsDownloading(prev => ({ ...prev, [book.id]: true }));
    const success = await bookService.downloadBook(book);
    if (success) {
      setBooks(prev => prev.map(b => b.id === book.id ? { ...b, isDownloaded: true } : b));
    } else {
      // Fallback if download failed due to JSON parse error (might be an unrecognized PDF)
      if (book.contentUrl) {
        window.open(book.contentUrl, '_blank');
      } else {
        alert(language === 'ar' ? 'فشل تحميل الكتاب' : language === 'en' ? 'Failed to download book' : 'دابەزاندنی کتێبەکە سەرکەوتوو نەبوو');
      }
    }
    setIsDownloading(prev => ({ ...prev, [book.id]: false }));
  };

  const handleDelete = async (e: React.MouseEvent, bookId: string) => {
    e.stopPropagation();
    bookService.deleteLocalBook(bookId);
    setBooks(prev => prev.map(b => b.id === bookId ? { ...b, isDownloaded: false } : b));
  };

  const openBook = async (book: Book) => {
    setSelectedBook(book);
    
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
      // PDF/Word will be handled by iframe in render
      return;
    }

    setIsLoading(true);
    try {
      const content = await bookService.fetchBookContent(book.id, book.contentUrl);
      if (content.length === 1 && content[0].text === 'BINARY_DOCUMENT') {
        // It's a document that wasn't caught by the URL check
        setBookContent(content);
      } else {
        setBookContent(content);
      }
    } catch (error) {
      console.error("Error opening book:", error);
      if (error instanceof Error && error.message === 'Response was not valid JSON' && book.contentUrl) {
        // Fallback if it's an unrecognized PDF
        window.open(book.contentUrl, '_blank');
        setSelectedBook(null);
      } else {
        alert(language === 'ar' ? 'حدث خطأ أثناء فتح الكتاب' : language === 'en' ? 'Error opening book' : 'هەڵەیەک ڕوویدا لە کردنەوەی کتێبەکە');
      }
    }
    setIsLoading(false);
  };

  const filteredBooks = books.filter(book => {
    const titleAr = book.title?.ar || book.title_ar || '';
    const titleKu = book.title?.ku || book.title_ku || '';
    const titleEn = book.title?.en || book.title_en || '';
    const titleTranslated = (book as any)[`title_${language}`] || '';
    
    const matchesSearch = 
      titleAr.toLowerCase().includes(searchTerm.toLowerCase()) || 
      titleKu.toLowerCase().includes(searchTerm.toLowerCase()) ||
      titleEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      titleTranslated.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterLang === 'all') return matchesSearch;
    return matchesSearch && book.language === filterLang;
  });

  if (selectedBook) {
    const title = (selectedBook as any)[`title_${language}`] || selectedBook.title?.[language as any] || selectedBook.title?.ar || selectedBook.title_ar;
    
    let isPdfOrWord = false;
    if (selectedBook.contentUrl) {
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

    // Also check if content indicates it's a binary document
    if (!isPdfOrWord && bookContent.length === 1 && bookContent[0].text === 'BINARY_DOCUMENT') {
      isPdfOrWord = true;
    }

    const docUrl = (bookContent.length === 1 && bookContent[0].text === 'BINARY_DOCUMENT') 
      ? (bookContent[0] as any).contentUrl 
      : selectedBook.contentUrl;

    return (
      <div className="flex flex-col h-full bg-slate-900 text-white">
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-800/50 backdrop-blur-md">
          <button onClick={() => { setSelectedBook(null); setBookContent([]); }} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowRight className="w-5 h-5 text-blue-400" />
          </button>
          <h2 className="text-sm font-bold text-blue-400 truncate max-w-[200px]">
            {title}
          </h2>
          <div className="w-8" />
        </div>

        <div className="flex-1 overflow-hidden relative">
          {isPdfOrWord ? (
            <iframe 
              src={`https://docs.google.com/gview?url=${encodeURIComponent(docUrl!)}&embedded=true`}
              className="w-full h-full border-0"
              title={title}
            />
          ) : (
            <div className="h-full overflow-y-auto p-6 space-y-6">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
                </div>
              ) : (
                <div className="max-w-2xl mx-auto space-y-4">
                  {bookContent.map((item) => (
                    <div key={item.id} className="bg-slate-800/50 border border-white/10 rounded-xl p-6 shadow-lg">
                      <p className="text-lg leading-relaxed text-right font-serif">
                        {item.text}
                      </p>
                    </div>
                  ))}
                  {bookContent.length === 0 && (
                    <div className="text-center py-20 text-slate-500">
                      <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p>{language === 'ar' ? 'لم يتم العثور على محتوى' : language === 'en' ? 'No content found' : 'هیچ ناوەڕۆکێک نەدۆزرایەوە'}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 bg-slate-950 min-h-full">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          {onBack && (
            <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <ArrowRight className="w-5 h-5 text-blue-400" />
            </button>
          )}
          <div className="relative flex-1">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={language === 'ar' ? 'البحث في مكتبة الحركة...' : language === 'en' ? 'Search in Movement Library...' : 'گەڕان لە کتێبخانەی بزووتنەوە...'}
              className="w-full bg-slate-900 border border-white/10 rounded-2xl py-4 pr-12 pl-4 text-sm focus:outline-none focus:border-blue-500/50 transition-colors text-white"
            />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {(['all', 'ar', 'ku', 'en'] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => setFilterLang(lang)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                filterLang === lang 
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' 
                : 'bg-slate-900 text-slate-400 border border-white/5 hover:border-white/20'
              }`}
            >
              {lang === 'all' ? (language === 'ar' ? 'الكل' : language === 'en' ? 'All' : 'هەمووی') : lang === 'ar' ? 'عربي' : lang === 'en' ? 'English' : 'کوردی'}
            </button>
          ))}
        </div>
      </div>

      {!isOnline && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center gap-3 text-amber-500 text-sm">
          <WifiOff className="w-5 h-5" />
          <p>{language === 'ar' ? 'أنت غير متصل بالإنترنت حالياً. سترى فقط الكتب التي قمت بتحميلها مسبقاً.' : language === 'en' ? 'You are currently offline. You will only see books you have previously downloaded.' : 'تۆ لە ئێستادا ئۆفلاینیت. تەنها ئەو کتێبانە دەبینیت کە پێشتر داتگرتوون.'}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
          <p className="mt-4 text-slate-500 text-sm">{language === 'ar' ? 'جاري التحميل...' : language === 'en' ? 'Loading...' : 'باردەکرێت...'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBooks.map((book) => (
            <motion.div
              key={book.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group relative bg-slate-900 border border-white/5 rounded-2xl p-5 hover:border-blue-500/30 transition-all overflow-hidden"
            >
              <div className="flex justify-between items-start mb-4 gap-4">
                <div className="flex gap-2">
                  {book.isDownloaded ? (
                    <button 
                      onClick={(e) => handleDelete(e, book.id)}
                      className="p-2 bg-red-500/10 rounded-lg text-red-500 hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <button 
                      onClick={(e) => handleDownload(e, book)}
                      disabled={isDownloading[book.id] || !isOnline}
                      className="p-2 bg-blue-500/10 rounded-lg text-blue-400 hover:bg-blue-500/20 transition-colors disabled:opacity-30"
                    >
                      {isDownloading[book.id] ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  <button 
                    onClick={() => openBook(book)}
                    className="p-2 bg-blue-500/10 rounded-lg text-blue-400 hover:bg-blue-500/20 transition-colors"
                  >
                    <BookOpen className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex gap-3 items-start flex-1 justify-end">
                  <div className="text-right">
                    <h3 className="text-lg font-bold text-slate-200 group-hover:text-blue-400 transition-colors">
                      {(book as any)[`title_${language}`] || book.title?.[language as any] || book.title?.ar || book.title_ar}
                      {book.isDownloaded && <CheckCircle2 className="inline-block mr-2 w-4 h-4 text-green-500" />}
                    </h3>
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                      {book.category || (language === 'ar' ? 'عام' : language === 'en' ? 'General' : 'گشتی')}
                    </span>
                  </div>
                  {book.imageUrl && (
                    <div className="w-16 h-20 flex-shrink-0 rounded-lg overflow-hidden border border-white/10 shadow-lg">
                      <img src={book.imageUrl} alt="Cover" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  )}
                </div>
              </div>
              
              <p className="text-sm text-slate-500 text-right line-clamp-2 leading-relaxed">
                {(book as any)[`description_${language}`] || book.description?.[language as any] || book.description?.ar || book.description_ar}
              </p>

              <div className="mt-4 flex items-center justify-end gap-2">
                <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                  book.language === 'ar' ? 'bg-emerald-500/10 text-emerald-500' : book.language === 'en' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'
                }`}>
                  {book.language === 'ar' ? 'العربية' : book.language === 'en' ? 'English' : 'کوردی'}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
