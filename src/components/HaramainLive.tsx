import React, { useState, useEffect } from 'react';

export default function HaramainLive({ theme, language, appSettings }: { theme: 'night' | 'white' | 'cream', language: 'ar' | 'ku', appSettings: any }) {
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const quotes = [
    { ar: "يخرج المهدي فيملأ الأرض قسطاً وعدلاً كما ملئت ظلماً وجوراً.", ku: "مەهدی دەردەکەوێت و زەوی پڕ دەکات لە دادپەروەری وەک چۆن پڕ ببوو لە زوڵم و ستەم." },
    { ar: "أنصار المهدي هم القلة المؤمنة التي تنصره في آخر الزمان.", ku: "سەرخەرانی مەهدی ئەو کەمینە باوەڕدارەن کە لە کۆتایی زەماندا سەری دەخەن." },
    { ar: "طوبى للغرباء الذين يصلحون ما أفسد الناس.", ku: "خۆزگە بۆ ئەو غەریبانەی کە چاکی دەکەنەوە ئەوەی خەڵک تێکیان داوە." },
    { ar: "سيأتي زمان على أمتي يفرون من الدين كما يفر الغنم من الذئب.", ku: "کاتێک دێت بەسەر ئوممەتەکەمدا کە لە ئایین ڕادەکەن وەک چۆن مەڕ لە گورگ ڕادەکات." },
    { ar: "المهدي مني، أجلى الجبهة، أقنى الأنف، يملأ الأرض قسطاً وعدلاً.", ku: "مەهدی لە منە، نێوچەوانی فراوانە، لوتی بەرزە، زەوی پڕ دەکات لە دادپەروەری." }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuoteIndex((prev) => (prev + 1) % quotes.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const [zoomLevels, setZoomLevels] = useState<Record<string, number>>({});

  const channels = [
    {
      id: 'UCos52azQNBgW63_9uDJoPDA', // Saudi Quran TV
      titleAr: 'قناة القرآن الكريم',
      titleKu: 'کەناڵی قورئانی پیرۆز - مەککە',
      location: 'Makkah'
    },
    {
      id: 'UCROKYPep-UuODNwyipe6JMw', // Saudi Sunnah TV
      titleAr: 'قناة السنة النبوية',
      titleKu: 'کەناڵی سوننەتی پێغەمبەر - مەدینە',
      location: 'Madinah'
    }
  ];

  const handleZoom = (id: string, delta: number) => {
    setZoomLevels(prev => ({
      ...prev,
      [id]: Math.min(Math.max((prev[id] || 1) + delta, 1), 20)
    }));
  };

  return (
    <div className="flex flex-col h-screen w-full bg-black">
      {channels.map((channel, index) => (
        <div key={channel.id} className="relative flex-1 w-full overflow-hidden border-b border-black">
          <div className="w-full h-full relative">
            <iframe
              src={`https://www.youtube.com/embed/live_stream?channel=${channel.id}&autoplay=1&mute=1&playsinline=1&vq=hd1080`}
              title={language === 'ar' ? channel.titleAr : channel.titleKu}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>

          {/* Logo Overlay */}
          <div 
            className="absolute z-[60] opacity-90 flex items-center justify-center"
            style={{ 
              top: '70px', 
              right: '10px',
              width: '50px',
              height: '50px'
            }}
          >
            <img
              src={appSettings.logoUrl || 'https://lh3.googleusercontent.com/d/1srJz8iX6M66Z2cOM4vYedj3OQqGVo9Kz'}
              alt="Logo"
              style={{ 
                width: '40px', 
                height: '40px' 
              }}
              className={`rounded-full border border-gold/50 ${index === 0 ? 'bg-white' : 'bg-black'}`}
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Text Overlay */}
          <div 
            className="absolute z-[60] top-20 left-3 bg-black/70 text-white px-3 py-1 rounded-md text-sm font-bold border border-gold/30"
          >
            الخلافة علی منهاج نبوة
          </div>

          {/* Quotes Overlay */}
          <div className="absolute inset-0 flex items-end justify-center z-40 pointer-events-none p-6">
            <div className="text-white p-6 text-center bg-[url('https://www.transparenttextures.com/patterns/islamic-lace.png')] bg-black/80 border-t-4 border-gold w-full rounded-t-2xl">
              <p className="text-lg font-medium leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,1)] text-gold">
                {quotes[currentQuoteIndex][language]}
              </p>
            </div>
          </div>
        </div>
      ))}
      <style>{`
      `}</style>
    </div>
  );
};
