import React, { useState, useEffect } from 'react';
import { ChevronRight, Search, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface QuranEditionViewerProps {
  language: 'ar' | 'ku' | 'en';
  theme: 'night' | 'white' | 'cream';
  onBack: () => void;
  editionUrl: string;
  editionNameAr: string;
  editionNameKu: string;
  editionNameEn?: string;
}

const QuranEditionViewer: React.FC<QuranEditionViewerProps> = ({ 
  language, 
  theme, 
  onBack,
  editionUrl,
  editionNameAr,
  editionNameKu,
  editionNameEn
}) => {
  const [surahs, setSurahs] = useState<{ id: number; title: string; content: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSurah, setSelectedSurah] = useState<{ id: number; title: string; content: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchEdition = async () => {
      setLoading(true);
      try {
        const res = await fetch(editionUrl);
        const data = await res.json();
        const text = data.full_text.trim();
        const parts = text.split(/سُورَةُ\s+/).filter((s: string) => s.trim().length > 0);
        
        const parsedSurahs = parts.map((part: string, index: number) => {
          const lines = part.trim().split('\n');
          const title = 'سُورَةُ ' + (lines[0]?.trim() || '');
          
          // Join lines, remove extra spaces, and format verse numbers
          let content = lines.slice(1)
            .map(l => l.trim())
            .filter(Boolean)
            .join(' ');
            
          // Wrap Arabic numbers in Quranic brackets
          content = content.replace(/([٠-٩]+)/g, '﴿$1﴾');
          
          return {
            id: index + 1,
            title,
            content
          };
        });
        
        setSurahs(parsedSurahs);
      } catch (error) {
        console.error("Error fetching Quran edition:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEdition();
  }, [editionUrl]);

  const filteredSurahs = surahs.filter(s => s.title.includes(searchTerm));

  if (selectedSurah) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="p-6 max-w-2xl mx-auto w-full pb-24"
      >
        <button 
          onClick={() => setSelectedSurah(null)}
          className={`flex items-center gap-2 mb-6 px-4 py-2 rounded-full transition-colors ${theme === 'night' ? 'text-gold bg-stone-800 hover:bg-stone-700' : 'text-olive bg-olive/10 hover:bg-olive/20'}`}
        >
          <ChevronRight className="w-5 h-5" />
          <span className="font-medium text-sm">{language === 'ar' ? 'رجوع' : language === 'en' ? 'Back' : 'گەڕانەوە'}</span>
        </button>

        <div className="relative">
          {/* Decorative outer border */}
          <div className={`absolute inset-0 rounded-3xl border-8 border-double pointer-events-none ${theme === 'night' ? 'border-gold/20' : 'border-olive/20'}`}></div>
          
          <div 
            className={`p-8 md:p-12 rounded-3xl leading-loose text-2xl md:text-3xl text-center font-naskh ${theme === 'night' ? 'bg-stone-900 text-white' : 'bg-[#fdfbf7] text-stone-900 shadow-xl'} border border-transparent`} 
            style={{ lineHeight: '2.5' }}
            dir="rtl"
          >
            <div className="text-center mb-12 border-b-2 border-dashed pb-6 border-opacity-30 border-current">
              <h2 className={`text-4xl font-bold font-naskh ${theme === 'night' ? 'text-gold' : 'text-olive'}`}>
                {selectedSurah.title}
              </h2>
            </div>
            {selectedSurah.content}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="p-6 max-w-md mx-auto w-full pb-24"
    >
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={onBack}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${theme === 'night' ? 'text-gold bg-stone-800 hover:bg-stone-700' : 'text-olive bg-olive/10 hover:bg-olive/20'}`}
        >
          <ChevronRight className="w-5 h-5" />
          <span className="font-medium text-sm">{language === 'ar' ? 'رجوع' : language === 'en' ? 'Back' : 'گەڕانەوە'}</span>
        </button>
        <div className="relative flex-1 max-w-[150px] ml-4">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme === 'night' ? 'text-gold/50' : 'text-olive/50'}`} />
          <input
            type="text"
            placeholder={language === 'ar' ? 'بحث...' : language === 'en' ? 'Search...' : 'گەڕان...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-9 pr-4 py-2 border rounded-full text-sm focus:outline-none ${theme === 'night' ? 'bg-stone-800 border-stone-700 text-gold placeholder-gold/50 focus:border-gold/50' : 'bg-olive/10 border-olive/20 text-olive placeholder-olive/50 focus:border-olive/50'}`}
          />
        </div>
      </div>

      <div className="text-center mb-6">
        <h2 className={`text-2xl font-bold mb-2 ${theme === 'night' ? 'text-gold' : 'text-olive'}`}>
          {language === 'ar' ? editionNameAr : language === 'en' ? editionNameEn || editionNameAr : editionNameKu}
        </h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className={`w-8 h-8 animate-spin ${theme === 'night' ? 'text-gold' : 'text-olive'}`} />
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSurahs.map((surah) => (
            <button
              key={surah.id}
              onClick={() => setSelectedSurah(surah)}
              className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${theme === 'night' ? 'bg-stone-800/50 border-stone-700 hover:border-gold/50' : 'bg-white border-stone-200 hover:border-olive/50 shadow-sm'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${theme === 'night' ? 'bg-stone-800 text-gold' : 'bg-olive/10 text-olive'}`}>
                  {surah.id}
                </div>
                <div className="text-right">
                  <h3 className={`font-bold font-naskh text-lg ${theme === 'night' ? 'text-white' : 'text-stone-900'}`}>
                    {surah.title}
                  </h3>
                </div>
              </div>
              <ChevronRight className={`w-5 h-5 ${theme === 'night' ? 'text-stone-600' : 'text-stone-400'}`} />
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default QuranEditionViewer;
