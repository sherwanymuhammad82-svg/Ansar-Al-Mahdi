import { GoogleGenAI } from '@google/genai';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, Clock, Search, BookOpen, Library, Users, Scale, ChevronLeft, ChevronRight, Moon, Sun, FileText, Calendar, Globe, Shield, Menu, Languages, Loader2, MessageCircle, Settings, X, LogIn, WifiOff, Flame, ShieldCheck, Book, Type, Eye, Video, Plus, Music, ImageIcon, Send, Youtube, Tv, Play, ExternalLink, ArrowRight, Trash2 } from 'lucide-react';
import { WorldNewsFeed } from './components/WorldNewsFeed';
import { TelegramChannelFeed } from './components/TelegramChannelFeed';
import AdminPublisher from './components/AdminPublisher';
import { db, auth } from './firebase';
import { handleFirestoreError, OperationType } from './utils/firestoreErrorHandler';
import { 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot, 
  collection, 
  query, 
  orderBy,
  addDoc,
  deleteDoc
} from 'firebase/firestore';
import { signInAnonymously, signInWithPopup, GoogleAuthProvider, signInWithCustomToken } from 'firebase/auth';
import { useUser } from './contexts/UserContext';
import { METHODOLOGY_CONTENT } from './data/methodology';
import { FATWAS_CONTENT } from './data/fatwas';
import { TAHAMI_CONTENT } from './data/tahami';
import { MAHDI_CONTENT } from './data/mahdi';
import { DAJJAL_CONTENT } from './data/dajjal';
import AdminSettings from './components/AdminSettings';
import { MektabeyBzotnawa } from './components/MektabeyBzotnawa';
import HisbahLibrary from './components/HisbahLibrary';
import LanguageLibrary from './components/LanguageLibrary';
import Community from './components/Community';
import QuranAudio from './components/QuranAudio';
import { PrayerTimes } from './components/PrayerTimes';
import QuranEditionViewer from './components/QuranEditionViewer';
import { ApocalypseLibrary } from './components/ApocalypseLibrary';
import { FiqhLibrary } from './components/FiqhLibrary';
import HistoryLibrary from './components/HistoryLibrary';
import { HadithLibrary } from './components/HadithLibrary';
import { TelegramFeed } from './components/TelegramFeed';
import { TelegramFeedArabic } from './components/TelegramFeedArabic';
import { AnsarmahdiVideos } from './components/AnsarmahdiVideos';
import { QuranVideos } from './components/QuranVideos';
import HaramainLive from './components/HaramainLive';
import { AnsarGroups } from './components/AnsarGroups';
import { PdfLibrary } from './components/PdfLibrary';
import { safeFetch, safeFetchText } from './utils/fetchUtils';

const UI_STRINGS: Record<string, Record<string, string>> = {
  back: { ar: 'رجوع', ku: 'گەڕانەوە', en: 'Back', ps: 'بېرته', fa: 'بازگشت', tr: 'Geri', fr: 'Retour', in: 'Kembali', es: 'Volver', ru: 'Назад', uz: 'Orqaga' },
  home: { ar: 'الرئيسية', ku: 'سەرەکی', en: 'Home', ps: 'کور', fa: 'خانه', tr: 'Ana Sayfa', fr: 'Accueil', in: 'Beranda', es: 'Inicio', ru: 'Главная', uz: 'Bosh sahifa' },
  library: { ar: 'المكتبة الشاملة', ku: 'کتێبخانەی گشتگیر', en: 'Comprehensive Library', ps: 'جامعه کتابتون', fa: 'کتابخانه جامع', tr: 'Kapsamlı Kütüphane', fr: 'Bibliothèque Complète', in: 'Perpustakaan Lengkap', es: 'Biblioteca Integral', ru: 'Библиотека', uz: 'Kutubxona' },
  pdfLibrary: { ar: 'مكتبة PDF', ku: 'کتێبخانەی PDF', en: 'PDF Library', ps: 'د PDF کتابتون', fa: 'کتابخانه PDF', tr: 'PDF Kütüphanesi', fr: 'Bibliothèque PDF', in: 'Perpustakaan PDF', es: 'Biblioteca PDF', ru: 'Библиотека PDF', uz: 'PDF kutubxonasi' },
  community: { ar: 'المجتمع', ku: 'کۆمەڵگە', en: 'Community', ps: 'ټولنه', fa: 'انجمن', tr: 'Topluluk', fr: 'Communauté', in: 'Komunitas', es: 'Comunidad', ru: 'Сообщество', uz: 'Jamiyat' },
  settings: { ar: 'الإعدادات', ku: 'ڕێکخستنەکان', en: 'Settings', ps: 'ترتیبات', fa: 'تنظیمات', tr: 'Ayarlar', fr: 'Paramètres', in: 'Paramètres', es: 'Ajustes', ru: 'Настройки', uz: 'Sozlamalar' },
  adminLogin: { ar: 'دخول المسؤول', ku: 'چوونەژوورەوەی ئەدمین', en: 'Admin Login', ps: 'د مدیر ننوتل', fa: 'ورود مدیر', tr: 'Yönetici Girişi', fr: 'Connexion Admin', in: 'Login Admin', es: 'Inicio Admin', ru: 'Вход администратора', uz: 'Admin kirish' },
  memberLogin: { ar: 'دخول الأعضاء', ku: 'چوونەژوورەوەی ئەندامان', en: 'Member Login', ps: 'د غړو ننوتل', fa: 'ورود اعضا', tr: 'Üye Girişi', fr: 'Connexion Membre', in: 'Login Anggota', es: 'Inicio Miembro', ru: 'Вход для участников', uz: 'A\'zolar kirishi' },
  welcome: { ar: 'مرحباً بك في التطبيق', ku: 'بەخێربێیت بۆ ئەپەکە', en: 'Welcome to the App', ps: 'ایپ ته ښه راغلاست', fa: 'به برنامه خوش آمدید', tr: 'Uygulamaya Hoş Geldiniz', fr: 'Bienvenue sur l\'application', in: 'Selamat Datang di Aplikasi', es: 'Bienvenido a la aplicación', ru: 'Добро пожаловать в приложение', uz: 'Ilovaga xush kelibsiz' },
  chooseLogin: { ar: 'اختر نوع الدخول', ku: 'جۆری چوونەژوورەوە هەڵبژێرە', en: 'Choose Login Type', ps: 'د ننوتلو ډول غوره کړئ', fa: 'نوع ورود را انتخاب کنید', tr: 'Giriş Türünü Seçin', fr: 'Choisir le type de connexion', in: 'Pilih Jenis Login', es: 'Elegir tipo de inicio', ru: 'Выберите тип входа', uz: 'Kirish turini tanlang' },
  search: { ar: 'بحث', ku: 'گەڕان', en: 'Search', ps: 'لټون', fa: 'جستجو', tr: 'Ara', fr: 'Rechercher', in: 'Cari', es: 'Buscar', ru: 'Поиск', uz: 'Qidiruv' },
  loading: { ar: 'جاري التحميل...', ku: 'لە بارکردندایە...', en: 'Loading...', ps: 'بارول کیږي...', fa: 'در حال بارگذاری...', tr: 'Yükleniyor...', fr: 'Chargement...', in: 'Memuat...', es: 'Cargando...', ru: 'Загрузка...', uz: 'Yuklanmoqda...' },
  noResults: { ar: 'لا توجد نتائج', ku: 'هیچ ئەنجامێک نییە', en: 'No results', ps: 'پایلې نشته', fa: 'نتیجه‌ای یافت نشد', tr: 'Sonuç yok', fr: 'Aucun résultat', in: 'Tidak ada hasil', es: 'Sin resultados', ru: 'Нет результатов', uz: 'Natija yo\'q' },
  page: { ar: 'صفحة', ku: 'لاپەڕە', en: 'Page', ps: 'پاڼه', fa: 'صفحه', tr: 'Sayfa', fr: 'Page', in: 'Halaman', es: 'Página', ru: 'Страница', uz: 'Sahifa' },
  of: { ar: 'من', ku: 'لە', en: 'of', ps: 'د', fa: 'از', tr: 'dan', fr: 'de', in: 'dari', es: 'de', ru: 'из', uz: 'dan' },
  translate: { ar: 'ترجمة', ku: 'وەرگێڕان', en: 'Translate', ps: 'ژباړه', fa: 'ترجمه', tr: 'Çevir', fr: 'Traduire', in: 'Terjemahkan', es: 'Traducir', ru: 'Перевести', uz: 'Tarjima qilish' },
  worldNews: { ar: 'الإعلانات', ku: 'ڕیکلامەکان', en: 'World News', ps: 'نړیوال خبرونه', fa: 'اخبار جهان', tr: 'Dünya Haberleri', fr: 'Nouvelles du Monde', in: 'Berita Dunia', es: 'Noticias del Mundo', ru: 'Новости мира', uz: 'Dunyo yangiliklari' },
  researchRoom: { ar: 'غرفة البحث والتحقيق', ku: 'ژووری لێکۆڵینەوە و بەدواداچوون', en: 'Research & Investigation Room', ps: 'د څیړنې او تحقیقاتو خونه', fa: 'اتاق تحقیق و بررسی', tr: 'Araştırma ve İnceleme Odası', fr: 'Salle de Recherche et d\'Investigation', in: 'Ruang Penelitian & Investigasi', es: 'Sala de Investigación e Indagación', ru: 'Комната исследований', uz: 'Tadqiqot xonasi' },
  searchArchive: { ar: 'ابحث في الأرشيف، الفتاوى...', ku: 'گەڕان لە ئەرشیڤ، فەتوایەکان...', en: 'Search archive, fatwas...', ps: 'په آرشیف، فتواګانو کې لټون وکړئ...', fa: 'جستجو در آرشیو، فتاوا...', tr: 'Arşivde, fetvalarda ara...', fr: 'Rechercher dans les archives, fatwas...', in: 'Cari arsip, fatwa...', es: 'Buscar en archivos, fatwas...', ru: 'Поиск в архиве...', uz: 'Arxivdan qidirish...' },
  historicalDocument: { ar: 'وثيقة تاريخية', ku: 'بەڵگەنامەی مێژوویی', en: 'Historical Document', ps: 'تاریخي سند', fa: 'سند تاریخی', tr: 'Tarihi Belge', fr: 'Document Historique', in: 'Dokumen Sejarah', es: 'Documento Historico', ru: 'Исторический документ', uz: 'Tarixiy hujjat' },
  archive: { ar: 'أرشيف', ku: 'ئەرشیڤ', en: 'Archive', ps: 'آرشیف', fa: 'آرشیو', tr: 'Arşiv', fr: 'Archive', in: 'Arsip', es: 'Archivo', ru: 'Архив', uz: 'Arxiv' },
  admin: { ar: 'المسؤول', ku: 'ئەدمین', en: 'Admin', ps: 'مدیر', fa: 'مدیر', tr: 'Yönetici', fr: 'Admin', in: 'Admin', es: 'Admin', ru: 'Админ', uz: 'Admin' },
  newBook: { ar: 'كتاب جديد', ku: 'کتێبی نوێ', en: 'New Book', ps: 'نوی کتاب', fa: 'کتاب جدید', tr: 'Yeni Kitap', fr: 'Nouveau Livre', in: 'Buku Baru', es: 'Nuevo Libro', ru: 'Новая книга', uz: 'Yangi kitob' },
  downloadAndRead: { ar: 'اضغط للتحميل والقراءة', ku: 'کلیک بکە بۆ داگرتن و خوێندنەوە', en: 'Click to download and read', ps: 'د ډاونلوډ او لوستلو لپاره کلیک وکړئ', fa: 'برای دانلود و خواندن کلیک کنید', tr: 'İndirmek ve okumak için tıklayın', fr: 'Cliquez pour télécharger et lire', in: 'Klik untuk mengunduh dan membaca', es: 'Haga clic para descargar y leer', ru: 'Нажмите, чтобы скачать и прочитать', uz: 'Yuklab olish va o\'qish uchun bosing' },
  underDevelopment: { ar: 'هذا القسم قيد التطوير وسيتم إضافته قريباً.', ku: 'ئەم بەشە لە ژێر پەرەپێداندایە و بەم زووانە زیاد دەکرێت.', en: 'This section is under development and will be added soon.', ps: 'دا برخه تر کار لاندې ده او ډیر ژر به اضافه شي.', fa: 'این بخش در حال توسعه است و به زودی اضافه خواهد شد.', tr: 'Bu bölüm geliştirme aşamasındadır ve yakında eklenecektir.', fr: 'Cette section est en cours de développement et sera ajoutée bientôt.', in: 'Bagian ini sedang dalam pengembangan dan akan segera ditambahkan.', es: 'Esta sección está en desarrollo y se agregará pronto.', ru: 'Этот раздел находится в разработке.', uz: 'Bu bo\'lim ishlab chiqilmoqda.' },
  ansar_mahdi: { ar: 'أنصار المهدي', ku: 'سەرخەرانی مەهدی', en: 'Ansar Al-Mahdi', ps: 'انصار المهدي', fa: 'انصار المهدی', tr: 'Ensar el-Mehdi', fr: 'Ansar Al-Mahdi', in: 'Ansar Al-Mahdi', es: 'Ansar Al-Mahdi', ru: 'Ансар аль-Махди', uz: 'Ansor al-Mahdiy' },
  haramain: { ar: 'بث الحرمين', ku: 'لایڤی حەرەمەین', en: 'Haramain Live', ps: 'د حرمین ژوندی خپرونه', fa: 'پخش زنده حرمین', tr: 'Haremeyn Canlı', fr: 'Haramain en Direct', in: 'Haramain Langsung', es: 'Haramain en Vivo', ru: 'Харамейн в прямом эфире', uz: 'Haramayn jonli' },
  prayer: { ar: 'الأذان', ku: 'بانگ', en: 'Prayer Times', ps: 'د لمانځه وختونه', fa: 'اوقات شرعی', tr: 'Ezan Vakitleri', fr: 'Heures de Prière', in: 'Waktu Sholat', es: 'Horarios de Oración', ru: 'Время молитвы', uz: 'Namoz vaqtlari' },
  research: { ar: 'البحث', ku: 'گەڕان', en: 'Research', ps: 'څیړنه', fa: 'تحقیق', tr: 'Araştırma', fr: 'Recherche', in: 'Penelitian', es: 'Investigación', ru: 'Исследование', uz: 'Tadqiqot' },
  ok: { ar: 'موافق', ku: 'باشە', en: 'OK', ps: 'سمه ده', fa: 'باشه', tr: 'Tamam', fr: 'OK', in: 'OK', es: 'Aceptar', ru: 'ОК', uz: 'OK' },
  unityMessage: {
    ar: "لا ندعو إلى سُنّيّة ولا شيعيّة ولا صوفيّة ولا سلفيّة ولا غيرها، بل ندعو فقط إلى الإسلام، لأن الله سبحانه وتعالى سمانا مسلمين.",
    ku: "ئێمە بانگەشە بۆ سوننە، شیعە، سۆفی، سەلەفی و هیچ شتێکی تر ناکەین، بەڵکو تەنها بانگەشە بۆ ئیسلام دەکەین، چونکە خودای گەورە ناوی لێناوین موسڵمان.",
    en: "We do not call for Sunnism, Shiism, Sufism, Salafism, or anything else, but we only call for Islam, because God Almighty named us Muslims.",
    ps: "موږ سنیزم، شیعه مذهب، تصوف، سلفیزم یا بل کوم شی ته نه بولو، بلکې یوازې اسلام ته بولو، ځکه چې لوی خدای موږ ته د مسلمانانو نوم ایښی دی.",
    fa: "ما به سنی‌گری، شیعه‌گری، صوفی‌گری، سلفی‌گری یا هیچ چیز دیگری دعوت نمی‌کنیم، بلکه فقط به اسلام دعوت می‌کنیم، زیرا خداوند متعال ما را مسلمان نامیده است.",
    tr: "Sünnilik, Şiilik, Tasavvuf, Selefilik veya başka bir şeye çağırmıyoruz, sadece İslam'a çağırıyoruz, çünkü Yüce Allah bizi Müslümanlar olarak adlandırdı.",
    fr: "Nous n'appelons pas au sunnisme, au chiisme, au soufisme, au salafisme ou à quoi que ce soit d'autre, mais nous appelons seulement à l'Islam, car Dieu Tout-Puissant nous a nommés musulmans.",
    in: "Kami tidak menyerukan Sunnisme, Syiah, Sufisme, Salafisme, atau apa pun, tetapi kami hanya menyerukan Islam, karena Allah SWT menamai kami Muslim.",
    es: "No pedimos sunismo, chiismo, sufismo, salafismo ni nada más, sino que solo pedimos el Islam, porque Dios Todopoderoso nos llamó musulmanes.",
    ru: "Мы не призываем к суннизму, шиизму, суфизму, салафизму или чему-либо еще, мы призываем только к исламу, потому что Всемогущий Бог назвал нас мусульманами.",
    uz: "Biz sunniylik, shialik, so'fiylik, salafiylik yoki boshqa narsaga chaqirmaymiz, balki faqat Islomga chaqiramiz, chunki Alloh taolo bizni musulmonlar deb atagan."
  },
  adminLoginTitle: { ar: 'چوونەژوورەوەی ئەدمین', ku: 'چوونەژوورەوەی ئەدمین', en: 'Admin Login', ps: 'د مدیر ننوتل', fa: 'ورود مدیر', tr: 'Yönetici Girişi', fr: 'Connexion Admin', in: 'Login Admin', es: 'Inicio Admin', ru: 'Вход администратора', uz: 'Admin kirish' },
  name: { ar: 'الاسم', ku: 'ناو', en: 'Name', ps: 'نوم', fa: 'نام', tr: 'İsim', fr: 'Nom', in: 'Nama', es: 'Nombre', ru: 'Имя', uz: 'Ism' },
  code: { ar: 'الكود', ku: 'کۆد', en: 'Code', ps: 'کوډ', fa: 'کد', tr: 'Kod', fr: 'Code', in: 'Kode', es: 'Código', ru: 'Код', uz: 'Kod' },
  enterName: { ar: 'ناوەکەت بنووسە', ku: 'ناوەکەت بنووسە', en: 'Enter your name', ps: 'خپل نوم ولیکئ', fa: 'نام خود را وارد کنید', tr: 'İsminizi girin', fr: 'Entrez votre nom', in: 'Masukkan nama Anda', es: 'Ingrese su nombre', ru: 'Введите ваше имя', uz: 'Ismingizni kiriting' },
  enterCode: { ar: 'کۆدەکە بنووسە', ku: 'کۆدەکە بنووسە', en: 'Enter the code', ps: 'کوډ ولیکئ', fa: 'کد را وارد کنید', tr: 'Kodu girin', fr: 'Entrez le code', in: 'Masukkan kode', es: 'Ingrese el código', ru: 'Введите код', uz: 'Kodini kiriting' },
  login: { ar: 'تسجيل الدخول', ku: 'چوونەژوورەوە', en: 'Login', ps: 'ننوتل', fa: 'ورود', tr: 'Giriş', fr: 'Connexion', in: 'Login', es: 'Iniciar sesión', ru: 'Войти', uz: 'Kirish' },
  welcomeUser: { ar: 'مرحباً بك', ku: 'بەخێربێیت', en: 'Welcome', ps: 'ښه راغلاست', fa: 'خوش آمدید', tr: 'Hoş geldiniz', fr: 'Bienvenue', in: 'Selamat Datang', es: 'Bienvenido', ru: 'Добро пожаловать', uz: 'Xush kelibsiz' },
  enterNameCommunity: { ar: 'يرجى إدخال اسمك للمشاركة في المجتمع', ku: 'تکایە ناوەکەت بنووسە بۆ بەشداریکردن لە کۆمەڵگە', en: 'Please enter your name to participate in the community', ps: 'مهرباني وکړئ په ټولنه کې د ګډون لپاره خپل نوم ولیکئ', fa: 'لطفاً برای شرکت در انجمن نام خود را وارد کنید', tr: 'Topluluğa katılmak için lütfen isminizi girin', fr: 'Veuillez entrer votre nom pour participer à la communauté', in: 'Silakan masukkan nama Anda untuk berpartisipasi dalam komunitas', es: 'Por favor ingrese su nombre para participar en la comunidad', ru: 'Пожалуйста, введите ваше имя для участия в сообществе', uz: 'Jamiyatda ishtirok etish uchun ismingizni kiriting' },
  displaySettings: { ar: 'إعدادات العرض', ku: 'ڕێکخستنەکانی پیشاندان', en: 'Display Settings', ps: 'د ښودلو ترتیبات', fa: 'تنظیمات نمایش', tr: 'Görüntü Ayarları', fr: 'Paramètres d\'affichage', in: 'Pengaturan Tampilan', es: 'Ajustes de pantalla', ru: 'Настройки дисплея', uz: 'Ekran sozlamalari' },
  appearance: { ar: 'المظهر', ku: 'ڕووکار', en: 'Appearance', ps: 'بڼه', fa: 'ظاهر', tr: 'Görünüm', fr: 'Apparence', in: 'Penampilan', es: 'Apariencia', ru: 'Внешний вид', uz: 'Ko\'rinish' },
  white: { ar: 'أبيض', ku: 'سپی', en: 'White', ps: 'سپین', fa: 'سفید', tr: 'Beyaz', fr: 'Blanc', in: 'Putih', es: 'Blanco', ru: 'Белый', uz: 'Oq' },
  cream: { ar: 'كريمي', ku: 'کرێمی', en: 'Cream', ps: 'کریمي', fa: 'کرمی', tr: 'Krem', fr: 'Crème', in: 'Krim', es: 'Crema', ru: 'Кремовый', uz: 'Kremli' },
  night: { ar: 'ليلي', ku: 'شەو', en: 'Night', ps: 'شپه', fa: 'شب', tr: 'Gece', fr: 'Nuit', in: 'Malam', es: 'Noche', ru: 'Ночной', uz: 'Tungi' },
  font: { ar: 'الخط', ku: 'فۆنت', en: 'Font', ps: 'فونټ', fa: 'قلم', tr: 'Yazı Tipi', fr: 'Police', in: 'Font', es: 'Fuente', ru: 'Шрифт', uz: 'Shrift' },
  ads: { ar: 'الإعلانات', ku: 'ڕیکلامەکان', en: 'Ads', ps: 'اعلانونه', fa: 'تبلیغات', tr: 'Reklamlar', fr: 'Publicités', in: 'Iklan', es: 'Anuncios', ru: 'Реклама', uz: 'Reklamalar' },
  invalidAdmin: { ar: 'ناو یان کۆد هەڵەیە', ku: 'ناو یان کۆد هەڵەیە', en: 'Invalid name or code', ps: 'نوم یا کوډ غلط دی', fa: 'نام یا کد اشتباه است', tr: 'Geçersiz isim veya kod', fr: 'Nom ou code invalide', in: 'Nama atau kode tidak valid', es: 'Nombre o código inválido', ru: 'Неверное имя или код', uz: 'Ism yoki kod noto\'g\'ri' },
};

