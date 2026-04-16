import { BookOpen, Users, MessageCircle, Book, Scale, Video, Flame, Clock, Library, ShieldCheck } from 'lucide-react';

export const SECTIONS = [
  { id: 'quran', ar: 'القرآن الكريم', ku: "قورئانی پیرۆز", en: "Holy Quran", icon: BookOpen, imageUrl: 'https://lh3.googleusercontent.com/d/1-0nhSqRu-oydfeoWk3-1lX-LJ3ARUtNo', color: 'from-olive to-gold' },
  { id: 'tahami', ar: 'الشيخ حسن التهامي', ku: 'شێخ حەسەن توهامی', en: "Sheikh Hassan Tahami", icon: Users, imageUrl: 'https://lh3.googleusercontent.com/d/1mSBm7w9dMVxQFOnUDXe7l8kCL1Sk4E7z', color: 'from-olive to-gold' },
  { id: 'ansar_groups', ar: 'مجموعات أنصار المهدي', ku: 'کۆمەڵەکانی سەرخەرانی ئیمام مەهدی', en: "Ansar Al-Mahdi Groups", icon: MessageCircle, color: 'from-olive to-gold' },
  { id: 'fatwas', ar: 'فتاوى أبو داود الحسامي', ku: 'فەتوایەکانی ئەبو داود حوسامی', en: "Fatwas of Abu Dawud Al-Husami", icon: Book, imageUrl: 'https://lh3.googleusercontent.com/d/1LzhTRRIELHGJVPgmQKHyAMOv3DU0I5Dp', color: 'from-olive to-gold' },
  { id: 'methodology', ar: 'منهج الإمام المهدي', ku: 'پەیرەوی ئیمام المهدی', en: "Methodology of Imam Mahdi", icon: Scale, imageUrl: 'https://lh3.googleusercontent.com/d/1bPY8ZXfoNF4O6Pp-bMptWzEJdLtaIgWZ', color: 'from-gold to-olive' },
  { id: 'mektabey_bzotnawa', ar: 'كتب جمعية الإمام المهدي', ku: 'کتێبەکانی کۆمەڵەی ئیمام مەهدی', en: "Imam Mahdi Association Books", icon: Book, imageUrl: 'https://lh3.googleusercontent.com/d/1I4kgS6LYjU_7y_8aPUTIdtvGuU6RGHzX', color: 'from-gold to-olive' },
  { id: 'tahami_speeches', ar: 'خطب الشيخ حسن التهامي', ku: 'وتارەکانی شێخ حەسەن توهامی', en: "Speeches of Sheikh Hassan Tahami", icon: Video, imageUrl: 'https://lh3.googleusercontent.com/d/1KYOrdnT3HJgJzlfm9CA2P_Fqc4WzJ-gP', color: 'from-gold to-olive' },
  { id: 'warplan', ar: 'اقتراب النهاية', ku: 'نزیکبوونەوەی کۆتایی', en: "The Approaching End", icon: Flame, imageUrl: 'https://lh3.googleusercontent.com/d/1vqHKbVDZyBYlu1assk3s64uOfZE6nCVG', color: 'from-gold to-olive' },
];

export const MOVEMENT_BOOKS = [
  { id: 'dajjal', title_ar: 'المسيح الدجال يطوف بالكعبة', title_ku: 'مەسیحی دەججال بە دەوری کەعبەدا دەسوڕێتەوە', title_en: 'The Antichrist (Dajjal) Circling the Kaaba', description_ar: 'كتاب عن المسيح الدجال', description_ku: 'کتێبێک دەربارەی مەسیحی دەججال', description_en: 'A book about the Antichrist (Dajjal)' }
];

export const LIBRARY_CATEGORIES = [
  { id: 'quran', ar: 'القرآن الكريم', ku: 'قورئانی پیرۆز', en: 'Holy Quran', icon: BookOpen, color: 'from-olive to-gold' },
  { id: 'tafsir', ar: 'التفسير', ku: 'تەفسیر', en: 'Tafsir', icon: Book, color: 'from-olive to-gold' },
  { id: 'hadith', ar: 'الحديث', ku: 'فەرموودە', en: 'Hadith', icon: Library, color: 'from-gold to-olive' },
  { id: 'fiqh', ar: 'الفقه', ku: 'فیقهـ', en: 'Fiqh', icon: Scale, color: 'from-olive to-gold' },
  { id: 'fitan', ar: 'مكتبة أنصار الإمام المهدي', ku: 'کتێبخانەی سەرخەرانی ئیمام المهدی', en: 'Ansar Al-Mahdi Library', icon: Flame, color: 'from-olive to-gold' },
  { id: 'history', ar: 'التاريخ', ku: 'مێژوو', en: 'History', icon: Clock, color: 'from-olive to-gold' },
  { id: 'hisbah', ar: 'الحسبة', ku: 'حیسبە', en: 'Hisbah', icon: ShieldCheck, color: 'from-olive to-gold' },
  { id: 'apocalypse', ar: 'الفتن والملاحم وأشراط الساعة', ku: 'فتنە و جەنگەکان و ڕۆژی دوایی', en: 'Trials and Tribulations of the Hour', icon: Flame, color: 'from-olive to-gold' }
];

