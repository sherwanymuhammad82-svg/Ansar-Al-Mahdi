import { safeFetch } from '../utils/fetchUtils';

export interface PrayerTimings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Sunset: string;
  Maghrib: string;
  Isha: string;
  Imsak: string;
  Midnight: string;
}

export interface HijriDate {
  date: string;
  format: string;
  day: string;
  weekday: { en: string; ar: string };
  month: { number: number; en: string; ar: string };
  year: string;
  designation: { abbreviated: string; expanded: string };
}

export interface PrayerResponse {
  code: number;
  status: string;
  data: {
    timings: PrayerTimings;
    date: {
      readable: string;
      timestamp: string;
      hijri: HijriDate;
      gregorian: any;
    };
    meta: any;
  };
}

export const fetchPrayerTimesByCity = async (city: string, country: string, method: number = 8): Promise<PrayerResponse> => {
  return safeFetch<PrayerResponse>(`https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=${method}`);
};

export const fetchPrayerTimesByCoords = async (lat: number, lng: number, method: number = 8): Promise<PrayerResponse> => {
  return safeFetch<PrayerResponse>(`https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lng}&method=${method}`);
};
