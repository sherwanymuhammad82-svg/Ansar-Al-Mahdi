import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Search, ChevronRight, ChevronLeft, Book, Languages } from 'lucide-react';
import BookReader from './BookReader';
import { safeFetch } from '../utils/fetchUtils';

interface LanguageBook {
  shamela_id: string;
  title_ar: string;
  author: string;
  full_content: string;
}

export default function LanguageLibrary({ language, theme, onBack }: { language: 'ar' | 'ku' | 'en', theme: 'night' | 'white' | 'cream', onBack: () => void }) {
  const [books, setBooks] = useState<LanguageBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBook, setSelectedBook] = useState<LanguageBook | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const booksPerPage = 24;

  useEffect(() => {
    const directUrl = 'https://github.com/sherwanymuhammad82-svg/-/releases/download/5/final_language_books.json';
    const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(directUrl)}`;

    const fetchData = async (url: string) => {
      try {
        const data: any = await safeFetch(url);
        
        if (Array.isArray(data)) {
          setBooks(data);
          return true;
        } else if (data && typeof data === 'object' && Array.isArray(data.books)) {
          setBooks(data.books);
          return true;
        } else if (data && typeof data === 'object' && Array.isArray(data.data)) {
          setBooks(data.data);
          return true;
        }
        return false;
      } catch (err) {
        console.error(`Error fetching from ${url}:`, err);
        return false;
      }
    };

    const loadBooks = async () => {
      setIsLoading(true);
      
      // Try proxy first as direct github release download often fails due to CORS
      console.log("Attempting to fetch Language books via proxy...");
      let success = await fetchData(proxyUrl);
      
      if (!success) {
        console.log("Proxy fetch failed, trying direct...");
        success = await fetchData(directUrl);
      }

      if (!success) {
        // Last resort: try raw github URL
        const rawUrl = 'https://raw.githubusercontent.com/sherwanymuhammad82-svg/my-book-api/refs/heads/main/final_language_books.json';
        console.log("Direct fetch failed, trying raw github URL...");
        success = await fetchData(rawUrl);
      }

      setIsLoading(false);
    };

    loadBooks();
  }, []);

  const { booksFound, phrasesFound } = useMemo(() => {
    if (!searchTerm) {
      return { booksFound: books, phrasesFound: [] };
    }

    const booksFoundArr: any[] = [];
    const phrasesFoundArr: any[] = [];

    books.forEach(book => {
      const titleMatch = book.title_ar?.toLowerCase().includes(searchTerm.toLowerCase());
      const authorMatch = book.author?.toLowerCase().includes(searchTerm.toLowerCase());
      const contentMatch = book.full_content?.toLowerCase().includes(searchTerm.toLowerCase());

      if (titleMatch || authorMatch) {
        booksFoundArr.push(book);
      } else if (contentMatch) {
        phrasesFoundArr.push(book);
      }
    });

    return { booksFound: booksFoundArr, phrasesFound: phrasesFoundArr };
  }, [searchTerm, books]);

  const totalPages = Math.ceil(booksFound.length / booksPerPage);
  const currentBooks = useMemo(() => {
    const start = (currentPage - 1) * booksPerPage;
    return booksFound.slice(start, start + booksPerPage);
  }, [booksFound, currentPage, booksPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (selectedBook) {
    return (
      <BookReader
        book={selectedBook}
        content={selectedBook.full_content}
        language={language}
        onClose={() => setSelectedBook(null)}
        searchTerm={searchTerm}
      />
    );
  }

  return (
    <div className="p-6 max-w-md mx-auto w-full pb-24">
      <button 
        onClick={onBack} 
        className="flex items-center gap-2 text-gold bg-olive/10 px-4 py-2 rounded-full mb-8 hover:bg-olive/20 transition-colors"
      >
        <ChevronRight className="w-5 h-5" />
        <span className="font-medium text-sm">{language === 'ar' ? 'رجوع' : language === 'en' ? 'Back' : 'گەڕانەوە'}</span>
      </button>
      
      <div className="text-center mb-8">
        <div className="w-24 h-24 rounded-2xl bg-olive/10 flex items-center justify-center mx-auto mb-4 border border-olive/20 overflow-hidden shadow-xl">
          <Languages className="w-12 h-12 text-gold" />
        </div>
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-olive to-gold mb-2 font-serif">
          {language === 'ar' ? 'كتب اللغة' : language === 'en' ? 'Language Books' : 'کتێبەکانی زمان'}
        </h2>
      </div>

      <div className={`sticky top-0 z-20 space-y-4 ${theme === 'night' ? 'bg-black/40 border-white/10' : 'bg-stone-100/80 border-stone-200 shadow-sm'} backdrop-blur-md p-4 rounded-2xl border mb-6`}>
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder={language === 'ar' ? 'بحث في الكتب...' : language === 'en' ? 'Search books...' : 'گەڕان لە کتێبەکاندا...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full ${theme === 'night' ? 'bg-white/5 border-white/10 text-gold' : 'bg-white/20 backdrop-blur-sm border-stone-200/30 text-stone-900'} border rounded-xl py-3 pr-12 pl-4 focus:outline-none focus:border-gold/50 transition-colors`}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {searchTerm && (booksFound.length > 0 || phrasesFound.length > 0) && (
            <div className="px-4 py-2">
              <h2 className={`text-sm font-bold ${theme === 'night' ? 'text-gold' : 'text-olive'}`}>
                {language === 'ar' ? 'نتائج البحث' : language === 'en' ? 'Search Results' : 'ئەنجامەکانی گەڕان'}
              </h2>
            </div>
          )}

          {booksFound.length > 0 && (
            <>
              {searchTerm && (
                <div className="px-4 py-1">
                  <h3 className={`text-xs font-semibold ${theme === 'night' ? 'text-slate-300' : 'text-slate-600'}`}>
                    {language === 'ar' ? 'الكتب الموجودة' : language === 'en' ? 'Books Found' : 'کتێبە دۆزراوەکان'}
                  </h3>
                </div>
              )}
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2 px-2 py-2">
                {currentBooks.map((book, idx) => {
                  const titleStr = book.title_ar || '';
                  const colorIndex = titleStr.length % 6;
                  const colors = [
                    'from-olive to-gold',
                    'from-gold to-olive',
                    'from-olive to-gold',
                    'from-gold to-olive',
                    'from-olive to-gold',
                    'from-gold to-olive'
                  ];
                  const bookColor = colors[colorIndex];

                  return (
                    <motion.button
                      key={idx}
                      onClick={() => setSelectedBook(book)}
                      className="group relative flex flex-col items-center text-center transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {/* Book Cover */}
                      <div className={`relative w-full aspect-[2/3] rounded-r-lg rounded-l-sm bg-gradient-to-br ${bookColor} flex flex-col items-center justify-center shadow-md group-hover:shadow-xl transition-shadow duration-300 mb-1 overflow-hidden border-l-2 border-white/20`}>
                        <div className="absolute inset-0 bg-black/20" />
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-r from-black/40 to-transparent" />
                        
                        <div className="absolute top-1 w-3/4 h-px border-t border-b border-white/20" />
                        <div className="absolute bottom-1 w-3/4 h-px border-t border-b border-white/20" />
                        
                        <Book className="w-4 h-4 text-white/80 relative z-10 mb-0.5" />
                        <h3 className="text-white font-bold text-[8px] sm:text-[9px] px-0.5 line-clamp-3 relative z-10 font-serif leading-tight">
                          {book.title_ar}
                        </h3>
                      </div>
                      
                      {/* Book Title Below Cover */}
                      <h3 className={`font-bold ${theme === 'night' ? 'text-gold/80' : 'text-stone-800'} text-[9px] sm:text-[10px] leading-tight font-serif line-clamp-2 px-0.5`}>
                        {book.title_ar.split(new RegExp(`(${searchTerm})`, 'gi')).map((part: string, i: number) => 
                          part.toLowerCase() === searchTerm.toLowerCase() ? <span key={i} className="bg-gold/30 text-olive font-bold">{part}</span> : part
                        )}
                      </h3>
                    </motion.button>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-6 mb-8">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-full transition-all ${theme === 'night' ? 'bg-white/5 text-gold disabled:opacity-30' : 'bg-stone-200 text-stone-600 disabled:opacity-30'}`}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <span className={`text-xs font-bold ${theme === 'night' ? 'text-gold' : 'text-stone-600'}`}>
                    {language === 'ar' ? `الصفحة ${currentPage} من ${totalPages}` : language === 'en' ? `Page ${currentPage} of ${totalPages}` : `لاپەڕە ${currentPage} لە ${totalPages}`}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-full transition-all ${theme === 'night' ? 'bg-white/5 text-gold disabled:opacity-30' : 'bg-stone-200 text-stone-600 disabled:opacity-30'}`}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          )}

          {phrasesFound.length > 0 && (
            <>
              <div className="px-4 py-1 mt-2">
                <h3 className={`text-xs font-semibold ${theme === 'night' ? 'text-slate-300' : 'text-slate-600'}`}>
                  {language === 'ar' ? 'عبارات وجدت داخل النص' : language === 'en' ? 'Phrases found in text' : 'دەستەواژەکان لە ناو دەقدا دۆزرانەوە'}
                </h3>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2 px-2 py-2">
                {phrasesFound.map((book, idx) => {
                  const titleStr = book.title_ar || '';
                  const colorIndex = titleStr.length % 6;
                  const colors = [
                    'from-olive to-gold',
                    'from-gold to-olive',
                    'from-olive to-gold',
                    'from-gold to-olive',
                    'from-olive to-gold',
                    'from-gold to-olive'
                  ];
                  const bookColor = colors[colorIndex];

                  return (
                    <motion.button
                      key={idx}
                      onClick={() => setSelectedBook(book)}
                      className="group relative flex flex-col items-center text-center transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {/* Book Cover */}
                      <div className={`relative w-full aspect-[2/3] rounded-r-lg rounded-l-sm bg-gradient-to-br ${bookColor} flex flex-col items-center justify-center shadow-md group-hover:shadow-xl transition-shadow duration-300 mb-2 overflow-hidden border-l-2 border-white/20`}>
                        <div className="absolute inset-0 bg-black/20" />
                        <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-black/40 to-transparent" />
                        
                        <div className="absolute top-2 w-3/4 h-px border-t border-b border-white/20" />
                        <div className="absolute bottom-2 w-3/4 h-px border-t border-b border-white/20" />
                        
                        <Book className="w-5 h-5 text-white/80 relative z-10 mb-1" />
                        <h3 className="text-white font-bold text-[9px] sm:text-[10px] px-1 line-clamp-3 relative z-10 font-serif leading-tight">
                          {book.title_ar}
                        </h3>
                      </div>
                      
                      {/* Book Title Below Cover */}
                      <h3 className={`font-bold ${theme === 'night' ? 'text-gold/80' : 'text-stone-800'} text-[10px] sm:text-xs leading-tight font-serif line-clamp-2 px-1`}>
                        {book.title_ar}
                      </h3>
                      <p className={`text-[9px] sm:text-[10px] mt-1 opacity-70 ${theme === 'night' ? 'text-gold/60' : 'text-stone-600'} line-clamp-1`}>
                        {book.author}
                      </p>
                    </motion.button>
                  );
                })}
              </div>
            </>
          )}
          
          {booksFound.length === 0 && phrasesFound.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              {language === 'ar' ? 'لم يتم العثور على نتائج' : language === 'en' ? 'No results found' : 'هیچ ئەنجامێک نەدۆزرایەوە'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
