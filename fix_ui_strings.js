import fs from 'fs';

const filePath = 'src/App.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Fix corrupted UI_STRINGS
// We'll replace the whole UI_STRINGS block to be safe.
const startMarker = 'const UI_STRINGS: Record<string, Record<string, string>> = {';
const endMarker = 'const t = (key: string, lang: string) => {';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  const newUIStrings = `const UI_STRINGS: Record<string, Record<string, string>> = {
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
  searchArchive: { ar: 'ابحث في الأرشيف، الفتاوى...', ku: 'گەڕان لە ئەرشیڤ، فەتوایەکان...', en: 'Search archive, fatwas...', ps: 'په آرشیف، فتواګانو کې لټون وکړئ...', fa: 'جستجو در آرشیو, فتاوا...', tr: 'Arşivde, fetvalarda ara...', fr: 'Rechercher dans les archives, fatwas...', in: 'Cari arsip, fatwa...', es: 'Buscar en archivos, fatwas...', ru: 'Поиск в архиве...', uz: 'Arxivdan qidirish...' },
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
  }
};
`;
  content = content.substring(0, startIndex) + newUIStrings + content.substring(endIndex);
  fs.writeFileSync(filePath, content);
  console.log('Successfully fixed UI_STRINGS');
} else {
  console.error('Could not find UI_STRINGS markers');
}
