import React, { useState } from 'react';
import { fetchRecitations, Recitation } from '../services/quranService';
import { Play, Loader2 } from 'lucide-react';

interface QuranAudioProps {
  theme?: 'night' | 'white' | 'cream';
  language?: 'ar' | 'ku' | 'en';
}

const QuranAudio: React.FC<QuranAudioProps> = ({ theme = 'white', language = 'en' }) => {
  const [reciterId, setReciterId] = useState('1');
  const [chapterNumber, setChapterNumber] = useState('1');
  const [recitations, setRecitations] = useState<Recitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRecitations(parseInt(reciterId), parseInt(chapterNumber));
      setRecitations(data.chapter_recitations);
    } catch (err) {
      setError(language === 'ar' ? 'فشل في جلب التلاوات' : language === 'en' ? 'Failed to fetch recitations' : 'نەتوانرا تلاوەتەکان بهێنرێت');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`p-6 rounded-2xl border shadow-sm ${theme === 'night' ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'}`}>
      <h2 className={`text-2xl font-bold mb-4 ${theme === 'night' ? 'text-gold' : 'text-stone-900'}`}>
        {language === 'ar' ? 'القرآن الكريم (صوتي)' : language === 'en' ? 'Holy Quran (Audio)' : 'قورئانی پیرۆز (دەنگی)'}
      </h2>
      <div className="flex gap-4 mb-4">
        <input 
          type="number" 
          value={reciterId} 
          onChange={(e) => setReciterId(e.target.value)} 
          placeholder={language === 'ar' ? 'رقم القارئ' : language === 'en' ? 'Reciter ID' : 'ژمارەی قورئانخوێن'}
          className={`border rounded-lg p-2 ${theme === 'night' ? 'bg-stone-800 border-stone-700 text-white placeholder-stone-500' : 'border-stone-300 text-stone-900'}`}
        />
        <input 
          type="number" 
          value={chapterNumber} 
          onChange={(e) => setChapterNumber(e.target.value)} 
          placeholder={language === 'ar' ? 'رقم السورة' : language === 'en' ? 'Surah Number' : 'ژمارەی سوورەت'}
          className={`border rounded-lg p-2 ${theme === 'night' ? 'bg-stone-800 border-stone-700 text-white placeholder-stone-500' : 'border-stone-300 text-stone-900'}`}
        />
        <button 
          onClick={handleFetch}
          className={`rounded-lg px-4 py-2 flex items-center gap-2 ${theme === 'night' ? 'bg-stone-800 text-white hover:bg-stone-700' : 'bg-stone-900 text-white hover:bg-stone-800'}`}
        >
          {loading ? <Loader2 className="animate-spin" /> : <Play size={16} />}
          {language === 'ar' ? 'جلب' : language === 'en' ? 'Fetch' : 'هێنان'}
        </button>
      </div>
      {error && <p className="text-red-500">{error}</p>}
      <div className="space-y-2">
        {(recitations || []).map((rec) => (
          <div key={rec.id} className={`flex items-center justify-between p-3 border rounded-lg ${theme === 'night' ? 'border-stone-800 bg-stone-800/50 text-stone-300' : 'border-stone-100 text-stone-900'}`}>
            <span>{language === 'ar' ? 'سورة' : language === 'en' ? 'Surah' : 'سوورەتی'} {rec.chapter_id}</span>
            <audio controls src={rec.audio_url} className="h-8" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuranAudio;