export const HADITH_API_BOOKS = [
  { id: 'ara-bukhari', title_ar: 'صحيح البخاري', title_ku: 'سەحیحی بوخاری', title_en: 'Sahih Al-Bukhari', description_ar: 'أصح كتاب بعد كتاب الله', description_ku: 'ڕاستترین کتێب دوای قورئان', description_en: 'The most authentic book after the Quran' },
  { id: 'ara-muslim', title_ar: 'صحيح مسلم', title_ku: 'سەحیحی موسلیم', title_en: 'Sahih Muslim', description_ar: 'ثاني أصح الكتب', description_ku: 'دووەم ڕاستترین کتێب', description_en: 'The second most authentic book' },
  { id: 'ara-abudawud', title_ar: 'سنن أبي داود', title_ku: 'سونەنی ئەبو داود', title_en: 'Sunan Abu Dawud', description_ar: 'من السنن الأربعة', description_ku: 'لە سونەنە چوارەکان', description_en: 'One of the four Sunan' },
  { id: 'ara-tirmidhi', title_ar: 'جامع الترمذي', title_ku: 'جامعی ترمذی', title_en: 'Jami Al-Tirmidhi', description_ar: 'من السنن الأربعة', description_ku: 'لە سونەنە چوارەکان', description_en: 'One of the four Sunan' },
  { id: 'ara-nasai', title_ar: 'سنن النسائي', title_ku: 'سونەنی نەسائی', title_en: 'Sunan An-Nasa\'i', description_ar: 'من السنن الأربعة', description_ku: 'لە سونەنە چوارەکان', description_en: 'One of the four Sunan' },
  { id: 'ara-ibnmajah', title_ar: 'سنن ابن ماجه', title_ku: 'سونەنی ابن ماجە', title_en: 'Sunan Ibn Majah', description_ar: 'من السنن الأربعة', description_ku: 'لە سونەنە چوارەکان', description_en: 'One of the four Sunan' },
  { id: 'bukhari', title_ar: 'صحيح البخاري (جديد)', title_ku: 'سەحیحی بوخاری (نوێ)', title_en: 'Sahih Al-Bukhari (New)', description_ar: 'الأحاديث النبوية الشريفة', description_ku: 'فەرموودە پیرۆزەکان', description_en: 'Noble Prophetic Hadiths', isNewApi: true },
  { id: 'muslim', title_ar: 'صحيح مسلم (جديد)', title_ku: 'سەحیحی موسلیم (نوێ)', title_en: 'Sahih Muslim (New)', description_ar: 'الأحاديث النبوية الشريفة', description_ku: 'فەرموودە پیرۆزەکان', description_en: 'Noble Prophetic Hadiths', isNewApi: true },
  { id: 'abu-dawud', title_ar: 'سنن أبي داود (جديد)', title_ku: 'سونەنی ئەبو داود (نوێ)', title_en: 'Sunan Abu Dawud (New)', description_ar: 'الأحاديث النبوية الشريفة', description_ku: 'فەرموودە پیرۆزەکان', description_en: 'Noble Prophetic Hadiths', isNewApi: true },
  { id: 'أحاديث_أبي_الحسن_الجوبري', title_ar: 'أحاديث أبي الحسن الجوبري', title_ku: 'فەرموودەکانی ئەبو حەسەن جەوبەری', title_en: 'Hadiths of Abu Al-Hasan Al-Jawbari', description_ar: 'مخطوطة نادرة', description_ku: 'دەستنووسێکی دەگمەن', description_en: 'A rare manuscript' },
];

export const DAJJAL_CONTENT = {
  title_ar: 'المسيح الدجال يطوف بالكعبة',
  title_ku: 'مەسیحی دەججال بە دەوری کەعبەدا دەسوڕێتەوە',
  title_en: 'The Antichrist (Dajjal) Circling the Kaaba',
  chapters: [
    {
      title_ar: 'المقدمة',
      title_ku: 'پێشەکی',
      title_en: 'Introduction',
      content: [
        { type: 'text', text: 'الحمد لله رب العالمين، والصلاة والسلام على أشرف المرسلين...' },
        { type: 'translation', arabic: 'إن فتنة الدجال هي أعظم فتنة منذ خلق الله آدم إلى قيام الساعة.', kurdish: 'بەڕاستی فیتنەی دەججال گەورەترین فیتنەیە لەو کاتەوەی خودا ئادەمی دروستکردووە تا قیامەت.', english: 'Indeed, the trial of the Antichrist (Dajjal) is the greatest trial since the creation of Adam until the Hour.' }
      ]
    }
  ]
};

export const TAHAMI_CONTENT = {
  title_ar: 'الشيخ حسن التهامي',
  title_ku: 'شێخ حەسەن توهامی',
  title_en: 'Sheikh Hassan Tahami',
  description_ar: 'مجموعة من خطب ومقالات الشيخ حسن التهامي',
  description_ku: 'کۆمەڵێک لە وتار و بابەتەکانی شێخ حەسەن توهامی',
  description_en: 'A collection of speeches and articles by Sheikh Hassan Tahami'
};

export const PRAYERS = [
  { ar: 'الفجر', ku: 'بەیانی', en: 'Fajr' },
  { ar: 'الشروق', ku: 'خۆرهەڵاتن', en: 'Sunrise' },
  { ar: 'الظهر', ku: 'نیوەڕۆ', en: 'Dhuhr' },
  { ar: 'العصر', ku: 'عەسر', en: 'Asr' },
  { ar: 'المغرب', ku: 'مەغریب', en: 'Maghrib' },
  { ar: 'العشاء', ku: 'عیشا', en: 'Isha' }
];