const t = (key: string, lang: string) => {
  return UI_STRINGS[key]?.[lang] || UI_STRINGS[key]?.['en'] || key;
};

const translateContent = (content: any, lang: string) => {
  if (!content) return '';
  if (typeof content === 'string') return content;
  return content[lang] || content['ar'] || content['ku'] || '';
};

type Language = 'ar' | 'ku' | 'en' | 'ps' | 'fa' | 'tr' | 'fr' | 'in' | 'es' | 'ru' | 'uz';

const SECTIONS = [
  { id: 'quran', ar: 'القرآن الكريم', ku: "قورئانی پیرۆز", en: 'Holy Quran', ps: 'قرآن کریم', fa: 'قرآن کریم', tr: 'Kur\'an-ı Kerim', fr: 'Saint Coran', in: 'Al-Quran', es: 'Santo Corán', ru: 'Священный Коран', uz: 'Muqaddas Qur\'on', icon: BookOpen, imageUrl: 'https://lh3.googleusercontent.com/d/1-0nhSqRu-oydfeoWk3-1lX-LJ3ARUtNo', color: 'from-olive to-gold' },
  { id: 'tahami', ar: 'الشيخ حسن التهامي', ku: 'شێخ حەسەن توهامی', en: 'Sheikh Hassan Tahami', ps: 'شیخ حسن تهامي', fa: 'شیخ حسن تهامی', tr: 'Şeyh Hasan Tahami', fr: 'Cheikh Hassan Tahami', in: 'Syekh Hassan Tahami', es: 'Jeque Hassan Tahami', ru: 'Шейх Хасан Тахами', uz: 'Shayx Hasan Tahomiy', icon: Users, imageUrl: 'https://lh3.googleusercontent.com/d/1mSBm7w9dMVxQFOnUDXe7l8kCL1Sk4E7z', color: 'from-olive to-gold' },
  { id: 'ansar_groups', ar: 'مجموعات أنصار المهدي', ku: 'کۆمەڵەکانی سەرخەرانی ئیمام مەهدی', en: 'Ansar Al-Mahdi Groups', ps: 'د انصار المهدي ډلې', fa: 'گروه‌های انصار المهدی', tr: 'Ensar el-Mehdi Grupları', fr: 'Groupes Ansar Al-Mahdi', in: 'Grup Ansar Al-Mahdi', es: 'Grupos Ansar Al-Mahdi', ru: 'Группы Ансар аль-Махди', uz: 'Ansor al-Mahdiy guruhlari', icon: MessageCircle, color: 'from-olive to-gold' },
  { id: 'fatwas', ar: 'فتاوى أبو داود الحسامي', ku: 'فەتوایەکانی ئەبو داود حوسامی', en: 'Fatwas of Abu Dawud Al-Husami', ps: 'د ابو داود الحسامي فتاوا', fa: 'فتاوای ابو داود الحسامي', tr: 'Ebu Davud el-Husami Fetvaları', fr: 'Fatwas d\'Abu Dawud Al-Husami', in: 'Fatwa Abu Dawud Al-Husami', es: 'Fatwas de Abu Dawud Al-Husami', ru: 'Фетвы Абу Дауда аль-Хусами', uz: 'Abu Dovud al-Husomiy fatvolari', icon: Book, imageUrl: 'https://lh3.googleusercontent.com/d/1LzhTRRIELHGJVPgmQKHyAMOv3DU0I5Dp', color: 'from-olive to-gold' },
  { id: 'methodology', ar: 'منهج الإمام المهدي', ku: 'پەیرەوی ئیمام المهدی', en: 'Methodology of Imam Mahdi', ps: 'د امام مهدي تګلاره', fa: 'روش امام مهدی', tr: 'İmam Mehdi Metodolojisi', fr: 'Méthodologie de l\'Imam Mahdi', in: 'Metodologi Imam Mahdi', es: 'Metodología del Imam Mahdi', ru: 'Методология Имама Махди', uz: 'Imom Mahdiy metodologiyasi', icon: Scale, imageUrl: 'https://lh3.googleusercontent.com/d/1bPY8ZXfoNF4O6Pp-bMptWzEJdLtaIgWZ', color: 'from-gold to-olive' },
  { id: 'mektabey_bzotnawa', ar: 'كتب جمعية الإمام المهدي', ku: 'کتێبەکانی کۆمەڵەی ئیمام مەهدی', en: 'Imam Mahdi Association Books', ps: 'د امام مهدي ټولنې کتابونه', fa: 'کتاب‌های انجمن امام مهدی', tr: 'İmam Mehdi Derneği Kitapları', fr: 'Livres de l\'Association Imam Mahdi', in: 'Buku Asosiasi Imam Mahdi', es: 'Libros de la Asociación Imam Mahdi', ru: 'Книги Ассоциации Имама Махди', uz: 'Imom Mahdiy uyushmasi kitoblari', icon: Book, imageUrl: 'https://lh3.googleusercontent.com/d/1I4kgS6LYjU_7y_8aPUTIdtvGuU6RGHzX', color: 'from-gold to-olive' },
  { id: 'tahami_speeches', ar: 'خطب الشيخ حسن التهامي', ku: 'وتارەکانی شێخ حەسەن توهامی', en: 'Speeches of Sheikh Hassan Tahami', ps: 'د شیخ حسن تهامي ویناوې', fa: 'سخنرانی‌های شیخ حسن تهامی', tr: 'Şeyh Hasan Tahami Konuşmaları', fr: 'Discours du Cheikh Hassan Tahami', in: 'Pidato Syekh Hassan Tahami', es: 'Discursos del Jeque Hassan Tahami', ru: 'Речи шейха Хасана Тахами', uz: 'Shayx Hasan Tahomiy nutqlari', icon: Video, imageUrl: 'https://lh3.googleusercontent.com/d/1KYOrdnT3HJgJzlfm9CA2P_Fqc4WzJ-gP', color: 'from-gold to-olive' },
  { id: 'warplan', ar: 'اقتراب النهاية', ku: 'نزیکبوونەوەی کۆتایی', en: 'Approaching the End', ps: 'پای ته نږدې کیدل', fa: 'نزدیک شدن به پایان', tr: 'Sona Yaklaşırken', fr: 'L\'Approche de la Fin', in: 'Mendekati Akhir', es: 'Acercándose al Final', ru: 'Приближение конца', uz: 'Oxirat yaqinlashmoqda', icon: Flame, imageUrl: 'https://lh3.googleusercontent.com/d/1vqHKbVDZyBYlu1assk3s64uOfZE6nCVG', color: 'from-gold to-olive' },
];

const LIBRARY_CATEGORIES = [
  { id: 'quran', ar: 'القرآن الكريم', ku: 'قورئانی پیرۆز', en: 'Holy Quran', ps: 'قرآن کریم', fa: 'قرآن کریم', tr: 'Kur\'an-ı Kerim', fr: 'Saint Coran', in: 'Al-Quran', es: 'Santo Corán', ru: 'Священный Коран', uz: 'Muqaddas Qur\'on', icon: BookOpen, color: 'from-olive to-gold' },
  { id: 'tafsir', ar: 'التفسير', ku: 'تەفسیر', en: 'Tafsir', ps: 'تفسیر', fa: 'تفسیر', tr: 'Tefsir', fr: 'Tafsir', in: 'Tafsir', es: 'Tafsir', ru: 'Тафсир', uz: 'Tafsir', icon: Book, color: 'from-olive to-gold' },
  { id: 'hadith', ar: 'الحديث', ku: 'فەرموودە', en: 'Hadith', ps: 'حدیث', fa: 'حدیث', tr: 'Hadis', fr: 'Hadith', in: 'Hadits', es: 'Hadiz', ru: 'Хадис', uz: 'Hadis', icon: Library, color: 'from-gold to-olive' },
  { id: 'fiqh', ar: 'الفقه', ku: 'فیقهـ', en: 'Fiqh', ps: 'فقه', fa: 'فقه', tr: 'Fıkıh', fr: 'Fiqh', in: 'Fikih', es: 'Fiqh', ru: 'Фикх', uz: 'Fiqh', icon: Scale, color: 'from-olive to-gold' },
  { id: 'fitan', ar: 'مكتبة أنصار الإمام المهدي', ku: 'کتێبخانەی سەرخەرانی ئیمام المهدی', en: 'Ansar Al-Mahdi Library', ps: 'د انصار المهدي کتابتون', fa: 'کتابخانه انصار المهدی', tr: 'Ensar el-Mehdi Kütüphanesi', fr: 'Bibliothèque Ansar Al-Mahdi', in: 'Perpustakaan Ansar Al-Mahdi', es: 'Biblioteca Ansar Al-Mahdi', ru: 'Библиотека Ансар аль-Махди', uz: 'Ansor al-Mahdiy kutubxonasi', icon: Flame, color: 'from-olive to-gold' },
  { id: 'history', ar: 'التاريخ', ku: 'مێژوو', en: 'History', ps: 'تاریخ', fa: 'تاریخ', tr: 'Tarih', fr: 'Histoire', in: 'Sejarah', es: 'Historia', ru: 'История', uz: 'Tarix', icon: Clock, color: 'from-olive to-gold' },
  { id: 'hisbah', ar: 'الحسبة', ku: 'حیسبە', en: 'Hisbah', ps: 'حسبه', fa: 'حسبه', tr: 'Hisbe', fr: 'Hisbah', in: 'Hisbah', es: 'Hisbah', ru: 'Хисба', uz: 'Hisba', icon: ShieldCheck, color: 'from-olive to-gold' },
  { id: 'language_books', ar: 'كتب اللغة', ku: 'کتێبەکانی زمان', en: 'Language Books', ps: 'د ژبې کتابونه', fa: 'کتاب‌های زبان', tr: 'Dil Kitapları', fr: 'Livres de Langue', in: 'Buku Bahasa', es: 'Libros de Idiomas', ru: 'Книги по языку', uz: 'Til kitoblari', icon: Languages, color: 'from-olive to-gold' },
  { id: 'apocalypse', ar: 'الفتن والملاحم وأشراط الساعة', ku: 'فتنە و جەنگەکان و ڕۆژی دوایی', en: 'Fitan and Signs of the Hour', ps: 'فتنې او د قیامت نښې', fa: 'فتنه‌ها و نشانه‌های قیامت', tr: 'Fiten ve Kıyamet Alametleri', fr: 'Fitan et Signes de l\'Heure', in: 'Fitan dan Tanda-tanda Kiamat', es: 'Fitan y Signos de la Hora', ru: 'Фитан и признаки Часа', uz: 'Fitan va qiyomat alomatlari', icon: Flame, color: 'from-olive to-gold' }
];


const PRAYERS = [
  { ar: 'الفجر', ku: 'بەیانی', en: 'Fajr', ps: 'فجر', fa: 'فجر', tr: 'Fecr', fr: 'Fajr', in: 'Subuh', es: 'Fajr', ru: 'Фаджр', uz: 'Bomdod' },
  { ar: 'الشروق', ku: 'خۆرهەڵاتن', en: 'Sunrise', ps: 'لمر خاته', fa: 'طلوع', tr: 'Güneş', fr: 'Lever du soleil', in: 'Terbit', es: 'Amanecer', ru: 'Восход', uz: 'Quyosh chiqishi' },
  { ar: 'الظهر', ku: 'نیوەڕۆ', en: 'Dhuhr', ps: 'ماسپښین', fa: 'ظهر', tr: 'Öğle', fr: 'Dhuhr', in: 'Dzuhur', es: 'Dhuhr', ru: 'Зухр', uz: 'Peshin' },
  { ar: 'العصر', ku: 'عەسر', en: 'Asr', ps: 'مازدیګر', fa: 'عصر', tr: 'İkindi', fr: 'Asr', in: 'Ashar', es: 'Asr', ru: 'Аср', uz: 'Asr' },
  { ar: 'المغرب', ku: 'مەغریب', en: 'Maghrib', ps: 'ماښام', fa: 'مغرب', tr: 'Akşam', fr: 'Maghrib', in: 'Maghrib', es: 'Maghrib', ru: 'Магриб', uz: 'Shom' },
  { ar: 'العشاء', ku: 'عیشا', en: 'Isha', ps: 'ماسخوتن', fa: 'عشا', tr: 'Yatsı', fr: 'Isha', in: 'Isya', es: 'Isha', ru: 'Иша', uz: 'Xufton' }
];

