import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ChevronRight, 
  ChevronLeft, 
  BookOpen, 
  Search, 
  ArrowRight, 
  Languages,
  Loader2,
  Quote,
  Download,
  Trash2,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { bookService, Book, BookContent } from '../services/bookService';

export function FiqhLibrary({ language, onBack }: { language: 'ar' | 'ku' | 'en', onBack?: () => void }) {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [bookContent, setBookContent] = useState<BookContent[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [translations, setTranslations] = useState<Record<number, string>>({});
  const [isTranslating, setIsTranslating] = useState<Record<number, boolean>>({});
  const [books, setBooks] = useState<Book[]>([]);
  const [isDownloading, setIsDownloading] = useState<Record<string, boolean>>({});
  const [selectedSubCategory, setSelectedSubCategory] = useState<'fiqh_hanbali' | 'fiqh_hanafi'>('fiqh_hanbali');

  useEffect(() => {
    loadBooks();
  }, [selectedSubCategory]);

  const loadBooks = async () => {
    setIsLoading(true);
    const fetchedBooks = await bookService.fetchBooks(selectedSubCategory);
    setBooks(fetchedBooks);
    setIsLoading(false);
  };

  useEffect(() => {
    if (selectedBook) {
      setIsLoading(true);
      bookService.fetchBookContent(selectedBook.id, selectedBook.contentUrl)
        .then(data => {
          setBookContent(data);
          setIsLoading(false);
        })
        .catch(err => {
          console.error(err);
          if (err instanceof Error && err.message === 'Response was not valid JSON' && selectedBook.contentUrl) {
            // Fallback for unrecognized document
            setBookContent([{ id: 'document', text: 'BINARY_DOCUMENT', contentUrl: selectedBook.contentUrl }]);
          }
          setIsLoading(false);
        });
    }
  }, [selectedBook]);

  const handleDownload = async (e: React.MouseEvent, book: Book) => {
    e.stopPropagation();
    if (book.isDownloaded) return;
    
    setIsDownloading(prev => ({ ...prev, [book.id]: true }));
    const success = await bookService.downloadBook(book);
    if (success) {
      setBooks(prev => prev.map(b => b.id === book.id ? { ...b, isDownloaded: true } : b));
    }
    setIsDownloading(prev => ({ ...prev, [book.id]: false }));
  };

  const handleDelete = async (e: React.MouseEvent, bookId: string) => {
    e.stopPropagation();
    bookService.deleteLocalBook(bookId);
    setBooks(prev => prev.map(b => b.id === bookId ? { ...b, isDownloaded: false } : b));
  };

  const translatePage = async (pageId: number, text: string) => {
    if (translations[pageId]) return;
    
    setIsTranslating(prev => ({ ...prev, [pageId]: true }));
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const targetLang = language === 'en' ? 'English' : 'Kurdish (Sorani)';
      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: `Translate this religious text to ${targetLang}. Only provide the translation, no other text or explanation:\n\n` + text,
      });
      setTranslations(prev => ({ ...prev, [pageId]: response.text || 'Error translating' }));
    } catch (error) {
      console.error(error);
      alert(language === 'ku' ? 'هەڵەیەک ڕوویدا لە وەرگێڕاندا' : 'An error occurred during translation');
      setTranslations(prev => ({ ...prev, [pageId]: language === 'en' ? 'An error occurred during translation' : 'هەڵەیەک ڕوویدا لە وەرگێڕاندا' }));
    } finally {
      setIsTranslating(prev => ({ ...prev, [pageId]: false }));
    }
  };

  const filteredBooks = books.filter(book => {
    const titleAr = book.title?.ar || book.title_ar || '';
    const titleKu = book.title?.ku || book.title_ku || '';
    const titleEn = book.title?.en || book.title_en || '';
    return titleAr.includes(searchTerm) || titleKu.includes(searchTerm) || titleEn.includes(searchTerm);
  });

  if (selectedBook) {
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

    if (isPdfOrWord) {
      return (
        <div className="flex flex-col h-full bg-black text-white">
          <div className="p-4 border-b border-gold/20 flex items-center justify-between bg-black/50 backdrop-blur-md sticky top-0 z-10">
            <button onClick={() => { setSelectedBook(null); setBookContent([]); setCurrentPage(0); setTranslations({}); }} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <ArrowRight className="w-5 h-5 text-gold" />
            </button>
            <h2 className="text-sm font-bold text-gold truncate max-w-[200px]">
              {language === 'ar' ? selectedBook.title_ar : language === 'en' ? selectedBook.title_en || selectedBook.title_ar : selectedBook.title_ku}
            </h2>
            <div className="w-8" />
          </div>
          <iframe 
            src={`https://docs.google.com/gview?url=${encodeURIComponent(selectedBook.contentUrl!)}&embedded=true`}
            className="w-full flex-1 border-0"
            title="Document Viewer"
          />
        </div>
      );
    }

    if (bookContent.length > 0) {
      const currentItem = bookContent[currentPage];
      const isBinaryDoc = currentItem?.text === 'BINARY_DOCUMENT';
      const docUrl = isBinaryDoc ? (currentItem as any).contentUrl : selectedBook.contentUrl;

      return (
        <div className="flex flex-col h-full bg-black text-white">
          <div className="p-4 border-b border-gold/20 flex items-center justify-between bg-black/50 backdrop-blur-md sticky top-0 z-10">
            <button onClick={() => { setSelectedBook(null); setBookContent([]); setCurrentPage(0); setTranslations({}); }} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <ArrowRight className="w-5 h-5 text-gold" />
            </button>
            <h2 className="text-sm font-bold text-gold truncate max-w-[200px]">
              {language === 'ar' ? selectedBook.title_ar : language === 'en' ? selectedBook.title_en || selectedBook.title_ar : selectedBook.title_ku}
            </h2>
            <div className="w-8" />
          </div>

          <div className="flex-1 overflow-hidden relative">
            {isBinaryDoc ? (
              <iframe 
                src={`https://docs.google.com/gview?url=${encodeURIComponent(docUrl!)}&embedded=true`}
                className="w-full h-full border-0"
                title="Document Viewer"
              />
            ) : (
              <div className="h-full overflow-y-auto p-6 space-y-6">
                <motion.div
                  key={currentPage}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="bg-white/5 border border-gold/10 rounded-2xl p-6 shadow-xl relative group">
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-gold/20 rounded-full flex items-center justify-center border border-gold/30">
                      <span className="text-[10px] font-bold text-gold">{currentItem.part || currentPage + 1}</span>
                    </div>
                    
                    <p className="text-lg leading-relaxed font-serif text-slate-200 text-right">
                      {currentItem.text}
                    </p>

                    {language === 'ku' || language === 'en' ? (
                      <div className="mt-6 pt-6 border-t border-gold/10">
                        {translations[currentPage] ? (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-gold/60 text-[10px] font-bold uppercase tracking-wider">
                              <Quote className="w-3 h-3" />
                              {language === 'en' ? 'English Translation' : 'وەرگێڕانی کوردی'}
                            </div>
                            <p className="text-lg leading-relaxed text-gold font-medium text-right">
                              {translations[currentPage]}
                            </p>
                          </div>
                        ) : (
                          <button
                            onClick={() => translatePage(currentPage, currentItem.text)}
                            disabled={isTranslating[currentPage]}
                            className="flex items-center gap-2 px-4 py-2 bg-gold/10 border border-gold/30 rounded-xl text-gold text-xs font-bold hover:bg-gold/20 transition-all disabled:opacity-50"
                          >
                            {isTranslating[currentPage] ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Languages className="w-3 h-3" />
                            )}
                            {language === 'en' ? 'Translate to English' : 'وەرگێڕان بۆ کوردی'}
                          </button>
                        )}
                      </div>
                    ) : null}
                  </div>
                </motion.div>
              </div>
            )}
          </div>

          {!isBinaryDoc && (
            <div className="p-4 border-t border-gold/20 bg-black/50 backdrop-blur-md flex items-center justify-between">
              <button 
                disabled={currentPage === 0}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="p-3 bg-white/5 border border-white/10 rounded-xl disabled:opacity-30 hover:bg-white/10 transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gold" />
              </button>
              <span className="text-xs font-bold text-gold/60">
                {currentPage + 1} / {bookContent.length}
              </span>
              <button 
                disabled={currentPage === bookContent.length - 1}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="p-3 bg-white/5 border border-white/10 rounded-xl disabled:opacity-30 hover:bg-white/10 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gold" />
              </button>
            </div>
          )}
        </div>
      );
    }
  }

  return (
    <div className="p-4 space-y-6 bg-black min-h-full">
      <div className="flex items-center gap-4 mb-4">
        {onBack && (
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowRight className="w-5 h-5 text-gold" />
          </button>
        )}
        <div className="relative flex-1">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/40" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={language === 'ar' ? 'بحث في الكتب...' : language === 'en' ? 'Search books...' : 'گەڕان لە کتێبەکان...'}
            className="w-full bg-white/5 border border-gold/20 rounded-2xl py-4 pr-12 pl-4 text-sm focus:outline-none focus:border-gold/50 transition-colors text-white"
          />
        </div>
      </div>
      
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setSelectedSubCategory('fiqh_hanbali')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${selectedSubCategory === 'fiqh_hanbali' ? 'bg-gold text-black shadow-lg shadow-gold/20' : 'bg-white/5 text-gold border border-gold/20'}`}
        >
          {language === 'ar' ? 'فقه الحنبلي' : language === 'en' ? 'Hanbali Fiqh' : 'فقهی حەنبەلی'}
        </button>
        <button
          onClick={() => setSelectedSubCategory('fiqh_hanafi')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${selectedSubCategory === 'fiqh_hanafi' ? 'bg-gold text-black shadow-lg shadow-gold/20' : 'bg-white/5 text-gold border border-gold/20'}`}
        >
          {language === 'ar' ? 'فقه الحنفي' : language === 'en' ? 'Hanafi Fiqh' : 'فقهی حەنەفی'}
        </button>
        
        <button
          onClick={loadBooks}
          className="p-2 bg-white/5 text-gold border border-gold/20 rounded-xl hover:bg-white/10 transition-colors ml-auto"
          title={language === 'ar' ? 'تحديث' : language === 'en' ? 'Refresh' : 'نوێکردنەوە'}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-gold animate-spin mb-4" />
          <p className="text-gold/60 text-sm animate-pulse">
            {language === 'ar' ? 'جاري جلب الكتب...' : language === 'en' ? 'Fetching books...' : 'خەریکە کتێبەکان دەهێنرێن...'}
          </p>
        </div>
      ) : books.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-6">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-gold/10">
            <BookOpen className="w-10 h-10 text-gold/20" />
          </div>
          <h3 className="text-gold font-bold mb-2">
            {language === 'ar' ? 'لا توجد كتب حالياً' : language === 'en' ? 'No books available' : 'هیچ کتێبێک نییە ئێستا'}
          </h3>
          <p className="text-white/40 text-sm mb-8 max-w-xs">
            {language === 'ar' 
              ? 'لم يتم العثور على كتب في هذا القسم. حاول تحديث القائمة.' 
              : language === 'en'
              ? 'No books found in this section. Try refreshing the list.'
              : 'هیچ کتێبێک لەم بەشەدا نەدۆزرایەوە. هەوڵ بدە لیستەکە نوێ بکەیتەوە.'}
          </p>
          <button
            onClick={loadBooks}
            className="flex items-center gap-2 px-6 py-3 bg-gold text-black rounded-xl font-bold hover:scale-105 transition-transform"
          >
            <RefreshCw className="w-4 h-4" />
            {language === 'ar' ? 'تحديث القائمة' : language === 'en' ? 'Refresh List' : 'نوێکردنەوەی لیستەکە'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredBooks.map((book) => (
            <motion.div
              key={book.id}
              whileHover={{ scale: 1.01 }}
              className="flex flex-col p-5 bg-white/5 border border-gold/10 rounded-2xl text-right hover:bg-white/10 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-1 h-full bg-gold opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-start justify-between mb-3">
                <div className="flex gap-2">
                  {book.isDownloaded ? (
                    <button 
                      onClick={(e) => handleDelete(e, book.id)}
                      className="p-2 bg-red-500/10 rounded-lg text-red-500 hover:bg-red-500/20 transition-colors"
                      title="سڕینەوە"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <button 
                      onClick={(e) => handleDownload(e, book)}
                      disabled={isDownloading[book.id]}
                      className="p-2 bg-gold/10 rounded-lg text-gold hover:bg-gold/20 transition-colors disabled:opacity-50"
                      title="داگرتن"
                    >
                      {isDownloading[book.id] ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  <button 
                    onClick={() => setSelectedBook(book)}
                    className="p-2 bg-gold/10 rounded-lg text-gold hover:bg-gold/20 transition-colors"
                  >
                    <BookOpen className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="text-lg font-bold text-gold group-hover:text-white transition-colors cursor-pointer" onClick={() => setSelectedBook(book)}>
                  {language === 'ar' ? book.title_ar : language === 'en' ? book.title_en || book.title_ar : book.title_ku}
                  {book.isDownloaded && <CheckCircle2 className="inline-block mr-2 w-4 h-4 text-green-500" />}
                </h3>
              </div>
              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed cursor-pointer" onClick={() => setSelectedBook(book)}>
                {language === 'ar' ? book.description_ar : language === 'en' ? book.description_en || book.description_ar : book.description_ku}
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
