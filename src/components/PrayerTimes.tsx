import React, { useState, useEffect } from 'react';
import { fetchPrayerTimesByCity, fetchPrayerTimesByCoords, PrayerResponse, PrayerTimings } from '../services/prayerService';
import { MapPin, Search, Loader2, Calendar, Clock } from 'lucide-react';

interface PrayerTimesProps {
  language: 'ar' | 'ku' | 'en';
  theme?: 'night' | 'white' | 'cream';
}

export const PrayerTimes: React.FC<PrayerTimesProps> = ({ language, theme = 'white' }) => {
  const [city, setCity] = useState(() => localStorage.getItem('prayerCity') || 'Mecca');
  const [country, setCountry] = useState(() => localStorage.getItem('prayerCountry') || 'Saudi Arabia');
  const [method, setMethod] = useState(() => parseInt(localStorage.getItem('prayerMethod') || '8'));
  const [data, setData] = useState<PrayerResponse['data'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('prayerCity', city);
    localStorage.setItem('prayerCountry', country);
    localStorage.setItem('prayerMethod', method.toString());
  }, [city, country, method]);

  const handleFetchByCity = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchPrayerTimesByCity(city, country, method);
      setData(res.data);
    } catch (err) {
      setError(
        language === 'ar' 
          ? 'فشل في جلب مواقيت الصلاة. يرجى التحقق من المدينة والبلد.' 
          : language === 'en'
          ? 'Failed to fetch prayer times. Please check city and country.'
          : 'شکست هێنا لە هێنانی کاتی بانگەکان. تکایە دڵنیابە لە شار و وڵات.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFetchByLocation = () => {
    if (!navigator.geolocation) {
      setError(
        language === 'ar' 
          ? 'تحديد الموقع غير مدعوم في متصفحك.' 
          : language === 'en'
          ? 'Geolocation is not supported by your browser.'
          : 'دیاریکردنی شوێن پشتگیری ناکرێت لە وێبگەڕەکەتدا.'
      );
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await fetchPrayerTimesByCoords(position.coords.latitude, position.coords.longitude, method);
          setData(res.data);
          setCity(
            language === 'ar' 
              ? 'موقعي الحالي' 
              : language === 'en'
              ? 'My Current Location'
              : 'شوێنی ئێستام'
          );
          setCountry('');
        } catch (err) {
          setError(
            language === 'ar' 
              ? 'فشل في جلب مواقيت الصلاة.' 
              : language === 'en'
              ? 'Failed to fetch prayer times.'
              : 'شکست هێنا لە هێنانی کاتی بانگەکان.'
          );
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setError(
          language === 'ar' 
            ? 'تعذر الحصول على موقعك.' 
            : language === 'en'
            ? 'Could not get your location.'
            : 'نەتوانرا شوێنەکەت بدۆزرێتەوە.'
        );
        setLoading(false);
      }
    );
  };

  useEffect(() => {
    handleFetchByCity();
  }, [method]); // Refetch when method changes

  const prayerNames: Record<string, { ar: string, ku: string, en: string }> = {
    Fajr: { ar: 'الفجر', ku: 'بەیانی', en: 'Fajr' },
    Sunrise: { ar: 'الشروق', ku: 'خۆرهەڵاتن', en: 'Sunrise' },
    Dhuhr: { ar: 'الظهر', ku: 'نیوەڕۆ', en: 'Dhuhr' },
    Asr: { ar: 'العصر', ku: 'عەسر', en: 'Asr' },
    Sunset: { ar: 'الغروب', ku: 'الغروب', en: 'Sunset' },
    Maghrib: { ar: 'المغرب', ku: 'مەغریب', en: 'Maghrib' },
    Isha: { ar: 'العشاء', ku: 'عیشا', en: 'Isha' },
  };

  const methods = [
    { id: 1, name: 'University of Islamic Sciences, Karachi' },
    { id: 2, name: 'Islamic Society of North America' },
    { id: 3, name: 'Muslim World League' },
    { id: 4, name: 'Umm Al-Qura University, Makkah' },
    { id: 5, name: 'Egyptian General Authority of Survey' },
    { id: 8, name: 'Gulf Region' },
    { id: 9, name: 'Kuwait' },
    { id: 10, name: 'Qatar' },
    { id: 11, name: 'Majlis Ugama Islam Singapura, Singapore' },
    { id: 12, name: 'Union Organization islamic de France' },
    { id: 13, name: 'Diyanet İşleri Başkanlığı, Turkey' },
  ];

  return (
    <div className={`p-6 rounded-2xl border shadow-sm max-w-4xl mx-auto ${theme === 'night' ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'}`}>
      <h2 className={`text-2xl font-bold mb-6 flex items-center gap-2 ${theme === 'night' ? 'text-gold' : 'text-stone-900'}`}>
        <Clock className={theme === 'night' ? 'text-gold' : 'text-olive'} />
        {language === 'ar' ? 'مواقيت الصلاة' : language === 'en' ? 'Prayer Times' : 'کاتی بانگەکان'}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <input 
          type="text" 
          value={city} 
          onChange={(e) => setCity(e.target.value)} 
          placeholder={language === 'ar' ? 'المدينة (مثال: مكة)' : language === 'en' ? 'City (e.g. Mecca)' : 'شار (نموونە: مەککە)'}
          className={`border rounded-lg p-3 focus:ring-2 outline-none ${theme === 'night' ? 'bg-stone-800 border-stone-700 text-white focus:ring-gold placeholder-stone-500' : 'border-stone-300 focus:ring-olive text-stone-900'}`}
        />
        <input 
          type="text" 
          value={country} 
          onChange={(e) => setCountry(e.target.value)} 
          placeholder={language === 'ar' ? 'البلد (مثال: السعودية)' : language === 'en' ? 'Country (e.g. Saudi Arabia)' : 'وڵات (نموونە: سعودیە)'}
          className={`border rounded-lg p-3 focus:ring-2 outline-none ${theme === 'night' ? 'bg-stone-800 border-stone-700 text-white focus:ring-gold placeholder-stone-500' : 'border-stone-300 focus:ring-olive text-stone-900'}`}
        />
        <select 
          value={method} 
          onChange={(e) => setMethod(parseInt(e.target.value))}
          className={`border rounded-lg p-3 focus:ring-2 outline-none ${theme === 'night' ? 'bg-stone-800 border-stone-700 text-white focus:ring-gold' : 'border-stone-300 focus:ring-olive text-stone-900'}`}
        >
          {methods.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-4 mb-8">
        <button 
          onClick={handleFetchByCity}
          disabled={loading}
          className={`rounded-lg px-6 py-3 flex items-center gap-2 transition-colors ${theme === 'night' ? 'bg-stone-800 text-white hover:bg-stone-700' : 'bg-stone-900 text-white hover:bg-stone-800'}`}
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
          {language === 'ar' ? 'بحث بالمدينة' : language === 'en' ? 'Search by City' : 'گەڕان بەپێی شار'}
        </button>
        <button 
          onClick={handleFetchByLocation}
          disabled={loading}
          className={`text-white rounded-lg px-6 py-3 flex items-center gap-2 transition-colors ${theme === 'night' ? 'bg-gold text-stone-900 hover:bg-gold/90 font-medium' : 'bg-olive hover:bg-olive/90'}`}
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <MapPin size={20} />}
          {language === 'ar' ? 'موقعي الحالي' : language === 'en' ? 'My Current Location' : 'شوێنی ئێستام'}
        </button>
      </div>

      {error && <div className={`p-4 mb-6 rounded-lg border ${theme === 'night' ? 'bg-red-900/20 text-red-400 border-red-900/50' : 'bg-red-50 text-red-600 border-red-100'}`}>{error}</div>}

      {data && (
        <div className="space-y-6">
          <div className={`p-6 rounded-xl border flex flex-col items-center justify-center text-center ${theme === 'night' ? 'bg-stone-800/50 border-stone-700' : 'bg-stone-50 border-stone-100'}`}>
            <h3 className={`text-lg font-semibold mb-2 flex items-center gap-2 ${theme === 'night' ? 'text-stone-300' : 'text-stone-800'}`}>
              <Calendar size={18} className={theme === 'night' ? 'text-gold' : 'text-olive'} />
              {language === 'ar' ? 'التاريخ الهجري' : language === 'en' ? 'Hijri Date' : 'بەرواری کۆچی'}
            </h3>
            <p className={`text-2xl font-bold ${theme === 'night' ? 'text-gold' : 'text-olive'}`}>
              {data.date.hijri.day} {language === 'en' ? data.date.hijri.month.en : data.date.hijri.month.ar} {data.date.hijri.year}
            </p>
            <p className={`text-sm mt-2 ${theme === 'night' ? 'text-stone-400' : 'text-stone-500'}`}>{data.date.readable}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Sunset', 'Maghrib', 'Isha'].map((prayer) => (
              <div key={prayer} className={`border p-4 rounded-xl shadow-sm flex flex-col items-center justify-center transition-colors ${theme === 'night' ? 'bg-stone-800 border-stone-700 hover:border-gold' : 'bg-white border-stone-200 hover:border-olive'}`}>
                <span className={`text-sm mb-2 font-medium ${theme === 'night' ? 'text-stone-400' : 'text-stone-500'}`}>
                  {prayerNames[prayer]?.[language] || prayer}
                </span>
                <span className={`text-xl font-bold ${theme === 'night' ? 'text-white' : 'text-stone-900'}`}>
                  {data.timings[prayer as keyof PrayerTimings]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