export default function App() {
  const [language, setLanguage] = useState<any>(null);
  const [showUnityMessage, setShowUnityMessage] = useState(false);
  const [authStep, setAuthStep] = useState<'choice' | 'admin-login' | 'member-flow'>('choice');
  const [adminName, setAdminName] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [showIntro, setShowIntro] = useState(false);
  const [theme, setTheme] = useState<'night' | 'white' | 'cream'>('night');
  const [fontFamily, setFontFamily] = useState<'classic' | 'cairo' | 'calligraphy' | 'newspaper' | 'modern' | 'naskh' | 'kurdish-bold'>('classic');
  const [showDisplaySettings, setShowDisplaySettings] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const { currentUser, setCurrentUser, isLoading: isAuthLoading } = useUser();
  const [appSettings, setAppSettings] = useState<any>({ 
    primaryColor: 'olive', 
    appIcon: '',
    logoUrl: 'https://lh3.googleusercontent.com/d/1srJz8iX6M66Z2cOM4vYedj3OQqGVo9Kz',
    logoSize: 96, // 24 * 4
    logoTop: 8, // 2 * 4
    logoRight: 8 // 2 * 4
  });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginName, setLoginName] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedLibraryBookId, setSelectedLibraryBookId] = useState<string | null>(null);
  const [selectedAdminPost, setSelectedAdminPost] = useState<any | null>(null);
  const [selectedQuranEdition, setSelectedQuranEdition] = useState<string | null>(null);
  const [selectedMahdiPost, setSelectedMahdiPost] = useState<string | null>(null);
  const [selectedTahamiPost, setSelectedTahamiPost] = useState<string | null>(null);
  const [selectedAdId, setSelectedAdId] = useState<string | null>(null);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [ansarVideosAsBanners, setAnsarVideosAsBanners] = useState<any[]>([]);
  const ANSAR_BANNER_LANGS = ['in', 'ps', 'tr', 'ru', 'uz', 'fa', 'fr', 'es'];

  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return '';
    
    // Handle Playlist
    const playlistMatch = url.match(/[?&]list=([^&]+)/);
    if (playlistMatch) {
      return `https://www.youtube.com/embed/videoseries?list=${playlistMatch[1]}`;
    }

    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    return url;
  };

  const renderContent = (content: string, isHtml?: boolean) => {
    if (isHtml) {
      return <div className="html-content prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: content }} />;
    }
    return <p className="whitespace-pre-wrap">{content}</p>;
  };

  const DEFAULT_BANNERS = [
    {
      id: 'default-video-1',
      videoUrl: 'https://www.youtube.com/embed/wZERO-6kdFA',
      title: {
        ar: '80 صفة من صفات المهدي في الشيخ حسن التهامي - الجزء الأول',
        ku: '٨٠ سیفەتی ئیمام مەهدی لە شێخ حسن توهامی بەشی یەکەم',
        en: '80 Characteristics of the Mahdi in Sheikh Hassan Tahami - Part 1'
      },
      target: { tab: 'home', section: 'tahami', postId: 'tahami-video-4' },
      lang: 'ar,ku'
    },
    {
      id: 'default-video-2',
      videoUrl: 'https://www.youtube.com/embed/Khs04kagEp0',
      title: {
        ar: 'هل شك أحد في المهدي حتى الآن؟ انقر لتعرف',
        ku: 'ئایە کەس گومانی مەهدی لێکراوە تائێستا ؟ کلیک بکە و بزانە',
        en: 'Has anyone been suspected of being the Mahdi so far? Click to find out'
      },
      target: { tab: 'home', section: 'tahami', postId: 'tahami-video-1' },
      lang: 'ar,ku'
    },
    {
      id: 'default-video-3',
      videoUrl: 'https://www.youtube.com/embed/b116ylKMYBo',
      title: {
        ar: 'حرب الروم والفرس',
        ku: 'جەنگی نێوان ڕۆم و ئێران',
        en: 'The War Between Rome and Persia'
      },
      target: { tab: 'home', section: 'warplan' },
      lang: 'ar,ku'
    }
  ];

  const ENGLISH_BANNERS = [
    {
      id: 'en-video-1',
      videoUrl: 'https://www.youtube.com/embed/1b46CWu1VvY',
      title: { en: '80 Characteristics of the Mahdi in Sheikh Hassan Tahami - Part 1' },
      lang: 'en'
    },
    {
      id: 'en-video-2',
      videoUrl: 'https://www.youtube.com/embed/YeVIhxUPD4Q',
      title: { en: '80 Characteristics of the Mahdi in Sheikh Hassan Tahami - Part 2' },
      lang: 'en'
    },
    {
      id: 'en-video-3',
      videoUrl: 'https://www.youtube.com/embed/pNt4iUIfxvA',
      title: { en: 'What is the goal of the Ansar Al-Mahdi movement?' },
      lang: 'en'
    },
    {
      id: 'en-video-4',
      videoUrl: 'https://www.youtube.com/embed/jZR_PATl-NA',
      title: { en: 'Is US President Trump mentioned in Islamic, Jewish, and Christian books?' },
      lang: 'en'
    },
    {
      id: 'en-video-5',
      videoUrl: 'https://www.youtube.com/embed/D91JGqhj1lk',
      title: { en: 'The Methodology of the Ansar Al-Mahdi movement' },
      lang: 'en'
    },
    {
      id: 'en-video-6',
      videoUrl: 'https://www.youtube.com/embed/YaVZ6gEZEu8',
      title: { en: 'The Methodology of the Ansar Al-Mahdi movement' },
      lang: 'en'
    }
  ];

  const [allBanners, setAllBanners] = useState<any[]>([...DEFAULT_BANNERS, ...ENGLISH_BANNERS]);

  useEffect(() => {
    if (!language || !ANSAR_BANNER_LANGS.includes(language)) {
      setAnsarVideosAsBanners([]);
      return;
    }

    async function fetchAnsarBanners() {
      try {
        const channelId = language === 'in'
          ? (appSettings?.youtubeChannelIn || 'UCdpDH9SKlsYYojWPgzVQsoA')
          : language === 'fr'
            ? (appSettings?.youtubeChannelFr || 'UCv_6ZpT0v8YpP5vLp9V5_9A')
            : language === 'ps'
              ? (appSettings?.youtubeChannelPs || 'UCdpDH9SKlsYYojWPgzVQsoA')
              : language === 'fa'
                ? (appSettings?.youtubeChannelFa || 'UCdpDH9SKlsYYojWPgzVQsoA')
                : language === 'tr'
                  ? (appSettings?.youtubeChannelTr || 'UCdpDH9SKlsYYojWPgzVQsoA')
                  : language === 'es'
                    ? (appSettings?.youtubeChannelEs || 'UCdpDH9SKlsYYojWPgzVQsoA')
                    : language === 'uz'
                      ? (appSettings?.youtubeChannelUz || 'UCdpDH9SKlsYYojWPgzVQsoA')
                    : language === 'ru'
                      ? (appSettings?.youtubeChannelRu || 'UCdpDH9SKlsYYojWPgzVQsoA')
                      : 'UCdpDH9SKlsYYojWPgzVQsoA';

        const parseYouTubeInput = (input: string) => {
          const playlistMatch = input.match(/[?&]list=([^&]+)/);
          if (playlistMatch) return { type: 'playlist', id: playlistMatch[1] };
          if (input.startsWith('PL') || input.startsWith('UU') || input.startsWith('FL')) return { type: 'playlist', id: input };
          const channelMatch = input.match(/channel\/([^/?]+)/);
          if (channelMatch) return { type: 'channel', id: channelMatch[1] };
          return { type: 'channel', id: input };
        };

        const parsed = parseYouTubeInput(channelId);
        const isPlaylist = parsed.type === 'playlist';
        const targetId = parsed.id;

        const url = isPlaylist 
          ? `https://www.youtube.com/playlist?list=${targetId}`
          : `https://www.youtube.com/channel/${targetId}/videos`;
        const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`;
        
        let text = '';
        try {
          text = await safeFetchText(proxyUrl);
        } catch (scrapeError) {
          console.warn('YouTube scraping failed for banners:', scrapeError);
        }
        
        let fetchedVideos: any[] = [];

        if (text) {
          const match = text.match(/var ytInitialData = (.*?);<\/script>/);
          if (match) {
            const data = JSON.parse(match[1]);
            if (isPlaylist) {
              const items = data.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents?.[0]?.playlistVideoListRenderer?.contents || [];
              fetchedVideos = items
                .filter((i: any) => i.playlistVideoRenderer)
                .map((i: any) => {
                  const v = i.playlistVideoRenderer;
                  return {
                    id: `ansar-${v.videoId}`,
                    videoUrl: `https://www.youtube.com/embed/${v.videoId}`,
                    title: { [language]: v.title.runs[0].text },
                    lang: [language]
                  };
                });
            } else {
              const tabs = data.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
              const videosTab = tabs.find((t: any) => t.tabRenderer?.endpoint?.commandMetadata?.webCommandMetadata?.url?.includes('/videos'));
              if (videosTab) {
                const items = videosTab.tabRenderer?.content?.richGridRenderer?.contents || [];
                fetchedVideos = items
                  .filter((i: any) => i.richItemRenderer?.content?.videoRenderer)
                  .map((i: any) => {
                    const v = i.richItemRenderer.content.videoRenderer;
                    return {
                      id: `ansar-${v.videoId}`,
                      videoUrl: `https://www.youtube.com/embed/${v.videoId}`,
                      title: { [language]: v.title.runs[0].text },
                      lang: [language]
                    };
                  });
              }
            }
          }
        }

        if (fetchedVideos.length === 0) {
          const rssUrl = isPlaylist
            ? `https://www.youtube.com/feeds/videos.xml?playlist_id=${targetId}`
            : `https://www.youtube.com/feeds/videos.xml?channel_id=${targetId}`;
          const rssProxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
          const rssData: any = await safeFetch(rssProxyUrl);
          if (rssData.status === 'ok') {
            fetchedVideos = rssData.items.map((item: any) => ({
              id: `ansar-${item.guid.split(':')[2]}`,
              videoUrl: `https://www.youtube.com/embed/${item.guid.split(':')[2]}`,
              title: { [language]: item.title },
              lang: [language]
            }));
          }
        }

        setAnsarVideosAsBanners(fetchedVideos.slice(0, 5));
      } catch (error) {
        console.error('Error fetching Ansar banners:', error);
      }
    }

    fetchAnsarBanners();
  }, [language, appSettings]);

  const banners = [...allBanners, ...ansarVideosAsBanners].filter(b => {
    if (!b) return false;
    // Check if banner is specific to the current section
    if (b.sectionId && b.sectionId !== selectedSection) return false;
    
    // Check if banner is specific to the current language
    if (b.lang && Array.isArray(b.lang)) {
      return b.lang.includes(language);
    }
    
    // Fallback for older banners
    if (b.language) {
      return b.language === language;
    }
    
    if (!language) return b.lang?.includes('ar') || false;
    if (language === 'en') {
      return b.lang?.includes('en') || false;
    }
    if (language === 'ar' || language === 'ku') {
      return b.lang?.includes(language) || false;
    }
    
    // For special languages, only show banners explicitly for that language
    if (ANSAR_BANNER_LANGS.includes(language)) {
      return b.lang?.includes(language) || false;
    }

    // Fallback for other languages: show Arabic/Kurdish banners
    return b.lang?.includes('ar') || false;
  });

  useEffect(() => {
    const q = query(collection(db, 'Banners'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const b = snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data, 
          lang: data.language || 'ar,ku' 
        };
      });
      // Merge Firestore banners with default ones
      setAllBanners([...b, ...DEFAULT_BANNERS, ...ENGLISH_BANNERS]);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'Banners');
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    setCurrentBanner(0);
  }, [banners.length]);

  useEffect(() => {
    const bannerInterval = setInterval(() => {
      if (banners.length > 0) {
        setCurrentBanner((prev) => (prev + 1) % banners.length);
      }
    }, 5000); // Cycle banners every 5 seconds
    return () => clearInterval(bannerInterval);
  }, [banners.length]);

  const activeBanner = banners.length > 0 ? banners[currentBanner % banners.length] : null;

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'Settings', 'main'), (snapshot) => {
      if (snapshot.exists()) {
        setAppSettings(snapshot.data() as any);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'Settings/main');
    });
    return unsubscribe;
  }, []);
  const [quranSurahs, setQuranSurahs] = useState<any[]>([]);
  const [selectedSurah, setSelectedSurah] = useState<any>(null);
  const [ayahs, setAyahs] = useState<any[]>([]);
  const [quranTab, setQuranTab] = useState<'surahs' | 'tafsir'>('surahs');
  const [tafsirEditions, setTafsirEditions] = useState<any[]>([]);
  const [selectedTafsir, setSelectedTafsir] = useState<any>(null);
  const [selectedTafsirSurah, setSelectedTafsirSurah] = useState<any>(null);
  const [tafsirAyahs, setTafsirAyahs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredAyahs = ayahs.filter(ayah => 
    ayah.arabicText.includes(searchTerm) || ayah.kurdishText.includes(searchTerm)
  );

  const totalPages = Math.ceil(filteredAyahs.length / itemsPerPage);
  const currentAyahs = filteredAyahs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const filteredTafsirAyahs = tafsirAyahs.filter((ayah: any) => 
    ayah.text.includes(searchTerm)
  );

  const totalTafsirPages = Math.ceil(filteredTafsirAyahs.length / itemsPerPage);
  const currentTafsirAyahs = filteredTafsirAyahs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const [isLoadingTafsir, setIsLoadingTafsir] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Translation States
  const [translations, setTranslations] = useState<Record<number, string>>({});
  const [isTranslating, setIsTranslating] = useState<Record<number, boolean>>({});
  const [tafsirTranslations, setTafsirTranslations] = useState<Record<string, string>>({});
  const [isTranslatingTafsir, setIsTranslatingTafsir] = useState<Record<string, boolean>>({});
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    // Load user from local storage
    try {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser && storedUser !== 'undefined') {
        setCurrentUser(JSON.parse(storedUser));
      }
    } catch (err) {
      console.error("Error parsing stored user:", err);
      localStorage.removeItem('currentUser');
    }

    // Ensure we are signed in to Firebase
    if (!auth.currentUser) {
      signInAnonymously(auth).catch(err => console.error("Anonymous sign-in error:", err));
    }

    // Fetch Quran Surahs from public API
    fetch('https://api.alquran.cloud/v1/surah')
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.data)) {
          // Kurdish Surah Names Mapping (Commonly used)
          const kurdishSurahNames: Record<number, string> = {
            1: "فاتیحە", 2: "بەقەرە", 3: "ئالی عیمران", 4: "نیسا", 5: "مائیدە",
            6: "ئەنعام", 7: "ئەعراف", 8: "ئەنفال", 9: "تەوبە", 10: "یوونس",
            11: "هوود", 12: "یووسف", 13: "ڕەعد", 14: "ئیبراهیم", 15: "حیجر",
            16: "نەحل", 17: "ئیسرا", 18: "کەهف", 19: "مەریەم", 20: "تاها",
            21: "ئەنبیا", 22: "حەج", 23: "موئمینون", 24: "نوور", 25: "فورقان",
            26: "شوعەرا", 27: "نەمل", 28: "قەسەس", 29: "عەنکەبووت", 30: "ڕووم",
            31: "لوقمان", 32: "سەجدە", 33: "ئەحزاب", 34: "سەبەء", 35: "فاتیر",
            36: "یاسین", 37: "سافات", 38: "ساد", 39: "زومەر", 40: "غافیر",
            41: "فوسسیلەت", 42: "شوورا", 43: "زوخروف", 44: "دوخان", 45: "جاسیە",
            46: "ئەحقاف", 47: "موحەممەد", 48: "فەتح", 49: "حوجورات", 50: "قاف",
            51: "زاریات", 52: "توور", 53: "نەجم", 54: "قەمەر", 55: "ڕەحمان",
            56: "واقیعە", 57: "حەدید", 58: "موجادەلە", 59: "حەشر", 60: "مومتەحینە",
            61: "سەف", 62: "جوموعە", 63: "مونافیقون", 64: "تەغابون", 65: "تەلاق",
            66: "تەحریم", 67: "مولک", 68: "قەلەم", 69: "حاققە", 70: "مەعاریج",
            71: "نووح", 72: "جن", 73: "موزەممیل", 74: "موددەسیر", 75: "قیامە",
            76: "ئینسان", 77: "مورسەلات", 78: "نەبەء", 79: "نازیعات", 80: "عەبەسە",
            81: "تەکویر", 82: "ئینفیتار", 83: "موتەففیفین", 84: "ئینشیقاق", 85: "بورووج",
            86: "تاریق", 87: "ئەعلا", 88: "غاشیە", 89: "فەجر", 90: "بەلەد",
            91: "شەمس", 92: "لەیل", 93: "زوحا", 94: "شەرح", 95: "تین",
            96: "عەلەق", 97: "قەدر", 98: "بەیینە", 99: "زەلزەلە", 100: "عادیات",
            101: "قاریعە", 102: "تەکاسور", 103: "عەسر", 104: "هومەزە", 105: "فیل",
            106: "قورەیش", 107: "ماعون", 108: "کەوسەر", 109: "کافیرون", 110: "نەسر",
            111: "مەسەد", 112: "ئیخلاس", 113: "فەلەق", 114: "ناس"
          };

          const mappedSurahs = data.data.map((s: any) => ({
            id: s.number.toString(),
            surah_number: s.number,
            name_ar: s.name,
            name_ku: kurdishSurahNames[s.number] || s.englishName, 
            name_en: s.englishName,
            total_verses: s.numberOfAyahs
          }));
          setQuranSurahs(mappedSurahs);
        }
      })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (quranTab === 'tafsir' && tafsirEditions.length === 0) {
      setIsLoadingTafsir(true);
      fetch('https://cdn.jsdelivr.net/gh/spa5k/tafsir_api@main/tafsir/editions.json')
        .then(res => res.json())
        .then(data => {
          const filtered = data.filter((e: any) => e.language_name === 'arabic' || e.language_name === 'Kurdish' || e.language_name === 'English');
          setTafsirEditions(filtered);
          setIsLoadingTafsir(false);
        })
        .catch(err => {
          console.error(err);
          setIsLoadingTafsir(false);
        });
    }
  }, [quranTab, tafsirEditions.length]);

  useEffect(() => {
    if (selectedSurah) {
      setIsLoading(true);
      // Fetch both Arabic and Kurdish text
      fetch(`https://api.alquran.cloud/v1/surah/${selectedSurah.id}/editions/quran-simple,ku.asan`)
        .then(res => res.json())
        .then(data => {
          if (data && data.data && data.data.length === 2) {
            const arabicAyahs = data.data?.[0]?.ayahs;
            const kurdishAyahs = data.data[1].ayahs;
            
            const combinedAyahs = arabicAyahs.map((ayah: any, index: number) => ({
              id: ayah.number.toString(),
              numberInSurah: ayah.numberInSurah,
              arabicText: ayah.text,
              kurdishText: kurdishAyahs?.[index]?.text || ''
            }));
            
            setAyahs(combinedAyahs);
          }
          setIsLoading(false);
        })
        .catch(err => {
          console.error(err);
          setIsLoading(false);
        });
    }
  }, [selectedSurah]);

  useEffect(() => {
    if (selectedTafsir && selectedTafsirSurah) {
      setIsLoadingTafsir(true);
      fetch(`https://cdn.jsdelivr.net/gh/spa5k/tafsir_api@main/tafsir/${selectedTafsir.slug}/${selectedTafsirSurah.id || selectedTafsirSurah.number || selectedTafsirSurah.surah_number}.json`)
        .then(res => res.json())
        .then(data => {
          setTafsirAyahs(data.tafsirs || data.ayahs || []);
          setIsLoadingTafsir(false);
        })
        .catch(err => {
          console.error(err);
          setIsLoadingTafsir(false);
        });
    }
  }, [selectedTafsir, selectedTafsirSurah]);

  const [adminPosts, setAdminPosts] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'admin_posts'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort manually if needed
      const sortedPosts = posts.sort((a: any, b: any) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setAdminPosts(sortedPosts);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'admin_posts');
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      let userData;
      if (!userDoc.exists()) {
        userData = { 
          uid: user.uid, 
          displayName: user.displayName || 'User', 
          role: 'user',
          email: user.email
        };
        await setDoc(userRef, userData);
      } else {
        userData = userDoc.data();
      }
      
      setCurrentUser({ uid: user.uid, ...userData } as any);
      setShowLoginModal(false);
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  if (isAuthLoading) {
    return <div className="flex items-center justify-center h-screen bg-black text-gold"><Loader2 className="w-10 h-10 animate-spin" /></div>;
  }

  // Guest access by default - no mandatory login screen


  const translateHadith = async (hadithId: number, text: string) => {
    if (translations[hadithId]) return;
    
    setIsTranslating(prev => ({ ...prev, [hadithId]: true }));
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: "Translate this Hadith to Kurdish (Sorani). Only provide the translation, no other text or explanation:\n\n" + text,
      });
      setTranslations(prev => ({ ...prev, [hadithId]: response.text || 'Error translating' }));
    } catch (error) {
      console.error(error);
      alert(language === 'ku' ? 'هەڵەیەک ڕوویدا لە وەرگێڕاندا' : 'An error occurred during translation');
      setTranslations(prev => ({ ...prev, [hadithId]: 'هەڵەیەک ڕوویدا لە وەرگێڕاندا' }));
    } finally {
      setIsTranslating(prev => ({ ...prev, [hadithId]: false }));
    }
  };

  const translateTafsir = async (ayahId: string, text: string) => {
    if (tafsirTranslations[ayahId]) return;
    
    setIsTranslatingTafsir(prev => ({ ...prev, [ayahId]: true }));
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const targetLangName = language === 'en' ? 'English' : 'Kurdish (Sorani)';
      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: `Translate this Quranic Tafsir to ${targetLangName}. Only provide the translation, no other text or explanation:\n\n` + text,
      });
      setTafsirTranslations(prev => ({ ...prev, [ayahId]: response.text || 'Error translating' }));
    } catch (error) {
      console.error(error);
      alert(language === 'ku' ? 'هەڵەیەک ڕوویدا لە وەرگێڕاندا' : 'An error occurred during translation');
      setTafsirTranslations(prev => ({ ...prev, [ayahId]: language === 'en' ? 'An error occurred during translation' : 'هەڵەیەک ڕوویدا لە وەرگێڕاندا' }));
    } finally {
      setIsTranslatingTafsir(prev => ({ ...prev, [ayahId]: false }));
    }
  };

  const translateChapters = async (chapters: {id: string, name: string}[], targetLang: 'ar' | 'ku' | 'en') => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const chaptersObj = chapters.reduce((acc, c) => ({ ...acc, [c.id]: c.name }), {});
      
      const targetLangName = targetLang === 'ar' ? 'Arabic' : targetLang === 'en' ? 'English' : 'Kurdish (Sorani)';
      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: `Translate the following Hadith chapter names from English to ${targetLangName}. Return ONLY a valid JSON object where keys are the chapter IDs and values are the translated names. Do not include markdown formatting.\n\n${JSON.stringify(chaptersObj)}`,
        config: {
          responseMimeType: "application/json",
        }
      });
      
      const translatedMap = JSON.parse(response.text || '{}');
      return chapters.map(c => ({
        ...c,
        name: translatedMap[c.id] || c.name
      }));
    } catch (error) {
      console.error("Translation error:", error);
      return chapters;
    }
  };

  // Language Gate Screen
  if (!language) {
    return (
      <div dir="rtl" className="min-h-screen bg-transparent text-white overflow-hidden flex flex-col items-center justify-center relative font-sans">
        {/* Cinematic Background */}
        <div className="fixed inset-0 z-0">
          {appSettings.backgroundImage ? (
            <img
              src={appSettings.backgroundImage}
              alt="Background"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full bg-black" />
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="z-10 flex flex-col items-center w-full max-w-sm px-6"
        >
          <h1 className="text-4xl font-bold text-white mb-8 text-center leading-tight drop-shadow-lg">
            اختر اللغة
            <span className="block text-3xl mt-2 text-gold">زمان هەڵبژێرە</span>
            <span className="block text-xl mt-1 text-white/70">Choose Language</span>
          </h1>

          <div className="flex flex-col gap-3 w-full max-h-[60vh] overflow-y-auto p-2 scrollbar-hide">
            {[
              { id: 'ar', label: 'العربية' },
              { id: 'ku', label: 'کوردی' },
              { id: 'en', label: 'English' },
              { id: 'ps', label: 'پښتو' },
              { id: 'fa', label: 'فارسی' },
              { id: 'tr', label: 'Türkçe' },
              { id: 'fr', label: 'Français' },
              { id: 'in', label: 'Bahasa Indonesia' },
              { id: 'es', label: 'Español' },
              { id: 'ru', label: 'Русский' },
              { id: 'uz', label: 'O\'zbek' }
            ].map((lang) => (
              <button
                key={lang.id}
                onClick={() => { setLanguage(lang.id as Language); setShowIntro(true); }}
                className="group relative w-full py-4 bg-black/40 backdrop-blur-md border border-gold/30 rounded-2xl text-xl font-bold text-white hover:bg-olive/40 hover:border-gold transition-all duration-300 shadow-xl"
              >
                {lang.label}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // Auth Step Screen
  if (authStep === 'choice') {
    return (
      <div dir={['ar', 'ku', 'fa', 'ps'].includes(language) ? 'rtl' : 'ltr'} className="min-h-screen bg-transparent text-white overflow-hidden flex flex-col items-center justify-center relative font-sans">
        <div className="fixed inset-0 z-0">
          <img
            src={appSettings.backgroundImage}
            alt="Background"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="z-10 flex flex-col items-center w-full max-w-sm px-6"
        >
          <div className="w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-xl border border-gold/30 flex items-center justify-center mb-8 shadow-2xl">
            <ShieldCheck className="w-12 h-12 text-gold" />
          </div>

          <h1 className="text-3xl font-bold text-white mb-12 text-center leading-tight drop-shadow-lg">
            {t('welcome', language)}
            <span className="block text-xl mt-2 text-[#daa12e] font-bold border-2 border-[#daa12e]">{t('chooseLogin', language)}</span>
          </h1>

          <div className="flex flex-col gap-4 w-full">
            <button
              onClick={() => setAuthStep('admin-login')}
              className="group relative w-full py-5 bg-[#000000] backdrop-blur-md border border-gold/50 rounded-2xl text-xl font-bold text-white hover:bg-black/80 transition-all duration-300 shadow-xl flex items-center justify-center gap-3"
            >
              <Shield className="w-6 h-6" />
              {t('adminLogin', language)}
            </button>
            <button
              onClick={async () => {
                setAuthError(null);
                try {
                  await signInAnonymously(auth);
                  setAuthStep('member-flow');
                } catch (err: any) {
                  if (err.code === 'auth/admin-restricted-operation') {
                    // This happens if Anonymous auth is disabled in Firebase Console
                    // We'll allow them to proceed as a "Guest" since most read rules are now public
                    console.log("Proceeding in Guest Mode (Anonymous auth disabled in console)");
                    setCurrentUser({ 
                      uid: 'guest-' + Date.now(), 
                      isAnonymous: true, 
                      displayName: 'Guest Member',
                      isGuest: true 
                    });
                    setAuthStep('member-flow');
                  } else {
                    console.error("Anonymous sign-in error:", err);
                    setAuthError(
                      language === 'ar' 
                        ? 'حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.' 
                        : language === 'en'
                        ? 'An error occurred during login. Please try again.'
                        : 'هەڵەیەک ڕوویدا لە کاتی چوونەژوورەوە. تکایە دووبارە هەوڵ بدەرەوە.'
                    );
                  }
                }
              }}
              className="group relative w-full py-5 bg-[#4d4545] backdrop-blur-md border border-white/20 rounded-2xl text-xl font-bold text-white hover:bg-[#3d3737] transition-all duration-300 shadow-xl flex items-center justify-center gap-3"
            >
              <Users className="w-6 h-6" />
              {t('memberLogin', language)}
            </button>
          </div>

          {authError && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm text-center"
            >
              {authError}
            </motion.div>
          )}
        </motion.div>
      </div>
    );
  }

  if (authStep === 'admin-login') {
    const handleAdminLogin = async () => {
      if (adminName === 'احمد' && adminCode === '7313') {
        setAuthError(null);
        try {
          const response = await fetch('/api/auth/admin-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: adminName, code: adminCode })
          });
          
          if (!response.ok) throw new Error('Failed to get admin token');
          
          const { token } = await response.json();
          const userCredential = await signInWithCustomToken(auth, token);
          
          setCurrentUser({
            uid: userCredential.user.uid,
            displayName: 'احمد',
            role: 'admin'
          });
          setAuthStep('member-flow');
        } catch (error) {
          console.error("Admin Auth Error:", error);
          // Fallback to manual state if custom token auth fails
          setCurrentUser({
            uid: 'admin-manual',
            displayName: 'احمد',
            role: 'admin'
          });
          setAuthStep('member-flow');
        }
      } else {
        setAuthError(t('invalidAdmin', language));
      }
    };

    return (
      <div dir="rtl" className="min-h-screen bg-transparent text-white overflow-hidden flex flex-col items-center justify-center relative font-sans">
        <div className="fixed inset-0 z-0">
          <img
            src={appSettings.backgroundImage}
            alt="Background"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="z-10 flex flex-col items-center w-full max-w-sm px-8 py-10 bg-black/60 backdrop-blur-xl border border-gold/30 rounded-[2.5rem] shadow-2xl"
        >
          <button 
            onClick={() => setAuthStep('choice')}
            className="absolute top-6 right-6 text-white/60 hover:text-white"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <Shield className="w-16 h-16 text-gold mb-6" />
          <h2 className="text-2xl font-bold mb-8">{t('adminLoginTitle', language)}</h2>

          <div className="w-full space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-gold/80 mr-2">{t('name', language)}</label>
              <input
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 focus:border-gold outline-none transition-colors"
                placeholder={t('enterName', language)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gold/80 mr-2">{t('code', language)}</label>
              <input
                type="password"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 focus:border-gold outline-none transition-colors"
                placeholder={t('enterCode', language)}
              />
            </div>
            <button
              onClick={handleAdminLogin}
              className="w-full py-4 bg-gold text-black font-bold rounded-xl mt-4 hover:bg-gold/80 transition-colors"
            >
              {t('login', language)}
            </button>

            {authError && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm text-center"
              >
                {authError}
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // Intro Message Screen
  if (showIntro) {
    return (
      <div dir="rtl" className="min-h-screen bg-transparent text-white overflow-hidden flex flex-col items-center justify-center relative font-sans">
        {/* Cinematic Background */}
        <div className="fixed inset-0 z-0">
          {appSettings.backgroundImage ? (
            <img
              src={appSettings.backgroundImage}
              alt="Background"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full bg-black" />
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="z-10 flex flex-col items-center w-full max-w-lg px-8 py-12 bg-black/60 backdrop-blur-xl border border-gold/20 rounded-[2.5rem] text-center shadow-2xl mx-4"
        >
          <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mb-8 border border-gold/20">
            <ShieldCheck className="w-8 h-8 text-gold" />
          </div>

          <p className="text-xl md:text-2xl font-bold text-white leading-relaxed mb-10 font-serif">
            {t('unityMessage', language)}
          </p>

          <button
            onClick={() => setShowIntro(false)}
            className="px-12 py-4 bg-gradient-to-r from-olive to-gold rounded-full text-lg font-bold text-white shadow-lg hover:scale-105 transition-transform active:scale-95"
          >
            {t('ok', language)}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div dir="rtl" className={`h-screen bg-transparent font-${fontFamily} selection:bg-gold/30 flex flex-col transition-colors duration-500 text-[13px] ${theme === 'night' ? 'text-slate-200' : 'text-stone-900'} overflow-y-auto`}>
      {/* Cinematic Background */}
      <div className="fixed inset-0 z-0">
        {appSettings.backgroundImage ? (
          <img 
            src={appSettings.backgroundImage} 
            alt="Cinematic Background" 
            className="w-full h-full object-cover bg-black"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-black" />
        )}
      </div>

      {/* Login Modal */}
      <AnimatePresence>
        {showLoginModal && !currentUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className={`${theme === 'night' ? 'bg-black/40 backdrop-blur-md border-white/10' : 'bg-white/40 backdrop-blur-md border-stone-200/30 shadow-xl'} border rounded-3xl p-8 max-w-sm w-full shadow-2xl relative`}
            >
              <button onClick={() => setShowLoginModal(false)} className={`absolute top-4 left-4 ${theme === 'night' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>
                <X className="w-5 h-5" />
              </button>
              <h2 className={`text-2xl font-bold ${theme === 'night' ? 'text-white' : 'text-black'} mb-2 text-center mt-4`}>
                {t('welcomeUser', language)}
              </h2>
              <p className={`${theme === 'night' ? 'text-slate-400' : 'text-slate-500'} text-center mb-6 text-sm`}>
                {t('enterNameCommunity', language)}
              </p>
              <input
                type="text"
                value={loginName}
                onChange={(e) => setLoginName(e.target.value)}
                placeholder={t('name', language)}
                className={`w-full ${theme === 'night' ? 'bg-black/50 border-white/10 text-white' : 'bg-stone-100 border-stone-200 text-stone-900'} border rounded-xl px-4 py-3 mb-4 focus:outline-none focus:border-gold/50`}
              />
              <button
                onClick={() => {
                  if (!loginName.trim()) return;
                  fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: loginName.trim() })
                  })
                  .then(res => res.json())
                  .then(user => {
                    setCurrentUser(user);
                    localStorage.setItem('currentUser', JSON.stringify(user));
                    setShowLoginModal(false);
                  })
                  .catch(err => console.error(err));
                }}
                className="w-full bg-gradient-to-r from-gold to-olive text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity"
              >
                {t('login', language)}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDisplaySettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className={`${theme === 'night' ? 'bg-black/40 backdrop-blur-md border-white/10' : 'bg-white/40 backdrop-blur-md border-stone-200/30 shadow-xl'} border rounded-3xl p-8 max-w-sm w-full shadow-2xl relative`}
            >
              <button onClick={() => setShowDisplaySettings(false)} className={`absolute top-4 left-4 ${theme === 'night' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>
                <X className="w-5 h-5" />
              </button>
              <h2 className={`text-2xl font-bold ${theme === 'night' ? 'text-white' : 'text-black'} mb-6 text-center mt-2 font-serif`}>
                {t('displaySettings', language)}
              </h2>
              
              <div className="space-y-6">
                {/* Theme Selection */}
                <div>
                  <h3 className={`text-sm font-bold mb-3 ${theme === 'night' ? 'text-slate-300' : 'text-stone-600'}`}>
                    {t('appearance', language)}
                  </h3>
                  <div className="flex gap-2">
                    <button onClick={() => setTheme('white')} className={`flex-1 py-3 rounded-xl border-2 bg-white text-slate-900 ${theme === 'white' ? 'border-gold' : 'border-slate-200'}`}>
                      {t('white', language)}
                    </button>
                    <button onClick={() => setTheme('cream')} className={`flex-1 py-3 rounded-xl border-2 bg-[#FDF6E3] text-[#5c4d3c] ${theme === 'cream' ? 'border-gold' : 'border-[#e6d5b8]'}`}>
                      {t('cream', language)}
                    </button>
                    <button onClick={() => setTheme('night')} className={`flex-1 py-3 rounded-xl border-2 bg-[#0A0C10] text-slate-300 ${theme === 'night' ? 'border-gold' : 'border-slate-800'}`}>
                      {t('night', language)}
                    </button>
                  </div>
                </div>

                {/* Font Selection */}
                <div>
                  <h3 className={`text-sm font-bold mb-3 ${theme === 'night' ? 'text-slate-300' : 'text-stone-600'}`}>
                    {t('font', language)}
                  </h3>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => setFontFamily('naskh')} className={`w-full py-2 px-4 rounded-xl border-2 text-right font-naskh ${fontFamily === 'naskh' ? 'border-gold text-gold' : theme === 'night' ? 'border-white/10 text-slate-300' : 'border-stone-200 text-stone-700'}`}>
                      {language === 'ar' ? 'نسخ (Classic Naskh)' : 'نەستەعلیق (Classic Naskh)'}
                    </button>
                    <button onClick={() => setFontFamily('kurdish-bold')} className={`w-full py-2 px-4 rounded-xl border-2 text-right font-kurdish-bold ${fontFamily === 'kurdish-bold' ? 'border-gold text-gold' : theme === 'night' ? 'border-white/10 text-slate-300' : 'border-stone-200 text-stone-700'}`}>
                      {language === 'ar' ? 'كردي عريض (Kurdish Bold)' : 'کوردی تۆخ (Kurdish Bold)'}
                    </button>
                    <button onClick={() => setFontFamily('modern')} className={`w-full py-2 px-4 rounded-xl border-2 text-right font-modern ${fontFamily === 'modern' ? 'border-gold text-gold' : theme === 'night' ? 'border-white/10 text-slate-300' : 'border-stone-200 text-stone-700'}`}>
                      {language === 'ar' ? 'عصري (Modern Article)' : 'سەردەمیانە (Modern Article)'}
                    </button>
                    <button onClick={() => setFontFamily('classic')} className={`w-full py-2 px-4 rounded-xl border-2 text-right font-classic ${fontFamily === 'classic' ? 'border-gold text-gold' : theme === 'night' ? 'border-white/10 text-slate-300' : 'border-stone-200 text-stone-700'}`}>
                      {language === 'ar' ? 'كلاسيكي (Amiri)' : 'کلاسیکی (Amiri)'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating World News Button */}
      {activeTab !== 'world_news' && (
        <motion.button
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          whileHover={{ scale: 1.1, x: -5 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            setActiveTab('world_news');
            setSelectedSection(null);
          }}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-[45] w-12 h-12 bg-gold/20 backdrop-blur-md border-y border-l border-gold/40 rounded-l-2xl flex items-center justify-center text-gold shadow-[0_0_20px_rgba(212,175,55,0.2)] group transition-all"
          title={t('worldNews', language)}
        >
          <div className="relative">
            <Globe className="w-6 h-6 animate-[spin_10s_linear_infinite]" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          </div>
        </motion.button>
      )}

      {/* Sidebar / Side Icon */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed top-0 right-0 bottom-0 w-64 bg-black border-l z-50 p-6 flex flex-col shadow-2xl`}
            >
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className={`self-end p-2 ${theme === 'night' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'} transition-colors`}
              >
                <ChevronRight className="w-6 h-6" />
              </button>
              
              <div className="mt-8 space-y-4 flex-1">
                <button
                  onClick={() => {
                    setSelectedAdId(null);
                    setActiveTab('ads');
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl ${theme === 'night' ? 'bg-white/5 border-white/10 text-white' : 'bg-stone-50 border-stone-200 text-stone-900'} border hover:bg-opacity-80 transition-colors`}
                >
                  <ImageIcon className="w-5 h-5 text-slate-400" />
                  <span className="font-medium">{t('ads', language)}</span>
                </button>

                {!currentUser && (
                  <button
                    onClick={() => {
                      setShowLoginModal(true);
                      setIsSidebarOpen(false);
                    }}
                    className="w-full flex items-center gap-3 p-4 rounded-xl bg-gold/10 border border-gold/30 text-gold hover:bg-gold/20 transition-colors mt-auto"
                  >
                    <LogIn className="w-5 h-5" />
                    <span className="font-medium">{language === 'ar' ? 'تسجيل الدخول' : 'چوونەژوورەوە'}</span>
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 relative z-10 pb-24 bg-black">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && !selectedSection && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="p-4 max-w-md mx-auto w-full bg-black"
            >
              {/* Admin Publisher for Banners */}
              {currentUser?.role === 'admin' && (
                <AdminPublisher sectionId="home" language={language} theme={theme} />
              )}

              {/* Header / Logo Area */}
              <div className="flex justify-between items-center mb-2 pt-1 relative">
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-gold/10 border border-gold/30 rounded-l-xl flex items-center justify-center text-gold hover:bg-gold/20 transition-colors"
                >
                  <Menu className="w-4 h-4" />
                </button>
                <div className="pl-4">
                  <h1 className="text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold to-gold">
                    {language === 'ar' ? 'حركة أنصار المهدي' : language === 'en' ? 'Ansar Al-Mahdi Movement' : 'کۆمەڵەی پشتیوانی مەهدی'}
                  </h1>
                  <div className="flex items-center gap-2 mt-0">
                    <p className="text-gold/60 text-[9px] font-medium tracking-widest uppercase">
                      {language === 'ar' ? 'الإصدار التجريبي' : language === 'en' ? 'Beta Version' : 'وەشانی تاقیکاری'}
                    </p>
                    {isOffline && (
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gold/10 border border-gold/20">
                        <WifiOff className="w-2 h-2 text-gold" />
                        <span className="text-[7px] text-gold font-bold uppercase tracking-wider">Offline</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button 
                    onClick={() => setLanguage(null)} 
                    className={`w-7 h-7 rounded-full border ${theme === 'night' ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'} flex items-center justify-center hover:bg-opacity-20 backdrop-blur-md shrink-0 transition-colors`}
                    title={language === 'ar' ? 'تغيير اللغة' : 'گۆڕینی زمان'}
                  >
                    <Globe className={`w-3.5 h-3.5 ${theme === 'night' ? 'text-slate-300' : 'text-slate-600'}`} />
                  </button>
                  <button 
                    onClick={() => setShowDisplaySettings(true)}
                    className={`w-7 h-7 rounded-full border ${theme === 'night' ? 'border-gold/30 bg-black/50' : 'border-gold/50 bg-white/80'} flex items-center justify-center backdrop-blur-md shrink-0 transition-all active:scale-90`}
                    title={language === 'ar' ? 'إعدادات العرض' : 'ڕێکخستنەکانی پیشاندان'}
                  >
                    <Type className={`w-3.5 h-3.5 ${theme === 'night' ? 'text-gold' : 'text-gold'}`} />
                  </button>
                </div>
              </div>

              {/* Featured Banner / Ad */}
              {banners.length > 0 && activeBanner && (
                <button 
                  onClick={() => {
                    if (activeBanner.id?.toString().startsWith('ansar-')) {
                      setActiveTab('ansar_mahdi');
                      return;
                    }
                    if (language === 'en') {
                      setSelectedSection('tahami');
                    } else {
                      setSelectedAdId(activeBanner.id);
                      setActiveTab('ads');
                    }
                  }}
                  className="block mb-4 rounded-2xl overflow-hidden border border-gold/30 shadow-2xl relative group cursor-pointer w-full text-right"
                >
                  {activeBanner.videoUrl ? (
                    activeBanner.videoUrl.includes('youtube.com') || activeBanner.videoUrl.includes('youtu.be') ? (
                      <div key={activeBanner.id} className="relative w-full h-48 pointer-events-none">
                        <iframe
                          src={getYouTubeEmbedUrl(activeBanner.videoUrl) + (activeBanner.videoUrl.includes('?') ? '&' : '?') + 'autoplay=1&mute=1&loop=1&controls=0'}
                          className="absolute top-0 left-0 w-full h-full object-cover scale-[1.5]"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <video 
                        key={activeBanner.id}
                        src={activeBanner.videoUrl} 
                        autoPlay 
                        muted 
                        loop 
                        playsInline
                        className="w-full h-48 object-cover"
                      />
                    )
                  ) : (
                    <img 
                      key={activeBanner.id || currentBanner}
                      src={activeBanner.imageUrl}
                      alt="Featured" 
                      className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-bold text-sm">
                        {activeBanner.title ? (activeBanner.title[language as any] || activeBanner.title.ar || activeBanner.title.en || '') : ''}
                      </h3>
                    </div>
                  </div>
                </button>
              )}
              <div className={`relative mb-4 rounded-2xl overflow-hidden border ${theme === 'night' ? 'border-white/10 bg-black/20' : 'border-gold/10 bg-white'} backdrop-blur-sm shadow-2xl ${theme === 'night' ? 'shadow-olive/20' : 'shadow-gold/10'} p-3`}>
                <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-transparent via-gold to-transparent opacity-50" />
                <div className="grid grid-cols-4 gap-2 relative z-10">
                  {SECTIONS.filter(s => ['quran', 'tahami', 'methodology', 'mektabey_bzotnawa'].includes(s.id)).map((section, idx) => (
                    <motion.button
                      key={section.id}
                      onClick={async () => {
                        setSelectedSection(section.id);
                        try {
                          await addDoc(collection(db, 'section_views'), {
                            sectionId: section.id,
                            sectionName: (section as any)[language!] || section.ar,
                            userId: currentUser?.uid || 'guest',
                            timestamp: new Date().toISOString()
                          });
                        } catch (error) {
                          handleFirestoreError(error, OperationType.CREATE, 'section_views');
                        }
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border ${theme === 'night' ? 'border-white/10 bg-white/5 hover:bg-white/10' : 'border-stone-200/50 bg-stone-50 hover:bg-stone-100'} transition-colors`}
                    >
                      <div 
                        className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center shadow-md overflow-hidden bg-white"
                      >
                        {section.imageUrl ? (
                          <img 
                            src={section.imageUrl} 
                            alt={(section as any)[language!] || section.ar} 
                            className="w-full h-full object-contain p-1" 
                            referrerPolicy="no-referrer" 
                          />
                        ) : (
                          <section.icon className="w-5 h-5 text-olive" />
                        )}
                      </div>
                      <span className={`text-[9px] font-bold text-center leading-tight ${theme === 'night' ? 'text-white' : 'text-stone-800'}`}>
                        {language ? (section as any)[language] || section.ar : section.ar}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Row 2: Ad Banner */}
              <motion.button
                onClick={() => {
                  setSelectedLibraryBookId('masih_dajjal_yatoof');
                  setSelectedSection('mektabey_bzotnawa');
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full relative h-28 mb-4 rounded-2xl overflow-hidden shadow-lg group block"
              >
                <img 
                  src="https://images.unsplash.com/photo-1565552645632-d725f8bfc19a?auto=format&fit=crop&w=800&q=80" 
                  alt="Kaaba" 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent flex items-center p-4">
                  <div className="text-right w-full">
                    <span className="inline-block px-2 py-1 bg-red-600 text-white text-[10px] font-bold rounded mb-1">
                      {t('newBook', language)}
                    </span>
                    <h3 className="text-white font-bold text-sm mb-1 font-serif">
                      {language === 'ar' ? 'مسيح دجال يطوف بكعبة' : language === 'en' ? 'The Antichrist Circling the Kaaba' : 'مەسیحی دەججال بەدەوری کەعبەدا دەسوڕێتەوە'}
                    </h3>
                    <p className="text-white/80 text-[10px] flex items-center justify-end gap-1">
                      {t('downloadAndRead', language)}
                      <ArrowRight className="w-3 h-3" />
                    </p>
                  </div>
                </div>
              </motion.button>

              {/* Row 3: Tahami Speeches, Ansar Groups, Warplan, Fatwas */}
              <div className={`relative mb-4 rounded-2xl overflow-hidden border ${theme === 'night' ? 'border-white/10 bg-black/20' : 'border-gold/10 bg-white'} backdrop-blur-sm shadow-2xl ${theme === 'night' ? 'shadow-olive/20' : 'shadow-gold/10'} p-3`}>
                <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-transparent via-gold to-transparent opacity-50" />
                <div className="grid grid-cols-4 gap-2 relative z-10">
                  {SECTIONS.filter(s => ['tahami_speeches', 'ansar_groups', 'warplan', 'fatwas'].includes(s.id)).map((section, idx) => (
                    <motion.button
                      key={section.id}
                      onClick={async () => {
                        setSelectedSection(section.id);
                        try {
                          await addDoc(collection(db, 'section_views'), {
                            sectionId: section.id,
                            sectionName: (section as any)[language!] || section.ar,
                            userId: currentUser?.uid || 'guest',
                            timestamp: new Date().toISOString()
                          });
                        } catch (error) {
                          handleFirestoreError(error, OperationType.CREATE, 'section_views');
                        }
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border ${theme === 'night' ? 'border-white/10 bg-white/5 hover:bg-white/10' : 'border-stone-200/50 bg-stone-50 hover:bg-stone-100'} transition-colors`}
                    >
                      <div 
                        className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center shadow-md overflow-hidden bg-white"
                      >
                        {section.imageUrl ? (
                          <img 
                            src={section.imageUrl} 
                            alt={(section as any)[language!] || section.ar} 
                            className="w-full h-full object-contain p-1" 
                            referrerPolicy="no-referrer" 
                          />
                        ) : (
                          <section.icon className="w-5 h-5 text-olive" />
                        )}
                      </div>
                      <span className={`text-[9px] font-bold text-center leading-tight ${theme === 'night' ? 'text-white' : 'text-stone-800'}`}>
                        {language ? (section as any)[language] || section.ar : section.ar}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Main Sections Grid - Dense 3-4 Column Layout */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mt-2">
                {SECTIONS.filter(s => !['quran', 'tahami', 'methodology', 'mektabey_bzotnawa', 'tahami_speeches', 'ansar_groups', 'warplan', 'fatwas'].includes(s.id)).map((section, idx) => (
                  <motion.button
                    key={section.id}
                    onClick={async () => {
                      setSelectedSection(section.id);
                      try {
                        await addDoc(collection(db, 'section_views'), {
                          sectionId: section.id,
                          sectionName: (section as any)[language!] || section.ar,
                          userId: currentUser?.uid || 'guest',
                          timestamp: new Date().toISOString()
                        });
                      } catch (error) {
                        handleFirestoreError(error, OperationType.CREATE, 'section_views');
                      }
                    }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05, duration: 0.3 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex flex-col items-center justify-center p-2 rounded-2xl group h-[150px] ${theme === 'night' ? 'bg-[#1a1818] border border-white/5' : 'bg-white border border-stone-200'} shadow-lg`}
                  >
                    <div 
                      className={`w-full flex-1 rounded-xl overflow-hidden mb-2 group-hover:shadow-gold/20 transition-all duration-300`}
                      style={{ 
                        backgroundColor: 
                          section.id === 'quran' ? '#694a20' : 
                          ['tahami', 'methodology', 'mektabey_bzotnawa'].includes(section.id) ? '#ffffff' : 
                          undefined 
                      }}
                    >
                      {section.imageUrl ? (
                          <img 
                            src={section.imageUrl} 
                            alt={(section as any)[language!] || section.ar} 
                            className={`w-full h-full ${['tahami', 'methodology', 'mektabey_bzotnawa'].includes(section.id) ? 'object-contain p-2' : 'object-cover'}`} 
                            referrerPolicy="no-referrer" 
                          />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${section.color} flex items-center justify-center`}>
                          <section.icon className="w-8 h-8 text-white" />
                        </div>
                      )}
                    </div>
                    <span className={`text-[11px] font-bold text-center leading-tight px-1 ${theme === 'night' ? 'text-white' : 'text-stone-800'}`}>
                      {language ? (section as any)[language] || section.ar : section.ar}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}



          {activeTab === 'ads' && (
            <motion.div 
              key="ads"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="p-4 max-w-md mx-auto w-full bg-black min-h-screen"
            >
              <h2 className="text-2xl font-bold text-gold mb-6 text-center">
                {t('worldNews', language)}
              </h2>
              <div className="space-y-4">
                {(selectedAdId ? banners.filter(b => b.id === selectedAdId) : banners).map((banner) => (
                  <div key={banner.id} className="p-4 rounded-2xl border border-gold/20 bg-stone-900/50 relative group">
                        <button
                          onClick={async () => {
                            if (window.confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا الإعلان؟' : 'ئایا دڵنیایت لە سڕینەوەی ئەم ڕیکلامە؟')) {
                              try {
                                await deleteDoc(doc(db, 'Banners', banner.id));
                              } catch (error) {
                                console.error('Error deleting banner:', error);
                              }
                            }
                          }}
                          className="absolute top-2 left-2 p-2 bg-red-500/20 hover:bg-red-500/40 text-red-500 rounded-full transition-colors z-10 opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                    <h3 className="text-white font-bold mb-2">{banner.title?.[language as any] || banner.title?.ar}</h3>
                    {banner.videoUrl && (
                      banner.videoUrl.includes('youtube.com') || banner.videoUrl.includes('youtu.be') ? (
                        <div className="aspect-video w-full rounded-xl overflow-hidden">
                          <iframe
                            src={getYouTubeEmbedUrl(banner.videoUrl)}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      ) : (
                        <video src={banner.videoUrl} controls className="w-full rounded-xl" />
                      )
                    )}
                    {banner.imageUrl && (
                      <img src={banner.imageUrl} alt="Ad" className="w-full rounded-xl mt-2" referrerPolicy="no-referrer" />
                    )}
                    {banner.content?.[language as any] && (
                      <div className="mt-4 text-slate-300 text-sm">
                        {renderContent(banner.content[language as any], banner.isHtml)}
                      </div>
                    )}
                    {banner.target?.url && (
                       <a href={banner.target.url} target="_blank" rel="noopener noreferrer" className="block mt-4 text-gold text-center border border-gold/30 rounded-lg py-2 hover:bg-gold/10 transition-colors">
                         {language === 'ar' ? 'عرض المزيد' : 'بینینی زیاتر'}
                       </a>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'world_news' && (
            <WorldNewsFeed 
              theme={theme} 
              language={(['ar', 'ku', 'en'].includes(language!) ? language : 'en') as 'ar' | 'ku' | 'en'} 
              onBack={() => setActiveTab('home')} 
            />
          )}

          {activeTab === 'library' && !selectedLibraryBookId && !selectedSection && (
            <motion.div 
              key="library"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="p-6 max-w-md mx-auto w-full pb-24"
            >
              <div className="text-center mb-8 pt-4">
                <h2 className={`text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${theme === 'night' ? 'from-gold to-gold' : 'from-gold to-olive'} mb-2 font-serif`}>
                  {t('library', language)}
                </h2>
              </div>

              {/* Row 1: Quran, Tafsir, Hadith */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {LIBRARY_CATEGORIES.slice(0, 3).map((cat, idx) => (
                  <motion.button
                    key={cat.id}
                    onClick={() => {
                      if (cat.id === 'quran') {
                        setActiveTab('home');
                        setSelectedSection('quran');
                      } else {
                        setSelectedSection(cat.id);
                      }
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border ${theme === 'night' ? 'border-white/10 bg-white/5' : 'border-stone-200/30 bg-transparent'} backdrop-blur-sm hover:bg-white/10 transition-colors`}
                  >
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${cat.color} flex items-center justify-center mb-3 shadow-lg`}>
                      <cat.icon className="w-6 h-6 text-white" />
                    </div>
                    <span className={`text-xs font-bold text-center ${theme === 'night' ? 'text-white' : 'text-stone-800'}`}>
                      {language === 'ar' ? cat.ar : language === 'en' ? cat.en : cat.ku}
                    </span>
                  </motion.button>
                ))}
              </div>

              {/* Row 2: Fiqh, Fitan, History */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {LIBRARY_CATEGORIES.slice(3, 6).map((cat, idx) => (
                  <motion.button
                    key={cat.id}
                    onClick={() => {
                      if (cat.id === 'fitan') {
                        setSelectedSection('mektabey_bzotnawa');
                      } else {
                        setSelectedSection(cat.id);
                      }
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (idx + 3) * 0.1 }}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border ${theme === 'night' ? 'border-white/10 bg-white/5' : 'border-stone-200/30 bg-white/20'} backdrop-blur-sm hover:bg-white/10 transition-colors`}
                  >
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${cat.color} flex items-center justify-center mb-3 shadow-lg`}>
                      <cat.icon className="w-6 h-6 text-white" />
                    </div>
                    <span className={`text-xs font-bold text-center ${theme === 'night' ? 'text-white' : 'text-stone-800'}`}>
                      {language === 'ar' ? cat.ar : language === 'en' ? cat.en : cat.ku}
                    </span>
                  </motion.button>
                ))}
              </div>

              {/* Row 3: Hisbah, Language, Apocalypse */}
              <div className="grid grid-cols-3 gap-3 mb-8">
                {LIBRARY_CATEGORIES.slice(6, 9).map((cat, idx) => (
                  <motion.button
                    key={cat.id}
                    onClick={() => setSelectedSection(cat.id)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (idx + 6) * 0.1 }}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border ${theme === 'night' ? 'border-white/10 bg-white/5' : 'border-stone-200/30 bg-white/20'} backdrop-blur-sm hover:bg-white/10 transition-colors`}
                  >
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${cat.color} flex items-center justify-center mb-3 shadow-lg`}>
                      <cat.icon className="w-6 h-6 text-white" />
                    </div>
                    <span className={`text-[10px] font-bold text-center ${theme === 'night' ? 'text-white' : 'text-stone-800'}`}>
                      {language === 'ar' ? cat.ar : language === 'en' ? cat.en : cat.ku}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

        {activeTab === 'library' && selectedSection === 'hadith' && (
            <HadithLibrary language={(['ar', 'ku', 'en'].includes(language!) ? language : 'en') as 'ar' | 'ku' | 'en'} theme={theme} onBack={() => setSelectedSection(null)} />
          )}

          {activeTab === 'library' && selectedSection === 'hisbah' && (
            <HisbahLibrary language={(['ar', 'ku', 'en'].includes(language!) ? language : 'en') as 'ar' | 'ku' | 'en'} theme={theme} onBack={() => setSelectedSection(null)} />
          )}

          {activeTab === 'library' && selectedSection === 'language_books' && (
            <LanguageLibrary language={(['ar', 'ku', 'en'].includes(language!) ? language : 'en') as 'ar' | 'ku' | 'en'} theme={theme} onBack={() => setSelectedSection(null)} />
          )}

          {activeTab === 'library' && selectedSection === 'apocalypse' && (
            <ApocalypseLibrary language={(['ar', 'ku', 'en'].includes(language!) ? language : 'en') as 'ar' | 'ku' | 'en'} theme={theme} onBack={() => setSelectedSection(null)} />
          )}

          {activeTab === 'library' && selectedSection === 'fiqh' && (
            <FiqhLibrary language={(['ar', 'ku', 'en'].includes(language!) ? language : 'en') as 'ar' | 'ku' | 'en'} onBack={() => setSelectedSection(null)} />
          )}

          {activeTab === 'library' && selectedSection === 'history' && (
            <HistoryLibrary language={(['ar', 'ku', 'en'].includes(language!) ? language : 'en') as 'ar' | 'ku' | 'en'} onBack={() => setSelectedSection(null)} />
          )}

          {activeTab === 'library' && selectedSection === 'tafsir' && (
            <motion.div
              key="tafsir_lib"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-6 max-w-md mx-auto w-full pb-24 text-center"
            >
              <button 
                onClick={() => setSelectedSection(null)} 
                className="flex items-center gap-2 text-olive bg-olive/10 px-4 py-2 rounded-full mb-8 hover:bg-olive/20 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
                <span className="font-medium text-sm">{t('back', language)}</span>
              </button>
              <div className="py-12">
                <Book className="w-16 h-16 text-olive/50 mx-auto mb-4" />
                <h2 className={`text-xl font-bold ${theme === 'night' ? 'text-white' : 'text-black'} mb-2`}>
                  {language === 'ar' ? 'التفسير' : language === 'en' ? 'Tafsir' : 'تەفسیر'}
                </h2>
                <p className={`${theme === 'night' ? 'text-slate-400' : 'text-slate-600'}`}>
                  {language === 'ar' ? 'يوجد التفسير في قسم القرآن الكريم' : language === 'en' ? 'Tafsir is available in the Holy Quran section' : 'تەفسیر لە بەشی قورئانی پیرۆز بەردەستە'}
                </p>
                <button
                  onClick={() => {
                    setActiveTab('home');
                    setSelectedSection('quran');
                  }}
                  className="mt-6 px-6 py-2 bg-olive text-gold rounded-full font-medium hover:bg-olive/80 transition-colors"
                >
                  {language === 'ar' ? 'الذهاب إلى القرآن الكريم' : language === 'en' ? 'Go to Holy Quran' : 'چوون بۆ قورئانی پیرۆز'}
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'library' && selectedSection === 'mektabey_bzotnawa' && (
            <motion.div
              key="mektabey_bzotnawa_lib"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-6 max-w-md mx-auto w-full pb-24"
            >
              <button 
                onClick={() => setSelectedSection(null)} 
                className="flex items-center gap-2 text-olive bg-olive/10 px-4 py-2 rounded-full mb-8 hover:bg-olive/20 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
                <span className="font-medium text-sm">{t('back', language)}</span>
              </button>

              {currentUser?.role === 'admin' && (
                <AdminPublisher sectionId="library" language={language} theme={theme} />
              )}

              <MektabeyBzotnawa 
                language={language} 
                theme={theme} 
                onBack={() => {
                  setSelectedSection(null);
                  setSelectedLibraryBookId(null);
                }}
                initialBookId={selectedLibraryBookId || undefined}
              />
            </motion.div>
          )}

          {activeTab === 'library' && selectedSection === 'dajjal' && (
            <motion.div
              key="dajjal"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-6 max-w-md mx-auto w-full pb-24"
            >
              <button 
                onClick={() => setSelectedSection(null)} 
                className="flex items-center gap-2 text-slate-400 bg-slate-500/10 px-4 py-2 rounded-full mb-8 hover:bg-slate-500/20 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
                <span className="font-medium text-sm">{t('back', language)}</span>
              </button>
              
              <div className="text-center mb-8">
                <h2 className={`text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${theme === 'night' ? 'from-slate-200 to-slate-400' : 'from-slate-700 to-slate-900'} mb-2 font-serif`}>
                  {language === 'ar' ? DAJJAL_CONTENT.title_ar : language === 'en' ? DAJJAL_CONTENT.title_en || DAJJAL_CONTENT.title_ar : DAJJAL_CONTENT.title_ku}
                </h2>
              </div>

              {currentUser?.role === 'admin' && (
                <AdminPublisher sectionId="dajjal" language={language} theme={theme} />
              )}

              <div className="space-y-6">
                {/* Admin Posts for Dajjal */}
                {adminPosts.filter(p => p.sectionId === 'dajjal' && (p.language === language || (!p.language && language !== 'en'))).map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => setSelectedAdminPost(item)}
                    className={`group relative flex items-center gap-4 w-full p-4 rounded-2xl border ${theme === 'night' ? 'border-white/10 bg-white/5' : 'border-stone-200/30 bg-white/40'} backdrop-blur-sm transition-all hover:scale-[1.01] active:scale-[0.99] mb-4 cursor-pointer`}
                  >
                    <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-white/10 shadow-md flex items-center justify-center bg-slate-500/10">
                      {item.imageUrl ? (
                        <img 
                          src={item.imageUrl} 
                          alt="Post" 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          referrerPolicy="no-referrer"
                        />
                      ) : item.videoUrl ? (
                        <Video className="w-8 h-8 text-gold" />
                      ) : item.audioUrl ? (
                        <Music className="w-8 h-8 text-gold" />
                      ) : (
                        <FileText className="w-8 h-8 text-gold" />
                      )}
                    </div>
                    <div className="flex-1 text-right">
                      <h3 className={`font-bold ${theme === 'night' ? 'text-white' : 'text-black'} text-base leading-tight mb-1 font-serif`}>
                        {item.title[language as any] || (item.content[language as any] ? item.content[language as any].substring(0, 60) + '...' : (language === 'ar' ? 'محتوى جديد' : language === 'en' ? 'New Content' : 'ناوەڕۆکی نوێ'))}
                      </h3>
                      <div className="flex items-center justify-end gap-1 mt-1 text-gold">
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          {item.type === 'video' ? 'Video' : item.type === 'audio' ? 'Audio' : 'Post'}
                        </span>
                        <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                      </div>
                    </div>
                    <ChevronLeft className={`w-5 h-5 ${theme === 'night' ? 'text-slate-400' : 'text-slate-500'}`} />
                  </motion.div>
                ))}

                {DAJJAL_CONTENT.chapters.map((chapter, idx) => (
                  <div key={idx} className={`${theme === 'night' ? 'bg-black/40 backdrop-blur-md border-white/10' : 'bg-white/40 backdrop-blur-md border-stone-200/30 shadow-xl'} border rounded-3xl p-6 shadow-2xl`}>
                    <h3 className={`text-xl font-bold ${theme === 'night' ? 'text-white' : 'text-black'} mb-4 text-center border-b ${theme === 'night' ? 'border-white/10' : 'border-gray-200'} pb-4 font-serif`}>
                      {language === 'ar' ? chapter.title_ar : language === 'en' ? chapter.title_en || chapter.title_ar : chapter.title_ku}
                    </h3>
                  </div>
                ))}
              </div>
            </motion.div>
          )}



          {activeTab === 'home' && selectedSection === 'quran' && !selectedQuranEdition && (
            <motion.div
              key="quran-editions"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-6 max-w-md mx-auto w-full pb-24"
            >
              <button 
                onClick={() => setSelectedSection(null)} 
                className={`flex items-center gap-2 mb-6 px-4 py-2 rounded-full transition-colors ${theme === 'night' ? 'text-gold bg-stone-800 hover:bg-stone-700' : 'text-olive bg-olive/10 hover:bg-olive/20'}`}
              >
                <ChevronRight className="w-5 h-5" />
                <span className="font-medium text-sm">{t('back', language)}</span>
              </button>
              
              <QuranVideos theme={theme} language={language} appSettings={appSettings} currentUser={currentUser} />

              <div className="text-center mb-8">
                <h2 className={`text-2xl font-bold mb-2 ${theme === 'night' ? 'text-gold' : 'text-olive'}`}>
                  {language === 'ar' ? 'اختر المصحف' : language === 'en' ? 'Choose Mushaf' : 'موسحەف هەڵبژێرە'}
                </h2>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setSelectedQuranEdition('hafs')}
                  className={`flex flex-col items-center justify-center p-2 rounded-2xl border-2 transition-all h-[125px] ${theme === 'night' ? 'bg-[#192e2e] border-stone-700 hover:border-gold' : 'bg-white border-stone-200 hover:border-olive shadow-sm'}`}
                >
                  <BookOpen className={`w-7 h-7 mb-2 ${theme === 'night' ? 'text-gold' : 'text-olive'}`} />
                  <h3 className={`font-bold text-[11px] mb-1 text-center leading-tight ${theme === 'night' ? 'text-white' : 'text-stone-900'}`}>
                    {language === 'ar' ? 'رواية حفص' : language === 'en' ? 'Hafs Narration' : 'گێڕانەوەی حەفس'}
                  </h3>
                  <p className={`text-[9px] text-center leading-tight line-clamp-2 ${theme === 'night' ? 'text-stone-400' : 'text-stone-500'}`}>
                    {language === 'ar' ? 'المصحف المعتمد مع التفاسير' : language === 'en' ? 'Standard Mushaf with Tafsir' : 'موسحەفی باوەڕپێکراو لەگەڵ تەفسیرەکان'}
                  </p>
                </button>

                <button
                  onClick={() => setSelectedQuranEdition('bazzi')}
                  className={`flex flex-col items-center justify-center p-2 rounded-2xl border-2 transition-all h-[125px] ${theme === 'night' ? 'bg-[#192e2e] border-stone-700 hover:border-gold' : 'bg-white border-stone-200 hover:border-olive shadow-sm'}`}
                >
                  <BookOpen className={`w-7 h-7 mb-2 ${theme === 'night' ? 'text-gold' : 'text-olive'}`} />
                  <h3 className={`font-bold text-[11px] mb-1 text-center leading-tight ${theme === 'night' ? 'text-white' : 'text-stone-900'}`}>
                    {language === 'ar' ? 'رواية البزي' : language === 'en' ? 'Al-Bazzi Narration' : 'گێڕانەوەی بەزی'}
                  </h3>
                  <p className={`text-[9px] text-center leading-tight line-clamp-2 ${theme === 'night' ? 'text-stone-400' : 'text-stone-500'}`}>
                    {language === 'ar' ? 'قراءة ابن كثير' : language === 'en' ? 'Ibn Kathir Recitation' : 'خوێندنەوەی ئیبن کەسیر'}
                  </p>
                </button>

                <button
                  onClick={() => setSelectedQuranEdition('soosi')}
                  className={`flex flex-col items-center justify-center p-2 rounded-2xl border-2 transition-all h-[125px] ${theme === 'night' ? 'bg-[#192e2e] border-stone-700 hover:border-gold' : 'bg-white border-stone-200 hover:border-olive shadow-sm'}`}
                >
                  <BookOpen className={`w-7 h-7 mb-2 ${theme === 'night' ? 'text-gold' : 'text-olive'}`} />
                  <h3 className={`font-bold text-[11px] mb-1 text-center leading-tight ${theme === 'night' ? 'text-white' : 'text-stone-900'}`}>
                    {language === 'ar' ? 'رواية السوسي' : language === 'en' ? 'Al-Soosi Narration' : 'گێڕانەوەی سووسی'}
                  </h3>
                  <p className={`text-[9px] text-center leading-tight line-clamp-2 ${theme === 'night' ? 'text-stone-400' : 'text-stone-500'}`}>
                    {language === 'ar' ? 'قراءة أبي عمرو' : language === 'en' ? 'Abu Amr Recitation' : 'خوێندنەوەی ئەبو عەمر'}
                  </p>
                </button>

                <button
                  onClick={() => setSelectedQuranEdition('shouba')}
                  className={`flex flex-col items-center justify-center p-2 rounded-2xl border-2 transition-all h-[125px] ${theme === 'night' ? 'bg-[#192e2e] border-stone-700 hover:border-gold' : 'bg-white border-stone-200 hover:border-olive shadow-sm'}`}
                >
                  <BookOpen className={`w-7 h-7 mb-2 ${theme === 'night' ? 'text-gold' : 'text-olive'}`} />
                  <h3 className={`font-bold text-[11px] mb-1 text-center leading-tight ${theme === 'night' ? 'text-white' : 'text-stone-900'}`}>
                    {language === 'ar' ? 'رواية شعبة' : language === 'en' ? 'Shouba Narration' : 'گێڕانەوەی شوعبە'}
                  </h3>
                  <p className={`text-[9px] text-center leading-tight line-clamp-2 ${theme === 'night' ? 'text-stone-400' : 'text-stone-500'}`}>
                    {language === 'ar' ? 'قراءة عاصم' : language === 'en' ? 'Asim Recitation' : 'خوێندنەوەی عاسم'}
                  </p>
                </button>

                <button
                  onClick={() => setSelectedQuranEdition('qumbul')}
                  className={`flex flex-col items-center justify-center p-2 rounded-2xl border-2 transition-all h-[125px] ${theme === 'night' ? 'bg-[#192e2e] border-stone-700 hover:border-gold' : 'bg-white border-stone-200 hover:border-olive shadow-sm'}`}
                >
                  <BookOpen className={`w-7 h-7 mb-2 ${theme === 'night' ? 'text-gold' : 'text-olive'}`} />
                  <h3 className={`font-bold text-[11px] mb-1 text-center leading-tight ${theme === 'night' ? 'text-white' : 'text-stone-900'}`}>
                    {language === 'ar' ? 'رواية قنبل' : language === 'en' ? 'Qumbul Narration' : 'گێڕانەوەی قونبول'}
                  </h3>
                  <p className={`text-[9px] text-center leading-tight line-clamp-2 ${theme === 'night' ? 'text-stone-400' : 'text-stone-500'}`}>
                    {language === 'ar' ? 'قراءة ابن كثير' : language === 'en' ? 'Ibn Kathir Recitation' : 'خوێندنەوەی ئیبن کەسیر'}
                  </p>
                </button>

                <button
                  onClick={() => setSelectedQuranEdition('qaloon')}
                  className={`flex flex-col items-center justify-center p-2 rounded-2xl border-2 transition-all h-[125px] ${theme === 'night' ? 'bg-[#192e2e] border-stone-700 hover:border-gold' : 'bg-white border-stone-200 hover:border-olive shadow-sm'}`}
                >
                  <BookOpen className={`w-7 h-7 mb-2 ${theme === 'night' ? 'text-gold' : 'text-olive'}`} />
                  <h3 className={`font-bold text-[11px] mb-1 text-center leading-tight ${theme === 'night' ? 'text-white' : 'text-stone-900'}`}>
                    {language === 'ar' ? 'رواية قالون' : language === 'en' ? 'Qaloon Narration' : 'گێڕانەوەی قالون'}
                  </h3>
                  <p className={`text-[9px] text-center leading-tight line-clamp-2 ${theme === 'night' ? 'text-stone-400' : 'text-stone-500'}`}>
                    {language === 'ar' ? 'قراءة نافع' : language === 'en' ? 'Nafi Recitation' : 'خوێندنەوەی نافیع'}
                  </p>
                </button>

                <button
                  onClick={() => setSelectedQuranEdition('doori')}
                  className={`flex flex-col items-center justify-center p-2 rounded-2xl border-2 transition-all h-[125px] ${theme === 'night' ? 'bg-[#192e2e] border-stone-700 hover:border-gold' : 'bg-white border-stone-200 hover:border-olive shadow-sm'}`}
                >
                  <BookOpen className={`w-7 h-7 mb-2 ${theme === 'night' ? 'text-gold' : 'text-olive'}`} />
                  <h3 className={`font-bold text-[11px] mb-1 text-center leading-tight ${theme === 'night' ? 'text-white' : 'text-stone-900'}`}>
                    {language === 'ar' ? 'رواية الدوري' : language === 'en' ? 'Al-Doori Narration' : 'گێڕانەوەی دووری'}
                  </h3>
                  <p className={`text-[9px] text-center leading-tight line-clamp-2 ${theme === 'night' ? 'text-stone-400' : 'text-stone-500'}`}>
                    {language === 'ar' ? 'قراءة أبي عمرو' : language === 'en' ? 'Abu Amr Recitation' : 'خوێندنەوەی ئەبو عەمر'}
                  </p>
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'home' && selectedSection === 'quran' && selectedQuranEdition === 'bazzi' && (
            <QuranEditionViewer 
              language={language || 'ar'} 
              theme={theme} 
              onBack={() => setSelectedQuranEdition(null)} 
              editionUrl="https://raw.githubusercontent.com/sherwanymuhammad82-svg/my-book-api/refs/heads/main/Bazzi_Final.json"
              editionNameAr="القرآن الكريم (رواية البزي)"
              editionNameKu="قورئانی پیرۆز (گێڕانەوەی بەزی)"
              editionNameEn="Holy Quran (Al-Bazzi Narration)"
            />
          )}

          {activeTab === 'home' && selectedSection === 'quran' && selectedQuranEdition === 'soosi' && (
            <QuranEditionViewer 
              language={language || 'ar'} 
              theme={theme} 
              onBack={() => setSelectedQuranEdition(null)} 
              editionUrl="https://raw.githubusercontent.com/sherwanymuhammad82-svg/my-book-api/refs/heads/main/Soosi_Final.json"
              editionNameAr="القرآن الكريم (رواية السوسي)"
              editionNameKu="قورئانی پیرۆز (گێڕانەوەی سووسی)"
              editionNameEn="Holy Quran (Al-Soosi Narration)"
            />
          )}

          {activeTab === 'home' && selectedSection === 'quran' && selectedQuranEdition === 'shouba' && (
            <QuranEditionViewer 
              language={language || 'ar'} 
              theme={theme} 
              onBack={() => setSelectedQuranEdition(null)} 
              editionUrl="https://raw.githubusercontent.com/sherwanymuhammad82-svg/my-book-api/refs/heads/main/Shouba_Final.json"
              editionNameAr="القرآن الكريم (رواية شعبة)"
              editionNameKu="قورئانی پیرۆز (گێڕانەوەی شوعبە)"
              editionNameEn="Holy Quran (Shouba Narration)"
            />
          )}

          {activeTab === 'home' && selectedSection === 'quran' && selectedQuranEdition === 'qumbul' && (
            <QuranEditionViewer 
              language={language || 'ar'} 
              theme={theme} 
              onBack={() => setSelectedQuranEdition(null)} 
              editionUrl="https://raw.githubusercontent.com/sherwanymuhammad82-svg/my-book-api/refs/heads/main/Qumbul_Final.json"
              editionNameAr="القرآن الكريم (رواية قنبل)"
              editionNameKu="قورئانی پیرۆز (گێڕانەوەی قونبول)"
              editionNameEn="Holy Quran (Qumbul Narration)"
            />
          )}

          {activeTab === 'home' && selectedSection === 'quran' && selectedQuranEdition === 'qaloon' && (
            <QuranEditionViewer 
              language={language || 'ar'} 
              theme={theme} 
              onBack={() => setSelectedQuranEdition(null)} 
              editionUrl="https://raw.githubusercontent.com/sherwanymuhammad82-svg/my-book-api/refs/heads/main/Qaloon_Uthmanic_Full.json"
              editionNameAr="القرآن الكريم (رواية قالون)"
              editionNameKu="قورئانی پیرۆز (گێڕانەوەی قالون)"
              editionNameEn="Holy Quran (Qaloon Narration)"
            />
          )}

          {activeTab === 'home' && selectedSection === 'quran' && selectedQuranEdition === 'doori' && (
            <QuranEditionViewer 
              language={language || 'ar'} 
              theme={theme} 
              onBack={() => setSelectedQuranEdition(null)} 
              editionUrl="https://raw.githubusercontent.com/sherwanymuhammad82-svg/my-book-api/refs/heads/main/Doori_Final.json"
              editionNameAr="القرآن الكريم (رواية الدوري)"
              editionNameKu="قورئانی پیرۆز (گێڕانەوەی دووری)"
              editionNameEn="Holy Quran (Al-Doori Narration)"
            />
          )}

          {activeTab === 'home' && selectedSection === 'quran' && selectedQuranEdition === 'hafs' && !selectedSurah && !selectedTafsir && (
            <motion.div
              key="quran"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-6 max-w-md mx-auto w-full pb-24"
            >
              <button 
                onClick={() => {
                  setSelectedQuranEdition(null);
                  setSelectedTafsir(null);
                  setSelectedTafsirSurah(null);
                  setQuranTab('surahs');
                }} 
                className="flex items-center gap-2 text-olive mb-6 bg-olive/10 px-4 py-2 rounded-full hover:bg-olive/20 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
                <span className="font-medium text-sm">{t('back', language)}</span>
              </button>
              
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-olive to-gold mb-2">
                  {language === 'ar' ? 'القرآن الكريم' : language === 'en' ? 'Holy Quran' : 'قورئانی پیرۆز'}
                </h2>
              </div>

              {/* Quran Tabs */}
              <div className="flex gap-2 mb-6 bg-white/5 p-1 rounded-xl">
                <button 
                  onClick={() => setQuranTab('surahs')} 
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${quranTab === 'surahs' ? 'bg-olive text-gold' : 'text-slate-400'}`}
                >
                  {language === 'ar' ? 'السور' : language === 'en' ? 'Surahs' : 'سوورەتەکان'}
                </button>
                <button 
                  onClick={() => setQuranTab('tafsir')} 
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${quranTab === 'tafsir' ? 'bg-olive text-gold' : 'text-slate-400'}`}
                >
                  {language === 'ar' ? 'التفاسير' : language === 'en' ? 'Tafsirs' : 'تەفسیرەکان'}
                </button>
              </div>

              <div className="space-y-3">
                {quranTab === 'surahs' ? (
                  quranSurahs.length === 0 ? (
                    <div className="text-center text-slate-400 py-10">
                      {language === 'ar' ? 'جاري التحميل...' : language === 'en' ? 'Loading...' : 'لە بارکردندایە...'}
                    </div>
                  ) : (
                    quranSurahs.map((surah, idx) => (
                      <motion.button
                        key={surah.id}
                        onClick={() => setSelectedSurah(surah)}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-olive/20 flex items-center justify-center text-gold font-bold">
                            {surah.surah_number}
                          </div>
                          <div className="text-right">
                            <h3 className="text-white font-bold text-lg">{language === 'ar' ? surah.name_ar : language === 'en' ? surah.name_en || surah.name_ar : surah.name_ku}</h3>
                            <p className="text-slate-400 text-xs">{surah.total_verses} {language === 'ar' ? 'آيات' : language === 'en' ? 'Verses' : 'ئایەت'}</p>
                          </div>
                        </div>
                        <ChevronLeft className="w-5 h-5 text-slate-500" />
                      </motion.button>
                    ))
                  )
                ) : (
                  isLoadingTafsir ? (
                    <div className="text-center text-slate-400 py-10 flex flex-col items-center justify-center gap-4">
                      <Loader2 className="w-8 h-8 animate-spin text-olive" />
                      <span>{language === 'ar' ? 'جاري تحميل التفاسير...' : language === 'en' ? 'Loading Tafsirs...' : 'لە بارکردنی تەفسیرەکان...'}</span>
                    </div>
                  ) : (
                    tafsirEditions.map((edition, idx) => (
                      <motion.button
                        key={edition.id}
                        onClick={() => setSelectedTafsir(edition)}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-olive/20 flex items-center justify-center text-gold">
                            <BookOpen className="w-5 h-5" />
                          </div>
                          <div className="text-right">
                            <h3 className="text-white font-medium text-lg">
                              {language === 'ar' ? edition.name : language === 'en' ? (edition.name_en || edition.name) : edition.name_ku || edition.name}
                            </h3>
                            <p className="text-slate-400 text-sm">
                              {language === 'ar' ? edition.author_name : language === 'en' ? (edition.author_en || edition.author_name) : edition.author_ku || edition.author_name}
                            </p>
                          </div>
                        </div>
                        <ChevronLeft className="w-5 h-5 text-slate-500" />
                      </motion.button>
                    ))
                  )
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'home' && selectedSection === 'quran' && selectedQuranEdition === 'hafs' && selectedTafsir && !selectedTafsirSurah && (
            <motion.div
              key="tafsir-surahs"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-6 max-w-md mx-auto w-full pb-24"
            >
              <button 
                onClick={() => setSelectedTafsir(null)} 
                className="flex items-center gap-2 text-olive mb-6 bg-olive/10 px-4 py-2 rounded-full hover:bg-olive/20 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
                <span className="font-medium text-sm">{t('back', language)}</span>
              </button>
              
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-olive to-gold mb-2">
                  {selectedTafsir.name}
                </h2>
                <p className="text-slate-400 text-sm">{language === 'ar' ? 'اختر السورة' : language === 'en' ? 'Choose Surah' : 'سوورەت هەڵبژێرە'}</p>
              </div>

              <div className="space-y-3">
                {quranSurahs.length === 0 ? (
                  <div className="text-center text-slate-400 py-10">
                    {language === 'ar' ? 'جاري التحميل...' : 'لە بارکردندایە...'}
                  </div>
                ) : (
                  quranSurahs.map((surah, idx) => (
                    <motion.button
                      key={surah.id}
                      onClick={() => setSelectedTafsirSurah(surah)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-olive/20 flex items-center justify-center text-gold font-bold">
                          {surah.surah_number}
                        </div>
                        <div className="text-right">
                          <h3 className="text-white font-bold text-lg">{language === 'ar' ? surah.name_ar : surah.name_ku}</h3>
                        </div>
                      </div>
                      <ChevronLeft className="w-5 h-5 text-slate-500" />
                    </motion.button>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'home' && selectedSection === 'quran' && selectedQuranEdition === 'hafs' && selectedTafsir && selectedTafsirSurah && (
            <motion.div
              key="tafsir-details"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-6 max-w-md mx-auto w-full pb-24"
            >
              <div className="flex items-center justify-between mb-6">
                <button 
                  onClick={() => {
                    setSelectedTafsirSurah(null);
                    setSearchTerm('');
                    setCurrentPage(1);
                  }} 
                  className="flex items-center gap-2 text-olive bg-olive/10 px-4 py-2 rounded-full hover:bg-olive/20 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                  <span className="font-medium text-sm">{t('back', language)}</span>
                </button>
                <div className="relative flex-1 max-w-[150px] ml-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-olive/50" />
                  <input
                    type="text"
                    placeholder={language === 'ar' ? 'بحث...' : 'گەڕان...'}
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-9 pr-4 py-2 bg-olive/10 border border-olive/20 rounded-full text-sm text-gold placeholder-olive/50 focus:outline-none focus:border-olive/50"
                  />
                </div>
              </div>

              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gold mb-1 font-naskh">
                  {selectedTafsirSurah.name_ar}
                </h2>
                <p className="text-olive/60 text-sm">{selectedTafsir.name}</p>
              </div>

              {isLoadingTafsir ? (
                <div className="text-center text-slate-400 py-10 flex flex-col items-center justify-center gap-4">
                  <Loader2 className="w-8 h-8 animate-spin text-olive" />
                  <span>{language === 'ar' ? 'جاري تحميل التفسير...' : 'لە بارکردنی تەفسیر...'}</span>
                </div>
              ) : filteredTafsirAyahs.length === 0 ? (
                <div className="text-center text-slate-400 py-10">
                  {language === 'ar' ? 'لا توجد نتائج' : 'هیچ ئەنجامێک نییە'}
                </div>
              ) : (
                <div className="space-y-6">
                  {currentTafsirAyahs.map((ayah: any, idx: number) => {
                    const ayahId = `${selectedTafsirSurah.id}-${ayah.ayah || idx}`;
                    return (
                      <div key={ayahId} className="olive-manuscript rounded-2xl p-6 relative overflow-hidden border border-olive/50 shadow-2xl">
                        <div className="absolute top-0 right-0 w-1.5 h-full bg-gradient-to-b from-olive to-gold" />
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-olive/20 flex items-center justify-center border border-olive/30">
                              <span className="text-gold font-bold text-sm">{ayah.ayah}</span>
                            </div>
                            <h4 className="text-gold font-medium text-sm font-naskh">
                              {language === 'ar' ? 'الآية' : language === 'en' ? 'Verse' : 'ئایەت'}
                            </h4>
                          </div>
                          
                          {selectedTafsir.language_name !== 'Kurdish' && (
                            <button
                              onClick={() => translateTafsir(ayahId, ayah.text)}
                              disabled={isTranslatingTafsir[ayahId]}
                              className="flex items-center gap-2 text-xs bg-olive/10 text-gold border border-olive/30 px-3 py-1.5 rounded-lg hover:bg-olive/20 transition-colors disabled:opacity-50"
                            >
                              {isTranslatingTafsir[ayahId] ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Languages className="w-3.5 h-3.5" />
                              )}
                              {language === 'ar' ? 'ترجمة' : language === 'en' ? 'Translation' : 'وەرگێڕان'}
                            </button>
                          )}
                        </div>
                        
                        <p className="text-gold text-xl leading-[1.8] font-naskh text-justify mb-4" dir="rtl">
                          {ayah.text}
                        </p>

                        {tafsirTranslations[ayahId] && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-6 pt-6 border-t border-olive/20 bg-black/20 p-6 rounded-2xl"
                          >
                            <p className="text-gold text-lg leading-relaxed text-justify font-kurdish-bold" dir="rtl">
                              {tafsirTranslations[ayahId]}
                            </p>
                          </motion.div>
                        )}
                      </div>
                    );
                  })}

                  {/* Pagination Slider */}
                  {totalTafsirPages > 1 && (
                    <div className="mt-8 p-4 glass-card rounded-2xl flex flex-col items-center gap-4">
                      <div className="flex justify-between w-full text-[10px] font-bold text-gold uppercase tracking-widest">
                        <span>{t('page', language)} {currentPage}</span>
                        <span>{t('of', language)} {totalTafsirPages}</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" 
                        max={totalTafsirPages} 
                        value={currentPage} 
                        onChange={(e) => setCurrentPage(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-olive/20 rounded-lg appearance-none cursor-pointer accent-gold"
                      />
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'home' && selectedSection === 'quran' && selectedQuranEdition === 'hafs' && selectedSurah && (
            <motion.div
              key="surah-details"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-6 max-w-md mx-auto w-full pb-24"
            >
              <div className="flex items-center justify-between mb-6">
                <button 
                  onClick={() => {
                    setSelectedSurah(null);
                    setSearchTerm('');
                    setCurrentPage(1);
                  }} 
                  className="flex items-center gap-2 text-gold bg-olive/10 px-4 py-2 rounded-full hover:bg-olive/20 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                  <span className="font-medium text-sm">{t('back', language)}</span>
                </button>
                <div className="relative flex-1 max-w-[150px] ml-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/50" />
                  <input
                    type="text"
                    placeholder={language === 'ar' ? 'بحث...' : 'گەڕان...'}
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-9 pr-4 py-2 bg-olive/10 border border-olive/20 rounded-full text-sm text-gold placeholder-gold/50 focus:outline-none focus:border-gold/50"
                  />
                </div>
              </div>

              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gold mb-2 font-naskh">
                  {language === 'ar' ? selectedSurah.name_ar : language === 'en' ? selectedSurah.name_en || selectedSurah.name_ar : selectedSurah.name_ku}
                </h2>
              </div>

              {isLoading ? (
                <div className="text-center text-slate-400 py-10">
                  {language === 'ar' ? 'جاري التحميل...' : 'لە بارکردندایە...'}
                </div>
              ) : filteredAyahs.length === 0 ? (
                <div className="text-center text-slate-400 py-10">
                  {language === 'ar' ? 'لا توجد نتائج' : 'هیچ ئەنجامێک نییە'}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-6 mushaf-frame p-4 bg-[#F4ECD8]/90 rounded-xl">
                    {currentAyahs.map((ayah) => (
                      <div key={ayah.id} className="border-b border-olive/10 pb-6 last:border-0">
                        <p className="text-olive text-3xl leading-[2] font-naskh mb-6 text-center" dir="rtl">
                          {ayah.arabicText} <span className="text-gold/50 text-base mx-1">({ayah.numberInSurah})</span>
                        </p>
                        <div className="w-24 h-px bg-olive/10 mx-auto my-6" />
                        <p className="text-olive text-lg leading-relaxed text-justify font-kurdish-bold" dir="rtl">
                          {ayah.kurdishText}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Pagination Slider */}
                  {totalPages > 1 && (
                    <div className="mt-8 p-4 glass-card rounded-2xl flex flex-col items-center gap-4">
                      <div className="flex justify-between w-full text-[10px] font-bold text-gold uppercase tracking-widest">
                        <span>{t('page', language)} {currentPage}</span>
                        <span>{t('of', language)} {totalPages}</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" 
                        max={totalPages} 
                        value={currentPage} 
                        onChange={(e) => setCurrentPage(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-olive/20 rounded-lg appearance-none cursor-pointer accent-gold"
                      />
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'home' && selectedSection === 'methodology' && (
            <motion.div
              key="methodology"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-6 max-w-md mx-auto w-full"
            >
              <button 
                onClick={() => setSelectedSection(null)} 
                className="flex items-center gap-2 text-gold mb-6 bg-olive/10 px-4 py-2 rounded-full hover:bg-olive/20 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
                <span className="font-medium text-sm">{t('back', language)}</span>
              </button>
              
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-olive to-gold mb-2">
                  {(METHODOLOGY_CONTENT as any).title[language as any] || (METHODOLOGY_CONTENT as any).title.ar}
                </h2>
              </div>

              {currentUser?.role === 'admin' && (
                <AdminPublisher sectionId="methodology" language={language} theme={theme} />
              )}

              {/* Admin Posts for Methodology */}
              <div className="space-y-4 mb-10">
                {adminPosts.filter(p => p.sectionId === 'methodology' && (p.language === language || (!p.language && language !== 'en'))).map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`group relative flex flex-col w-full p-4 rounded-2xl border ${theme === 'night' ? 'border-white/10 bg-white/5' : 'border-stone-200/30 bg-white/40'} backdrop-blur-sm transition-all`}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-br from-olive to-gold shadow-lg shrink-0">
                        {item.type === 'video' ? <Video className="w-6 h-6 text-white" /> : item.type === 'audio' ? <Music className="w-6 h-6 text-white" /> : <FileText className="w-6 h-6 text-white" />}
                      </div>
                      <div className="flex-1 text-right">
                        <h5 className="text-gold font-bold text-sm mb-1">{item.title[language]}</h5>
                      </div>
                    </div>

                    <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-4 bg-black/20">
                      {item.videoUrl ? (
                        item.videoUrl.includes('youtube.com') || item.videoUrl.includes('youtu.be') ? (
                          <iframe
                            src={getYouTubeEmbedUrl(item.videoUrl)}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        ) : (
                          <video src={item.videoUrl} controls className="w-full h-full" />
                        )
                      ) : item.imageUrl ? (
                        <img 
                          src={item.imageUrl} 
                          alt="Post" 
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      ) : item.audioUrl ? (
                        <audio src={item.audioUrl} controls className="w-full px-4 py-8" />
                      ) : null}
                    </div>

                    {item.content?.[language] && (
                      <div className={`${theme === 'night' ? 'text-slate-300' : 'text-stone-600'} text-sm leading-relaxed text-right`}>
                        {renderContent(item.content[language], item.isHtml)}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Goals Section */}
              <div className="mb-10">
                <h3 className="text-xl font-bold text-white mb-6">{(METHODOLOGY_CONTENT as any).goalsTitle[language as any] || (METHODOLOGY_CONTENT as any).goalsTitle.ar}</h3>
                
                <div className="space-y-3">
                  {METHODOLOGY_CONTENT.goals.map((goal, idx) => (
                    <div key={idx} className={`group relative flex items-center gap-4 w-full p-4 rounded-2xl border ${theme === 'night' ? 'border-white/10 bg-white/5' : 'border-stone-200/30 bg-white/40'} backdrop-blur-sm transition-all`}>
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-olive to-gold shadow-lg shrink-0">
                        <span className="text-white font-bold text-sm">{idx + 1}</span>
                      </div>
                      <div className="flex-1 text-right">
                        <h5 className="text-gold font-bold text-sm mb-1">{(goal as any).title[language as any] || (goal as any).title.ar}</h5>
                        <p className={`${theme === 'night' ? 'text-slate-300' : 'text-stone-600'} text-xs leading-relaxed`}>{(goal as any).text[language as any] || (goal as any).text.ar}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Methodology Points Section */}
              <div className="mb-10">
                <h3 className="text-xl font-bold text-white mb-6">{(METHODOLOGY_CONTENT as any).methodologyTitle[language as any] || (METHODOLOGY_CONTENT as any).methodologyTitle.ar}</h3>
                
                <div className="space-y-3">
                  {METHODOLOGY_CONTENT.points.map((point, idx) => (
                    <div key={idx} className={`group relative flex items-center gap-4 w-full p-4 rounded-2xl border ${theme === 'night' ? 'border-white/10 bg-white/5' : 'border-stone-200/30 bg-white/40'} backdrop-blur-sm transition-all`}>
                      <div className="w-8 h-8 rounded-full bg-olive/20 text-gold flex items-center justify-center shrink-0 font-bold text-xs border border-olive/30">
                        {idx + 1}
                      </div>
                      <div className="flex-1 text-right">
                        <p className={`${theme === 'night' ? 'text-slate-300' : 'text-stone-600'} text-sm leading-relaxed`}>{(point as any)[language as any] || (point as any).ar}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Conclusion & Footer */}
              <div className="bg-gradient-to-br from-olive/20 to-black border border-olive/20 rounded-2xl p-6 text-center">
                <div className="space-y-4 mb-8">
                  {METHODOLOGY_CONTENT.conclusion.map((conc, idx) => (
                    <div key={idx}>
                      <p className="text-gold font-medium leading-relaxed mb-1">{(conc as any)[language as any] || (conc as any).ar}</p>
                    </div>
                  ))}
                </div>
                
                <div className="pt-6 border-t border-olive/20 space-y-2">
                  <p className="text-white font-bold">{(METHODOLOGY_CONTENT as any).footer.author[language as any] || (METHODOLOGY_CONTENT as any).footer.author.ar}</p>
                  
                  <div className="text-xs text-slate-400 space-y-1 mt-4">
                    <p>{(METHODOLOGY_CONTENT.footer.dateHijri as any)[language] || (METHODOLOGY_CONTENT.footer.dateHijri as any).ar}</p>
                    <p>{(METHODOLOGY_CONTENT.footer.dateGregorian as any)[language] || (METHODOLOGY_CONTENT.footer.dateGregorian as any).ar}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'home' && selectedSection === 'fatwas' && (
            <motion.div
              key="fatwas"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-6 max-w-md mx-auto w-full"
            >
              <button 
                onClick={() => setSelectedSection(null)} 
                className="flex items-center gap-2 text-gold mb-6 bg-olive/10 px-4 py-2 rounded-full hover:bg-olive/20 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
                <span className="font-medium text-sm">{t('back', language)}</span>
              </button>
              
              <div className="space-y-4">
                {adminPosts.filter(p => p.sectionId === 'fatwas' && (p.language === language || (!p.language && language !== 'en'))).map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => setSelectedAdminPost(item)}
                    className={`group relative flex items-center gap-4 w-full p-4 rounded-2xl border ${theme === 'night' ? 'border-white/10 bg-white/5' : 'border-stone-200/30 bg-white/40'} backdrop-blur-sm transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer`}
                  >
                    <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-white/10 shadow-md flex items-center justify-center bg-olive/10">
                      {item.imageUrl ? (
                        <img 
                          src={item.imageUrl} 
                          alt="Post" 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          referrerPolicy="no-referrer"
                        />
                      ) : item.videoUrl ? (
                        <Video className="w-8 h-8 text-gold" />
                      ) : item.audioUrl ? (
                        <Music className="w-8 h-8 text-gold" />
                      ) : (
                        <FileText className="w-8 h-8 text-gold" />
                      )}
                    </div>
                    <div className="flex-1 text-right">
                      <h3 className={`font-bold ${theme === 'night' ? 'text-white' : 'text-black'} text-base leading-tight mb-1 font-serif`}>
                        {item.title[language as any] || (item.content[language as any] ? item.content[language as any].substring(0, 60) + '...' : '')}
                      </h3>
                      <div className="flex items-center justify-end gap-1 mt-1 text-gold">
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          {item.type === 'video' ? 'Video' : item.type === 'audio' ? 'Audio' : 'Post'}
                        </span>
                        <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                      </div>
                    </div>
                    <ChevronLeft className={`w-5 h-5 ${theme === 'night' ? 'text-slate-400' : 'text-slate-500'}`} />
                  </motion.div>
                ))}

                {language === 'ku' && (
                  <div className="mt-8">
                    <TelegramChannelFeed 
                      theme={theme} 
                      language={language} 
                      channelId="abudawd7"
                      title="کەناڵی شێخ ئەبو داود حوسامی"
                    />
                  </div>
                )}
                {language === 'ar' && (
                  <div className="mt-8">
                    <TelegramChannelFeed 
                      theme={theme} 
                      language={language} 
                      channelId="hakeemelansar1"
                      title="قناة الشيخ أبو داود الحسامي"
                    />
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'home' && selectedSection === 'tahami' && (
            <motion.div
              key="tahami"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6 max-w-md mx-auto w-full pb-24"
            >
              <button 
                onClick={() => setSelectedSection(null)} 
                className="flex items-center gap-2 text-blue-500 bg-blue-500/10 px-4 py-2 rounded-full mb-8 hover:bg-blue-500/20 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
                <span className="font-medium text-sm">{t('back', language)}</span>
              </button>
              
              <div className="text-center mb-8">
                <div className="w-24 h-24 rounded-2xl bg-blue-500/20 flex items-center justify-center mx-auto mb-4 border border-blue-500/30 overflow-hidden shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                  <img 
                    src="https://drive.google.com/thumbnail?id=1mSBm7w9dMVxQFOnUDXe7l8kCL1Sk4E7z&sz=w1000" 
                    alt="الشيخ حسن التهامي" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-blue-500 mb-2">
                  {(TAHAMI_CONTENT as any).title[language as any] || (TAHAMI_CONTENT as any).title.ar}
                </h2>
              </div>

              {currentUser?.role === 'admin' && (
                <AdminPublisher sectionId="tahami" language={language} theme={theme} />
              )}

              {/* Featured Video */}
              {(() => {
                const allTahamiPosts = [
                  ...adminPosts.filter(p => p.sectionId === 'tahami' && (p.language === language || (!p.language && language !== 'en'))), 
                  ...(language === 'en' ? banners.filter(b => b.lang === 'en') : ((TAHAMI_CONTENT as any).items || []))
                ];
                if (allTahamiPosts.length === 0) return null;
                
                const featuredId = selectedTahamiPost || allTahamiPosts[0].id;
                const featuredPost = allTahamiPosts.find(item => item.id === featuredId) || allTahamiPosts[0];
                const otherPosts = allTahamiPosts.filter(item => item.id !== featuredPost.id);
                
                return (
                  <>
                    <div className={`block rounded-xl overflow-hidden border ${theme === 'night' ? 'bg-[#0b0e14] border-[#1f242d]' : 'bg-white border-stone-200'} shadow-lg mb-6`}>
                      <div className="relative w-full bg-black aspect-video">
                        {featuredPost.videoUrl ? (
                          featuredPost.videoUrl.includes('youtube.com') || featuredPost.videoUrl.includes('youtu.be') ? (
                            <iframe
                              src={getYouTubeEmbedUrl(featuredPost.videoUrl) + (featuredPost.videoUrl.includes('?') ? '&' : '?') + 'autoplay=1&playsinline=1'}
                              title={featuredPost.title?.[language as any] || featuredPost.title?.ar}
                              className="absolute top-0 left-0 w-full h-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          ) : (
                            <video src={featuredPost.videoUrl} controls autoPlay className="w-full h-full" />
                          )
                        ) : featuredPost.imageUrl ? (
                          <img 
                            src={featuredPost.imageUrl} 
                            alt="Post" 
                            className="w-full h-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FileText className="w-16 h-16 text-blue-400 opacity-20" />
                          </div>
                        )}
                      </div>
                      <div className="p-4 text-right">
                        <h3 className={`font-bold text-lg mb-2 ${theme === 'night' ? 'text-white' : 'text-black'}`} dir="auto">
                          {featuredPost.title ? featuredPost.title[language as any] || featuredPost.title.ar : (language === 'ar' ? 'محتوى الشيخ' : language === 'en' ? 'Sheikh Content' : 'ناوەڕۆکی شێخ')}
                        </h3>
                        <p className="text-sm text-slate-500">{featuredPost.author ? featuredPost.author[language as any] || featuredPost.author.ar : ''}</p>
                        {featuredPost.content && featuredPost.content[language as any] && (
                          <div className={`mt-2 text-sm ${theme === 'night' ? 'text-slate-400' : 'text-slate-600'}`}>
                            {renderContent(featuredPost.content[language as any], featuredPost.isHtml)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Other Videos Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      {otherPosts.map((item) => (
                        <div
                          key={item.id}
                          className={`block rounded-xl overflow-hidden border ${theme === 'night' ? 'bg-[#0b0e14] border-[#1f242d]' : 'bg-white border-stone-200'} cursor-pointer transition-transform hover:scale-[1.02]`}
                          onClick={() => {
                            setSelectedTahamiPost(item.id);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                        >
                          <div className="relative aspect-video w-full bg-blue-500/10 flex items-center justify-center">
                            {item.imageUrl ? (
                              <img 
                                src={item.imageUrl} 
                                alt="Post" 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : item.videoUrl ? (
                              <Video className="w-8 h-8 text-blue-400" />
                            ) : item.audioUrl ? (
                              <Music className="w-8 h-8 text-blue-400" />
                            ) : (
                              <FileText className="w-8 h-8 text-blue-400" />
                            )}
                            {item.videoUrl && (
                              <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/10 transition-colors">
                                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                                  <Play className="w-4 h-4 text-white fill-current ml-0.5" />
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="p-2 text-right">
                            <h3 className={`font-bold text-[11px] mb-1 line-clamp-2 ${theme === 'night' ? 'text-white' : 'text-black'}`} dir="auto">
                              {item.title ? item.title[language as any] || item.title.ar : (item.content && item.content[language as any] ? item.content[language as any].substring(0, 60) + '...' : (language === 'ar' ? 'محتوى جديد' : language === 'en' ? 'New Content' : 'ناوەڕۆکی نوێ'))}
                            </h3>
                            <div className="flex items-center justify-end gap-1 mt-1 text-blue-400">
                              <span className="text-[9px] font-bold uppercase tracking-wider">
                                {item.type === 'video' || item.videoUrl ? 'Video' : item.type === 'audio' || item.audioUrl ? 'Audio' : 'Post'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </motion.div>
          )}



          {activeTab === 'home' && selectedSection === 'ansar_groups' && (
            <motion.div
              key="ansar_groups"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-md mx-auto w-full"
            >
              <AnsarGroups 
                theme={theme} 
                language={language} 
                onBackToHome={() => setSelectedSection(null)} 
              />
            </motion.div>
          )}

          {activeTab === 'community' && (
            <motion.div
              key="community-section"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full w-full pb-[60px]"
            >
              <Community language={language} theme={theme} currentUser={currentUser} />
            </motion.div>
          )}

          {activeTab === 'home' && selectedSection === 'mektabey_bzotnawa' && (
            <motion.div
              key="mektabey_bzotnawa"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-6 max-w-md mx-auto w-full pb-24"
            >
              <button 
                onClick={() => setSelectedSection(null)} 
                className="flex items-center gap-2 text-gold bg-olive/10 px-4 py-2 rounded-full mb-8 hover:bg-olive/20 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
                <span className="font-medium text-sm">{t('back', language)}</span>
              </button>

              {currentUser?.role === 'admin' && (
                <AdminPublisher sectionId="library" language={language} theme={theme} />
              )}

              <MektabeyBzotnawa 
                language={language} 
                theme={theme} 
                onBack={() => {
                  setSelectedSection(null);
                  setSelectedLibraryBookId(null);
                }}
                initialBookId={selectedLibraryBookId || undefined}
              />
            </motion.div>
          )}

          {activeTab === 'home' && selectedSection === 'tahami_speeches' && (
            <motion.div
              key="tahami_speeches"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-6 max-w-md mx-auto w-full pb-24"
            >
              <button 
                onClick={() => setSelectedSection(null)} 
                className="flex items-center gap-2 text-gold bg-olive/10 px-4 py-2 rounded-full mb-8 hover:bg-olive/20 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
                <span className="font-medium text-sm">{t('back', language)}</span>
              </button>
              
              <div className="text-center mb-8">
                <div className="w-24 h-24 rounded-2xl bg-white flex items-center justify-center mx-auto mb-4 border border-olive/30 overflow-hidden shadow-[0_0_30px_rgba(105,74,32,0.2)]">
                  <img 
                    src="https://lh3.googleusercontent.com/d/1KYOrdnT3HJgJzlfm9CA2P_Fqc4WzJ-gP" 
                    alt="Sheikh Hassan Tahami Speeches" 
                    className="w-full h-full object-contain p-1"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-olive to-gold mb-2 font-serif">
                  {t('speeches', language)}
                </h2>
              </div>

              <div className="aspect-video rounded-2xl overflow-hidden mb-6 border border-olive/20 shadow-xl">
                <iframe
                  src="https://www.youtube.com/embed/sHZ4SncihPc"
                  title="Sheikh Hassan Tahami Speeches"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </motion.div>
          )}

          {activeTab === 'home' && selectedSection === 'warplan' && (
            <motion.div
              key="warplan"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-6 max-w-md mx-auto w-full pb-24"
            >
              <button 
                onClick={() => setSelectedSection(null)} 
                className="flex items-center gap-2 text-gold bg-olive/10 px-4 py-2 rounded-full mb-8 hover:bg-olive/20 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
                <span className="font-medium text-sm">{t('back', language)}</span>
              </button>
              
              <h2 className="text-2xl font-bold text-gold mb-6 text-center">
                {t('warplan', language)}
              </h2>

              {currentUser?.role === 'admin' && (
                <AdminPublisher sectionId="warplan" language={language} theme={theme} />
              )}

              {/* Admin Posts for Warplan */}
              <div className="space-y-4 mb-10">
                {adminPosts.filter(p => p.sectionId === 'warplan' && (p.language === language || (!p.language && language !== 'en'))).map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`group relative flex flex-col w-full p-4 rounded-2xl border ${theme === 'night' ? 'border-white/10 bg-white/5' : 'border-stone-200/30 bg-white/40'} backdrop-blur-sm transition-all`}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-br from-olive to-gold shadow-lg shrink-0">
                        {item.type === 'video' ? <Video className="w-6 h-6 text-white" /> : item.type === 'audio' ? <Music className="w-6 h-6 text-white" /> : <FileText className="w-6 h-6 text-white" />}
                      </div>
                      <div className="flex-1 text-right">
                        <h5 className="text-gold font-bold text-sm mb-1">{item.title[language]}</h5>
                      </div>
                    </div>

                    <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-4 bg-black/20">
                      {item.videoUrl ? (
                        item.videoUrl.includes('youtube.com') || item.videoUrl.includes('youtu.be') ? (
                          <iframe
                            src={getYouTubeEmbedUrl(item.videoUrl)}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        ) : (
                          <video src={item.videoUrl} controls className="w-full h-full" />
                        )
                      ) : item.imageUrl ? (
                        <img 
                          src={item.imageUrl} 
                          alt="Post" 
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      ) : item.audioUrl ? (
                        <audio src={item.audioUrl} controls className="w-full px-4 py-8" />
                      ) : null}
                    </div>

                    {item.content?.[language] && (
                      <div className={`${theme === 'night' ? 'text-slate-300' : 'text-stone-600'} text-sm leading-relaxed text-right`}>
                        {renderContent(item.content[language], item.isHtml)}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
              
              <div className="aspect-video rounded-2xl overflow-hidden mb-6 border border-olive/20 shadow-xl">
                <iframe
                  src="https://www.youtube.com/embed/b116ylKMYBo"
                  title="War between Rome and Persia"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </motion.div>
          )}

          {activeTab === 'home' && selectedSection === 'quran_audio' && (
            <div className="p-4">
              <QuranAudio theme={theme} />
            </div>
          )}
          {activeTab === 'home' && selectedSection && selectedSection !== 'quran' && selectedSection !== 'quran_audio' && selectedSection !== 'methodology' && selectedSection !== 'fatwas' && selectedSection !== 'tahami' && selectedSection !== 'warplan' && (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-6 max-w-md mx-auto w-full h-full flex flex-col items-center justify-center min-h-[60vh]"
            >
              <button 
                onClick={() => setSelectedSection(null)} 
                className="absolute top-6 right-6 flex items-center gap-2 text-gold bg-olive/10 px-4 py-2 rounded-full hover:bg-olive/20 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
                <span className="font-medium text-sm">{t('back', language)}</span>
              </button>
              
              {(() => {
                const currentSection = SECTIONS.find(s => s.id === selectedSection);
                return (
                  <>
                    <div className="w-24 h-24 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 overflow-hidden shadow-lg">
                      {currentSection?.imageUrl ? (
                        <img 
                          src={currentSection.imageUrl} 
                          alt={(currentSection as any)[language as any] || (currentSection as any).ar} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : currentSection?.icon ? (
                        <currentSection.icon className="w-10 h-10 text-slate-500" />
                      ) : (
                        <BookOpen className="w-10 h-10 text-slate-500" />
                      )}
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2 text-center">
                      {currentSection ? (currentSection as any)[language as any] || (currentSection as any).ar : t('loading', language)}
                    </h2>
                  </>
                );
              })()}
              <p className="text-slate-400 text-center mt-2">
                {t('underDevelopment', language)}
              </p>
            </motion.div>
          )}

          {activeTab === 'prayer' && (
            <motion.div 
              key="prayer"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-4 max-w-4xl mx-auto w-full h-full min-h-[80vh]"
            >
              <PrayerTimes language={language} theme={theme} />
            </motion.div>
          )}

          {activeTab === 'ansar_mahdi' && (
            <motion.div
              key="ansar_mahdi"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full h-full"
            >
              <AnsarmahdiVideos theme={theme} language={language} appSettings={appSettings} currentUser={currentUser} />
            </motion.div>
          )}

          {activeTab === 'haramain' && (
            <motion.div
              key="haramain"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full h-full"
            >
              <HaramainLive theme={theme} language={language} appSettings={appSettings} />
            </motion.div>
          )}

          {activeTab === 'research' && (
            <motion.div 
              key="research"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="p-6 max-w-md mx-auto w-full"
            >
              <h2 className="text-2xl font-bold text-stone-800 mb-6 pt-4">
                {t('researchRoom', language)}
              </h2>
              <div className="relative mb-8">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <input 
                  type="text" 
                  placeholder={t('searchArchive', language)}
                  className="w-full bg-white/20 backdrop-blur-sm border border-stone-200/30 rounded-2xl py-4 pr-12 pl-4 text-stone-900 placeholder:text-stone-500 focus:outline-none focus:border-olive/50 focus:ring-1 focus:ring-olive/50 transition-all"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={`aspect-square rounded-2xl border ${theme === 'night' ? 'border-white/10 bg-white/5' : 'border-stone-200/30 bg-white/20'} p-4 flex flex-col justify-end relative overflow-hidden group shadow-sm`}>
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900/40 to-transparent z-10" />
                    <img 
                      src={`https://images.unsplash.com/photo-1585036156171-384164a8c675?q=80&w=400&auto=format&fit=crop&sig=${i}`} 
                      alt="Archive" 
                      className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="relative z-20">
                      <span className="text-xs text-gold font-bold tracking-wider mb-1 block">
                        {t('archive', language)} {i}
                      </span>
                      <h3 className="text-white font-medium text-sm">
                        {t('historicalDocument', language)}
                      </h3>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'pdfLibrary' && (
            <motion.div
              key="pdfLibrary"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full h-full"
            >
              <PdfLibrary theme={theme} language={language} currentUser={currentUser} appSettings={appSettings} />
            </motion.div>
          )}

          {activeTab === 'admin' && currentUser && (
            <motion.div key="admin" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
              <AdminSettings language={language} appSettings={appSettings} setAppSettings={setAppSettings} currentUser={currentUser} setCurrentUser={setCurrentUser} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Admin Post Detail View Modal */}
      <AnimatePresence>
        {selectedAdminPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] border ${theme === 'night' ? 'bg-stone-900 border-white/10' : 'bg-white border-stone-200'} shadow-2xl p-6 md:p-8`}
            >
              <button 
                onClick={() => setSelectedAdminPost(null)}
                className={`absolute top-6 left-6 p-2 rounded-full transition-colors ${theme === 'night' ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-stone-100 text-stone-900 hover:bg-stone-200'}`}
              >
                <X className="w-6 h-6" />
              </button>

              <div className="mt-8 text-right">
                <h2 className={`text-2xl font-bold mb-4 font-serif ${theme === 'night' ? 'text-gold' : 'text-stone-900'}`}>
                  {selectedAdminPost.title[language]}
                </h2>
                
                <div className="flex items-center justify-end gap-3 mb-8 text-sm text-slate-400">
                  <span>{selectedAdminPost.author?.[language] || t('admin', language)}</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                  <span dir="ltr">{selectedAdminPost.createdAt ? new Date(selectedAdminPost.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'ku-IQ') : ''}</span>
                </div>

                <div className="w-full rounded-2xl overflow-hidden mb-8 bg-black/20 shadow-xl">
                  {selectedAdminPost.videoUrl ? (
                    selectedAdminPost.videoUrl.includes('youtube.com') || selectedAdminPost.videoUrl.includes('youtu.be') ? (
                      <div className="aspect-video">
                        <iframe
                          src={getYouTubeEmbedUrl(selectedAdminPost.videoUrl)}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <video src={selectedAdminPost.videoUrl} controls className="w-full" />
                    )
                  ) : selectedAdminPost.imageUrl ? (
                    <img 
                      src={selectedAdminPost.imageUrl} 
                      alt="Post" 
                      className="w-full h-auto max-h-[60vh] object-contain mx-auto"
                      referrerPolicy="no-referrer"
                    />
                  ) : selectedAdminPost.audioUrl ? (
                    <audio src={selectedAdminPost.audioUrl} controls className="w-full px-4 py-8" />
                  ) : null}
                </div>

                {selectedAdminPost.content?.[language] && (
                  <div className={`text-lg leading-relaxed font-serif text-right ${theme === 'night' ? 'text-stone-300' : 'text-stone-700'}`}>
                    {renderContent(selectedAdminPost.content[language], selectedAdminPost.isHtml)}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 right-0 w-full z-50 p-4 pb-6 bg-gradient-to-t from-transparent via-transparent to-transparent pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto">
          <div className={`flex justify-around items-center h-[60px] ${theme === 'night' ? 'bg-black/40 border-white/10' : 'bg-white/40 border-stone-200'} backdrop-blur-md border rounded-3xl p-2 shadow-xl shadow-stone-900/5`}>
            {[
              { id: 'home', icon: Home, label: 'home' },
              { id: 'ansar_mahdi', icon: Youtube, label: 'ansar_mahdi' },
              { id: 'library', icon: Library, label: 'library' },
              { id: 'pdfLibrary', icon: FileText, label: 'pdfLibrary' },
              { id: 'haramain', icon: Tv, label: 'haramain' },
              { id: 'prayer', icon: Clock, label: 'prayer' },
              { id: 'community', icon: Globe, label: 'community' },
              { id: 'research', icon: Search, label: 'search' },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSelectedSection(null);
                    setSelectedAdminPost(null);
                    setSelectedMahdiPost(null);
                    setSelectedSurah(null);
                    setSelectedTafsir(null);
                    setSelectedTafsirSurah(null);
                  }}
                  className="relative flex-1 flex flex-col items-center justify-center py-2 rounded-2xl transition-colors"
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className={`absolute inset-0 ${theme === 'night' ? 'bg-olive/10' : 'bg-olive/10'} rounded-2xl`}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <tab.icon className={`w-6 h-6 mb-1 relative z-10 transition-colors duration-300 ${isActive ? 'text-gold' : 'text-stone-400'}`} />
                  <span className={`text-[11px] font-medium relative z-10 transition-colors duration-300 ${isActive ? 'text-gold' : 'text-stone-400'}`}>
                    {t(tab.label, language)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
