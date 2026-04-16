import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { X, Download, Share2, Image as ImageIcon, Type, Book } from 'lucide-react';
import html2canvas from 'html2canvas';

interface QuoteCardMakerProps {
  quote: string;
  bookTitle: string;
  author: string;
  language: 'ar' | 'ku';
  onClose: () => void;
}

const BACKGROUNDS = [
  { id: 'dark-elegant', class: 'bg-gradient-to-br from-slate-900 via-slate-800 to-black text-white' },
  { id: 'warm-sepia', class: 'bg-gradient-to-br from-[#FDF6E3] to-[#e6d5b8] text-[#3d3328]' },
  { id: 'olive-gold', class: 'bg-gradient-to-br from-olive to-gold text-white' },
  { id: 'gold-night', class: 'bg-gradient-to-br from-olive/80 to-slate-900 text-gold/50' },
  { id: 'pure-white', class: 'bg-white text-slate-900 border border-slate-200' },
];

export default function QuoteCardMaker({ quote, bookTitle, author, language, onClose }: QuoteCardMakerProps) {
  const [bgIndex, setBgIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3, // High resolution
        useCORS: true,
        backgroundColor: null,
      });
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `quote-${Date.now()}.png`;
      a.click();
    } catch (error) {
      console.error('Failed to generate image', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm" dir={language === 'ar' ? 'rtl' : 'rtl'}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-lg text-slate-800 dark:text-white">
            {language === 'ar' ? 'مشاركة اقتباس' : 'بڵاوکردنەوەی وتە'}
          </h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center bg-slate-50 dark:bg-black/20">
          {/* The Card to Capture */}
          <div 
            ref={cardRef}
            className={`w-full aspect-square sm:aspect-[4/5] p-8 sm:p-10 flex flex-col justify-between rounded-2xl shadow-xl relative overflow-hidden ${BACKGROUNDS[bgIndex].class}`}
          >
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
            
            <div className="relative z-10">
              <Type className="w-8 h-8 opacity-20 mb-4" />
              <p className="text-xl sm:text-2xl md:text-3xl font-serif leading-relaxed text-justify" style={{ lineHeight: '1.8' }}>
                "{quote}"
              </p>
            </div>

            <div className="relative z-10 mt-8 pt-6 border-t border-current/20 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm sm:text-base opacity-90">{bookTitle}</h4>
                <p className="text-xs sm:text-sm opacity-70 mt-1">{author}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-current/10 flex items-center justify-center">
                <Book className="w-5 h-5 opacity-80" />
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="mb-6">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">
              {language === 'ar' ? 'اختر الخلفية' : 'باگراوند هەڵبژێرە'}
            </p>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {BACKGROUNDS.map((bg, idx) => (
                <button
                  key={bg.id}
                  onClick={() => setBgIndex(idx)}
                  className={`w-12 h-12 rounded-full shrink-0 border-2 transition-all ${bg.class} ${bgIndex === idx ? 'border-gold scale-110 shadow-lg' : 'border-transparent opacity-70 hover:opacity-100'}`}
                />
              ))}
            </div>
          </div>

          <button
            onClick={handleDownload}
            disabled={isGenerating}
            className="w-full py-4 rounded-xl bg-olive hover:bg-olive/80 text-gold font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
          >
            {isGenerating ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            {language === 'ar' ? 'حفظ الصورة' : 'سەیڤکردنی وێنە'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
