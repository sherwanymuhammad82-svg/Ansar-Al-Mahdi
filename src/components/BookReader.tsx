import React, { useState } from 'react';
import { ArrowRight, Search, ChevronRight, ChevronLeft } from 'lucide-react';

interface BookReaderProps {
  book: {
    title?: string;
    title_ar?: string;
    title_ku?: string;
    title_en?: string;
    author?: string;
    shamela_id?: string;
  };
  content?: string | any[];
  language: 'ar' | 'ku' | 'en';
  onClose: () => void;
  searchTerm?: string;
}

export default function BookReader({ book, content, language, onClose, searchTerm }: BookReaderProps) {
  const [currentPage, setCurrentPage] = useState(0);

  const pages = Array.isArray(content) ? content : (typeof content === 'string' ? [{ text: content }] : []);

  return (
    <div className="flex flex-col h-full bg-black text-white">
      <div className="p-4 border-b border-gold/20 flex items-center justify-between bg-black/50 backdrop-blur-md sticky top-0 z-10">
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <ArrowRight className="w-5 h-5 text-gold" />
        </button>
        <h2 className="text-sm font-bold text-gold truncate max-w-[200px]">
          {book.title || (language === 'ar' ? book.title_ar : language === 'en' ? book.title_en || book.title_ar : book.title_ku) || book.title_ar || book.title_ku}
        </h2>
        <div className="w-8" />
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {pages.length > 0 ? (
          <div className="bg-white/5 border border-gold/10 rounded-2xl p-6 shadow-xl relative group">
            <p className="text-lg leading-relaxed font-serif text-slate-200 text-right" dir="rtl">
              {pages[currentPage]?.text || pages[currentPage]?.content || JSON.stringify(pages[currentPage])}
            </p>
          </div>
        ) : (
          <div className="text-center text-gray-500 mt-10">
            No content available.
          </div>
        )}
      </div>

      {pages.length > 1 && (
        <div className="p-4 border-t border-gold/20 bg-black/50 backdrop-blur-md flex items-center justify-between sticky bottom-0 z-10">
          <button
            onClick={() => setCurrentPage(p => Math.min(pages.length - 1, p + 1))}
            disabled={currentPage === pages.length - 1}
            className="p-2 bg-gold/20 text-gold rounded-full disabled:opacity-50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          
          <span className="text-gold font-mono text-sm">
            {currentPage + 1} / {pages.length}
          </span>

          <button
            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="p-2 bg-gold/20 text-gold rounded-full disabled:opacity-50"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
