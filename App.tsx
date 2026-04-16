import React, { useState } from 'react';
import { FiqhLibrary } from './components/FiqhLibrary';
import MektabeyBzotnawa from './components/MektabeyBzotnawa';
import { QuranAudio } from './components/QuranAudio';
import { TelegramFeed } from './components/TelegramFeed';
import { Book, BookOpen, Headphones, MessageCircle } from 'lucide-react';
import { LanguageSelection } from './components/LanguageSelection';
import { LoginTypeSelection } from './components/LoginTypeSelection';

function App() {
  const [step, setStep] = useState<'language' | 'login' | 'main'>('language');
  const [language, setLanguage] = useState<string>('en');
  const [loginType, setLoginType] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('fiqh');
  const theme = 'night';

  if (step === 'language') {
    return <LanguageSelection onSelect={(lang) => { setLanguage(lang); setStep('login'); }} />;
  }

  if (step === 'login') {
    return <LoginTypeSelection onSelect={(type) => { setLoginType(type); setStep('main'); }} />;
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="p-4 border-b border-gold/20 bg-black/80 backdrop-blur-md sticky top-0 z-50">
        <h1 className="text-2xl font-bold text-gold text-center">کتێبخانەی ئیسلامی</h1>
        <div className="flex justify-center gap-4 mt-4 overflow-x-auto pb-2">
          <button onClick={() => setActiveTab('fiqh')} className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${activeTab === 'fiqh' ? 'bg-gold text-black' : 'bg-white/10 text-gold hover:bg-white/20'}`}>
            <Book className="w-4 h-4" /> فقه
          </button>
          <button onClick={() => setActiveTab('mektabey')} className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${activeTab === 'mektabey' ? 'bg-gold text-black' : 'bg-white/10 text-gold hover:bg-white/20'}`}>
            <BookOpen className="w-4 h-4" /> مەکتەبەی بزووتنەوە
          </button>
          <button onClick={() => setActiveTab('quran')} className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${activeTab === 'quran' ? 'bg-gold text-black' : 'bg-white/10 text-gold hover:bg-white/20'}`}>
            <Headphones className="w-4 h-4" /> قورئان
          </button>
          <button onClick={() => setActiveTab('telegram')} className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${activeTab === 'telegram' ? 'bg-gold text-black' : 'bg-white/10 text-gold hover:bg-white/20'}`}>
            <MessageCircle className="w-4 h-4" /> تێلیگرام
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative">
        {activeTab === 'fiqh' && <FiqhLibrary language={language === 'ku' ? 'ku' : 'ar'} />}
        {activeTab === 'mektabey' && <MektabeyBzotnawa language={language === 'ku' ? 'ku' : 'ar'} theme={theme} />}
        {activeTab === 'quran' && <QuranAudio theme={theme} />}
        {activeTab === 'telegram' && <TelegramFeed theme={theme} />}
      </main>
    </div>
  );
}

export default App;
