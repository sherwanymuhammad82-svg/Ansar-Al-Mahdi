import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChevronRight, ChevronLeft, Book, Search, Loader2, Quote } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { safeFetch } from '../utils/fetchUtils';

interface ApocalypseLibraryProps {
  language: 'ar' | 'ku' | 'en';
  theme: 'night' | 'white' | 'cream';
  onBack: () => void;
}

interface Book {
  id: string;
  title_ar: string;
  title_ku: string;
  title_en?: string;
  description_ar: string;
  description_ku: string;
  description_en?: string;
  file: string;
}

const APOCALYPSE_BOOKS: Book[] = [
  { id: '1', title_ar: "آراء محمد رشيد رضا العقائدية في أشراط الساعة الكبرى وآثارها الفكرية", title_ku: "بۆچوونە ئایدیۆلۆژییەکانی محەمەد ڕەشید ڕیدا سەبارەت بە نیشانە سەرەکییەکانی قیامەت و کاریگەرییە فیکرییەکانیان", description_ar: "كتاب في الفتن وأشراط الساعة", description_ku: "بۆچوونە ئایدیۆلۆژییەکانی محەمەد ڕەشید ڕیدا سەبارەت بە نیشانە سەرەکییەکانی قیامەت و کاریگەرییە فیکرییەکانیان", file: "آراء محمد رشيد رضا العقائدية في أشراط الساعة الكبرى وآثارها الفكرية.json" },
  { id: '2', title_ar: "أحاديث في الفتن والحوادث ط القاسم", title_ku: "فەرموودەکان لەسەر وەسوەسە و ڕووداوەکان، چاپی القاسم", description_ar: "كتاب في الفتن وأشراط الساعة", description_ku: "فەرموودە لەسەر وەسوەسە و ڕووداوەکان، چاپی القاسم", file: "أحاديث في الفتن والحوادث ط القاسم.json" },
  { id: '3', title_ar: "أحاديث في الفتن والحوادث (مطبوع ضمن مؤلفات الشيخ محمد بن عبدالوهاب، الجزء الحادي عشر)", title_ku: "فەرموودە لەسەر فیتنە و ڕووداوەکان (لە نێو بەرهەمەکانی شێخ محمد بن عبدالوەهاب چاپکراوە بەشی یازدە)", description_ar: "كتاب في الفتن وأشراط الساعة", description_ku: "فەرموودە لەسەر فیتنە و ڕووداوەکان (لە نێو بەرهەمەکانی شێخ محمد بن عبدالوەهاب چاپکراوە بەشی یازدە)", file: "أحاديث في الفتن والحوادث مطبوع ضمن مؤلفات الشيخ محمد بن عبدالوهاب الجزء الحادي عشر.json" },
  { id: '4', title_ar: "أشراط الساعة الكبرى - المغامسي", title_ku: "نیشانەکانی قیامەتی گەورە - مەغامسی", description_ar: "كتاب في الفتن وأشراط الساعة", description_ku: "نیشانەکانی قیامەتی گەورە - مەغامسی", file: "أشراط الساعة الكبرى - المغامسي.json" },
  { id: '5', title_ar: "أشراط الساعة وذهاب الأخيار وبقاء الأشرار لعبد الملك بن حبيب", title_ku: "نیشانەکانی قیامەت و ڕۆیشتنی خەڵکی چاک و مانەوەی خەڵکی خراپ لەلایەن عەبد الملک بن حەبیبەوە", description_ar: "كتاب في الفتن وأشراط الساعة", description_ku: "نیشانەکانی قیامەت و ڕۆیشتنی خەڵکی چاک و مانەوەی خەڵکی خراپ لەلایەن عەبد الملک بن حەبیبەوە", file: "أشراط الساعة وذهاب الأخيار وبقاء الأشرار لعبد الملك بن حبيب.json" },
  { id: '6', title_ar: "أشراط الساعة", title_ku: "نیشانەکانی قیامەت", description_ar: "كتاب في الفتن وأشراط الساعة", description_ku: "نیشانەکانی قیامەت", file: "أشراط الساعة.json" },
  { id: '7', title_ar: "إتحاف الجماعة بما جاء في الفتن والملاحم وأشراط الساعة", title_ku: "یەکخستنی گروپەکە بەو شتانەی کە لە وەسوەسە و داستان و نیشانەکانی قیامەتدا باسکراون", description_ar: "كتاب في الفتن وأشراط الساعة", description_ku: "یەکخستنی گروپەکە بەو شتانەی کە لە وەسوەسە و داستان و نیشانەکانی قیامەتدا باسکراون", file: "إتحاف الجماعة بما جاء في الفتن والملاحم وأشراط الساعة.json" },
  { id: '8', title_ar: "الإشاعة لأشراط الساعة", title_ku: "دەنگۆ نیشانەکانی قیامەتە", description_ar: "كتاب في الفتن وأشراط الساعة", description_ku: "دەنگۆ نیشانەکانی قیامەتە", file: "الإشاعة لأشراط الساعة.json" },
  { id: '9', title_ar: "الاعتصام بالكتاب والسنة أصل السعادة في الدنيا والآخرة ونجاة من مضلات الفتن", title_ku: "دەستگرتن بە قورئان و سوننەت بنەمای بەختەوەری دونیا و قیامەت و ڕزگاربوونە لە گومڕاکردنی وەسوەسە", description_ar: "كتاب في الفتن وأشراط الساعة", description_ku: "دەستگرتن بە قورئان و سوننەت بنەمای بەختەوەری دونیا و قیامەت و ڕزگاربوونە لە گومڕاکردنی وەسوەسە", file: "الاعتصام بالكتاب والسنة أصل السعادة في الدنيا والآخرة ونجاة من مضلات الفتن.json" },
  { id: '10', title_ar: "البداية والنهاية ط إحياء التراث", title_ku: "سەرەتا و کۆتایی: زیندووکردنەوەی میرات", description_ar: "كتاب في الفتن وأشراط الساعة", description_ku: "سەرەتا و کۆتایی: زیندووکردنەوەی میرات", file: "البداية والنهاية ط إحياء التراث.json" },
  { id: '11', title_ar: "البداية والنهاية ط الفكر", title_ku: "سەرەتا و کۆتایی بیرم کردەوە", description_ar: "كتاب في الفتن وأشراط الساعة", description_ku: "سەرەتا و کۆتایی بیرم کردەوە", file: "البداية والنهاية ط الفكر.json" },
  { id: '12', title_ar: "البداية والنهاية ط هجر", title_ku: "سەرەتا و کۆتایی وازهێنانن", description_ar: "كتاب في الفتن وأشراط الساعة", description_ku: "سەرەتا و کۆتایی وازهێنانن", file: "البداية والنهاية ط هجر.json" },
  { id: '13', title_ar: "السنن الواردة في الفتن للداني", title_ku: "ئەو سوننەتانەی لە وەسوەسەدا هاتووە بۆ نزیکەکانن", description_ar: "كتاب في الفتن وأشراط الساعة", description_ku: "ئەو سوننەتانەی لە وەسوەسەدا هاتووە بۆ نزیکەکانن", file: "السنن الواردة في الفتن للداني.json" },
  { id: '14', title_ar: "الشعر في خراسان من الفتح إلى نهاية العصر الأموي", title_ku: "شیعر لە خوراسان لە فەتحەوە تا کۆتایی سەردەمی ئومەوی", description_ar: "كتاب في الفتن وأشراط الساعة", description_ku: "شیعر لە خوراسان لە فەتحەوە تا کۆتایی سەردەمی ئومەوی", file: "الشعر في خراسان من الفتح إلى نهاية العصر الأموي.json" },
  { id: '15', title_ar: "العراق في أحاديث وآثار الفتن", title_ku: "عێراق لە فەرموودە و کاریگەرییەکانی فیتنەدا", description_ar: "كتاب في الفتن وأشراط الساعة", description_ku: "عێراق لە فەرموودە و کاریگەرییەکانی فیتنەدا", file: "العراق في أحاديث وآثار الفتن.json" },
  { id: '16', title_ar: "الغاية في اختصار النهاية", title_ku: "ئامانج کورتکردنەوەی کۆتاییەکەیە", description_ar: "كتاب في الفتن وأشراط الساعة", description_ku: "ئامانج کورتکردنەوەی کۆتاییەکەیە", file: "الغاية في اختصار النهاية.json" },
  { id: '17', title_ar: "الفتن لحنبل بن إسحاق", title_ku: "دادگاییکردنەکان لەلایەن حەنبەل بن ئیسحاقەوە", description_ar: "كتاب في الفتن وأشراط الساعة", description_ku: "دادگاییکردنەکان لەلایەن حەنبەل بن ئیسحاقەوە", file: "الفتن لحنبل بن إسحاق.json" },
  { id: '18', title_ar: "الفتن لنعيم بن حماد", title_ku: "دادگاییکردنەکان لەلایەن نەعیم بن حەمەد", description_ar: "كتاب في الفتن وأشراط الساعة", description_ku: "دادگاییکردنەکان لەلایەن نەعیم بن حەمەد", file: "الفتن لنعيم بن حماد.json" },
  { id: '19', title_ar: "الفتنة ووقعة الجمل", title_ku: "فیتنە و کەوتنی حوشتر", description_ar: "كتاب في الفتن وأشراط الساعة", description_ku: "فیتنە و کەوتنی حوشتر", file: "الفتنة ووقعة الجمل.json" },
  { id: '20', title_ar: "القناعة في ما يحسن الإحاطة من أشراط الساعة", title_ku: "ڕازیبوون لەوەی کە هۆشیاری لە نیشانەکانی قیامەت باشتر دەکات", description_ar: "كتاب في الفتن وأشراط الساعة", description_ku: "ڕازیبوون لەوەی کە هۆشیاری لە نیشانەکانی قیامەت باشتر دەکات", file: "القناعة في ما يحسن الإحاطة من أشراط الساعة.json" },
  { id: '21', title_ar: "القيامة الصغرى", title_ku: "زیندووبوونەوەی بچووک", description_ar: "كتاب في الفتن وأشراط الساعة", description_ku: "زیندووبوونەوەی بچووک", file: "القيامة الصغرى.json" },
  { id: '22', title_ar: "القيامة الكبرى", title_ku: "زیندووبوونەوەی گەورە", description_ar: "كتاب في الفتن وأشراط الساعة", description_ku: "زیندووبوونەوەی گەورە", file: "القيامة الكبرى.json" },
  { id: '23', title_ar: "المدائح النبوية حتى نهاية العصر الملوكي", title_ku: "ستایشی پێغەمبەرانە تا کۆتایی سەردەمی پاشایەتی", description_ar: "كتاب في الفتن وأشراط الساعة", description_ku: "ستایشی پێغەمبەرانە تا کۆتایی سەردەمی پاشایەتی", file: "المدائح النبوية حتى نهاية العصر الملوكي.json" },
  { id: '24', title_ar: "الموازنة بين «الفائق» للزمخشري (ت 538 هـ) و «النهاية» لابن الأثير (ت 606 هـ)", title_ku: "هاوسەنگی نێوان “الفائق” لە نووسینی الزەماخشاری (کۆچی دوایی ٥٣٨ کۆچی) و “النهایە” لە نووسینی ئیبن الثیر (کۆچی دوایی ٦٠٦ کۆچی)", description_ar: "كتاب في الفتن وأشراط الساعة", description_ku: "هاوسەنگی نێوان “الفائق” لە نووسینی الزەماخشاری (کۆچی دوایی ٥٣٨ کۆچی) و “النهایە” لە نووسینی ئیبن الثیر (کۆچی دوایی ٦٠٦ کۆچی)", file: "الموازنة بين الفائق للزمخشري ت 538 هـ و النهاية لابن الأثير ت 606 هـ.json" },
  { id: '25', title_ar: "النهاية في اتصال الرواية", title_ku: "کۆتاییەکەی لە پەیوەندی ڕۆمانەکەدایە", description_ar: "كتاب في الفتن وأشراط الساعة", description_ku: "کۆتاییەکەی لە پەیوەندی ڕۆمانەکەدایە", file: "النهاية في اتصال الرواية.json" },
  { id: '26', title_ar: "النهاية في الفتن والملاحم", title_ku: "کۆتایی لە ململانێ و داستانەکاندا", description_ar: "كتاب في الفتن وأشراط الساعة", description_ku: "کۆتایی لە ململانێ و داستانەکاندا", file: "النهاية في الفتن والملاحم.json" },
  { id: '27', title_ar: "النهاية في غريب الحديث والأثر", title_ku: "کۆتاییەکەی لە فەرموودە و کاریگەرییەکی سەیردایە", description_ar: "كتاب في الفتن وأشراط الساعة", description_ku: "کۆتاییەکەی لە فەرموودە و کاریگەرییەکی سەیردایە", file: "النهاية في غريب الحديث والأثر.json" },
  { id: '28', title_ar: "الهداية الى بلوغ النهاية", title_ku: "ڕێنمایی بۆ گەیشتن بە کۆتایی", description_ar: "كتاب في الفتن وأشراط الساعة", description_ku: "ڕێنمایی بۆ گەیشتن بە کۆتایی", file: "الهداية الى بلوغ النهاية.json" },
  { id: '29', title_ar: "بداية المجتهد ونهاية المقتصد", title_ku: "سەرەتای بەئەمەک و کۆتایی پارێزراو", description_ar: "كتاب في الفتن وأشراط الساعة", description_ku: "سەرەتای بەئەمەک و کۆتایی پارێزراو", file: "بداية المجتهد ونهاية المقتصد.json" },
  { id: '30', title_ar: "بديع النظام = نهاية الوصول إلى علم الأصول", title_ku: "بەدیع النزام = کۆتایی هاتنی دەستڕاگەیشتن بە زانستی بنەچە", description_ar: "كتاب في الفتن وأشراط الساعة", description_ku: "بەدیع النزام = کۆتایی هاتنی دەستڕاگەیشتن بە زانستی بنەچە", file: "بديع النظام  نهاية الوصول إلى علم الأصول.json" },
  { id: '31', title_ar: "بصائر في الفتن", title_ku: "تێڕوانینەکان بۆ وەسوەسە", description_ar: "كتاب في الفتن وأشراط الساعة", description_ku: "تێڕوانینەکان بۆ وەسوەسە", file: "بصائر في الفتن.json" },
  { id: '32', title_ar: "تأخير الظلامة إلى يوم القيامة للسيوطي - مخطوط (ن)", title_ku: "دواخستنی تاریکی تا قیامەت لەلایەن السویوتی - دەستنووس (ن)", description_ar: "كتاب في الفتن وأشراط الساعة", description_ku: "دواخستنی تاریکی تا قیامەت لەلایەن السویوتی - دەستنووس (ن)", file: "تأخير الظلامة إلى يوم القيامة للسيوطي - مخطوط ن.json" },
  { id: '33', title_ar: "تأخير الظلامة إلى يوم القيامة", title_ku: "دواخستنی تاریکی تا قیامەت", description_ar: "كتاب في الفتن وأشراط الساعة", description_ku: "دواخستنی تاریکی تا قیامەت", file: "تأخير الظلامة إلى يوم القيامة.json" },
  { id: '34', title_ar: "تدوين السنة النبوية نشأته وتطوره من القرن الأول إلى نهاية القرن التاسع الهجري", title_ku: "تۆمارکردنی سوننەتی پێغەمبەر، سەرچاوە و گەشەکردنی لە سەدەی یەکەمەوە تا کۆتایی سەدەی نۆی کۆچی", description_ar: "كتاب في الفتن وأشراط الساعة", description_ku: "تۆمارکردنی سوننەتی پێغەمبەر، سەرچاوە و گەشەکردنی لە سەدەی یەکەمەوە تا کۆتایی سەدەی نۆی کۆچی", file: "تدوين السنة النبوية نشأته وتطوره من القرن الأول إلى نهاية القرن التاسع الهجري.json" },
  { id: '35', title_ar: "تعريف بالأماكن الواردة في البداية والنهاية لابن كثير", title_ku: "پێشەکییەک بۆ ئەو شوێنانەی کە لە البیدایە و النهایەدا باسکراون لە لایەن ئیبن کاثیرەوە", description_ar: "كتاب في الفتن وأشراط الساعة", description_ku: "پێشەکییەک بۆ ئەو شوێنانەی کە لە البیدایە و النهایەدا باسکراون لە لایەن ئیبن کاثیرەوە", file: "تعريف بالأماكن الواردة في البداية والنهاية لابن كثير.json" },
  { id: '36', title_ar: "سمات المؤمنين في الفتن وتقلب الأحوال", title_ku: "سیفەتی باوەڕداران لە وەسوەسە و گۆڕانی بارودۆخەکان", description_ar: "كتاب في الفتن وأشراط الساعة", description_ku: "سیفەتی باوەڕداران لە وەسوەسە و گۆڕانی بارودۆخەکان", file: "سمات المؤمنين في الفتن وتقلب الأحوال.json" },
  { id: '37', title_ar: "شرح كتاب الفتن من صحيح البخاري - عبد الكريم الخضير", title_ku: "ڕوونکردنەوەی کتێبی وەسوەسە لە سەحیح البوخاری - عەبدولکەریم الخدایر", description_ar: "كتاب في الفتن وأشراط الساعة", description_ku: "ڕوونکردنەوەی کتێبی وەسوەسە لە سەحیح البوخاری - عەبدولکەریم الخدایر", file: "شرح كتاب الفتن من صحيح البخاري - عبد الكريم الخضير.json" },
  { id: '38', title_ar: "صحيح أشراط الساعة", title_ku: "نیشانە ڕاستەکانی قیامەت", description_ar: "كتاب في الفتن وأشراط الساعة", description_ku: "نیشانە ڕاستەکانی قیامەت", file: "صحيح أشراط الساعة.json" },
  { id: '39', title_ar: "علم الرجال نشأته وتطوره من القرن الأول إلى نهاية القرن التاسع", title_ku: "زانستی مرۆڤ لە سەدەی یەکەمەوە تا کۆتایی سەدەی نۆیەم سەری هەڵداوە و پەرەی سەندووە", description_ar: "كتاب في الفتن وأشراط الساعة", description_ku: "زانستی مرۆڤ لە سەدەی یەکەمەوە تا کۆتایی سەدەی نۆیەم سەری هەڵداوە و پەرەی سەندووە", file: "علم الرجال نشأته وتطوره من القرن الأول إلى نهاية القرن التاسع.json" },
  { id: '40', title_ar: "غاية النهاية في طبقات القراء", title_ku: "ئامانجی کۆتایی لای خوێنەران", description_ar: "كتاب في الفتن وأشراط الساعة", description_ku: "ئامانجی کۆتایی لای خوێنەران", file: "غاية النهاية في طبقات القراء.json" },
  { id: '41', title_ar: "فقه أشراط الساعة", title_ku: "فیقهی نیشانەکانی قیامەت", description_ar: "كتاب في الفتن وأشراط الساعة", description_ku: "فیقهی نیشانەکانی قیامەت", file: "فقه أشراط الساعة.json" },
  { id: '42', title_ar: "كشف المنن في علامات الساعة والملاحم والفتن", title_ku: "ئاشکراکردنی نیشانەکانی قیامەت و داستان و وەسوەسە", description_ar: "كتاب في الفتن وأشراط الساعة", description_ku: "ئاشکراکردنی نیشانەکانی قیامەت و داستان و وەسوەسە", file: "كشف المنن في علامات الساعة والملاحم والفتن.json" },
  { id: '43', title_ar: "كفاية المتحفظ ونهاية المتلفظ في اللغة العربية", title_ku: "بەسبوونی کۆنەپەرست و کۆتایی موتەسڵاق لە زمانی عەرەبیدا", description_ar: "كتاب في الفتن وأشراط الساعة", description_ku: "بەسبوونی کۆنەپەرست و کۆتایی موتسڵاق لە زمانی عەرەبیدا", file: "كفاية المتحفظ ونهاية المتلفظ في اللغة العربية.json" },
  { id: '44', title_ar: "مسائل حرب الكرماني من كتاب النكاح إلى نهاية الكتاب - ت فايز حابس", title_ku: "پرسەکانی شەڕی کرمانی لە کتێبی هاوسەرگیرییەوە تا کۆتایی کتێب - لە نووسینی فایز حەبیس", description_ar: "كتاب في الفتن وأشراط الساعة", description_ku: "پرسەکانی شەڕی کرمانی لە کتێبی هاوسەرگیرییەوە تا کۆتایی کتێب - لە نووسینی فایز حەبیس", file: "مسائل حرب الكرماني من كتاب النكاح إلى نهاية الكتاب - ت فايز حابس.json" },
  { id: '45', title_ar: "مسائل في الفتن", title_ku: "پرسەکان لە وەسوەسەدا", description_ar: "كتاب في الفتن وأشراط الساعة", description_ku: "پرسەکان لە وەسوەسەدا", file: "مسائل في الفتن.json" },
  { id: '46', title_ar: "منهج ابن الأثير الجزري في مصنفه النهاية في غريب الحديث والأثر", title_ku: "نزیکبوونەوەی ابن الأثير الجزاری لە کتێبی (النهایە فی غەریب الحدیث و العثر)دا", description_ar: "كتاب في الفتن وأشراط الساعة", description_ku: "نزیکبوونەوەی ابن الأثير الجزاری لە کتێبی (النهایە فی غەریب الحدیث و العثر)دا", file: "منهج ابن الأثير الجزري في مصنفه النهاية في غريب الحديث والأثر.json" },
  { id: '47', title_ar: "نهاية الأرب في فنون الأدب", title_ku: "کۆتایی هاتنی ڕۆشنبیری لە هونەرەکانی ئەدەبدا", description_ar: "كتاب في الفتن وأشراط الساعة", description_ku: "کۆتایی هاتنی ڕۆشنبیری لە هونەرەکانی ئەدەبدا", file: "نهاية الأرب في فنون الأدب.json" },
  { id: '48', title_ar: "نهاية الأرب في معرفة أنساب العرب", title_ku: "کۆتایی زانین لە ناسینی نەسەبی عەرەبدا", description_ar: "كتاب في الفتن وأشراط الساعة", description_ku: "کۆتایی زانین لە ناسینی نەسەبی عەرەبدا", file: "نهاية الأرب في معرفة أنساب العرب.json" },
  { id: '49', title_ar: "نهاية الإيجاز في سيرة ساكن الحجاز", title_ku: "کۆتایی پوختە لە ژیاننامەی دانیشتووی حیجاز", description_ar: "كتاب في الفتن وأشراط الساعة", description_ku: "کۆتایی پوختە لە ژیاننامەی دانیشتووی حیجاز", file: "نهاية الإيجاز في سيرة ساكن الحجاز.json" },
  { id: '50', title_ar: "نهاية الرتبة الظريفة في طلب الحسبة الشريفة", title_ku: "کۆتایی هاتنی پلە خۆشەکە لە داواکاری هیسبەی شەرەف", description_ar: "كتاب في الفتن وأشراط الساعة", description_ku: "کۆتایی هاتنی پلە خۆشەکە لە داواکاری هیسبەی شەرەف", file: "نهاية الرتبة الظريفة في طلب الحسبة الشريفة.json" },
  { id: '51', title_ar: "نهاية الرتبة في طلب الحسبة لابن بسام", title_ku: "کۆتایی پلە لە داوای حسبە لەلایەن ئیبن بەسامەوە", description_ar: "كتاب في الفتن وأشراط الساعة", description_ku: "کۆتایی پلە لە داوای حسبە لەلایەن ئیبن بەسامەوە", file: "نهاية الرتبة في طلب الحسبة لابن بسام.json" },
  { id: '52', title_ar: "نهاية الزين", title_ku: "کۆتایی زین", description_ar: "كتاب في الفتن وأشراط الساعة", description_ku: "کۆتایی زین", file: "نهاية الزين.json" },
  { id: '53', title_ar: "نهاية السول شرح منهاج الوصول", title_ku: "کۆتایی چارەسەرەکە ڕوونکردنەوەی پلاتفۆرمی دەستڕاگەیشتن", description_ar: "كتاب في الفتن وأشراط الساعة", description_ku: "کۆتایی چارەسەرەکە ڕوونکردنەوەی پلاتفۆرمی دەستڕاگەیشتن", file: "نهاية السول شرح منهاج الوصول.json" },
  { id: '54', title_ar: "نهاية المحتاج إلى شرح المنهاج", title_ku: "کۆتایی هاتنی پێویستی ڕوونکردنەوەی پرۆگرامی خوێندن", description_ar: "كتاب في الفتن وأشراط الساعة", description_ku: "کۆتایی هاتنی پێویستی ڕوونکردنەوەی پرۆگرامی خوێندن", file: "نهاية المحتاج إلى شرح المنهاج.json" },
  { id: '55', title_ar: "نهاية المراد من كلام خير العباد", title_ku: "کۆتایی ئەو شتەی کە مەبەست لە قسەی باشترین بەندە", description_ar: "كتاب في الفتن وأشراط الساعة", description_ku: "کۆتایی ئەو شتەی کە مەبەست لە قسەی باشترین بەندە", file: "نهاية المراد من كلام خير العباد.json" },
  { id: '56', title_ar: "نهاية المطلب في دراية المذهب", title_ku: "کۆتایی هاتنی داواکاری بۆ زانینی عەقیدەکە", description_ar: "كتاب في الفتن وأشراط الساعة", description_ku: "کۆتایی هاتنی داواکاری بۆ زانینی عەقیدەکە", file: "نهاية المطلب في دراية المذهب.json" },
  { id: '57', title_ar: "نهاية الوصول في دراية الأصول", title_ku: "کۆتایی هاتنی دەستڕاگەیشتن بە دێرایە العسول", description_ar: "كتاب في الفتن وأشراط الساعة", description_ku: "کۆتایی هاتنی دەستڕاگەیشتن بە دێرایە العسول", file: "نهاية الوصول في دراية الأصول.json" }
];

export function ApocalypseLibrary({ language, theme, onBack }: ApocalypseLibraryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [bookContent, setBookContent] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [translations, setTranslations] = useState<{ [key: number]: string }>({});
  const [isTranslating, setIsTranslating] = useState(false);

  const translatePage = async (text: string) => {
    if (translations[currentPage]) return;
    
    setIsTranslating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const targetLang = language === 'en' ? 'English' : 'Kurdish (Sorani)';
      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: `Translate this text from an Islamic book to ${targetLang}. Only provide the translation, no other text or explanation:\n\n` + text,
      });
      setTranslations(prev => ({ ...prev, [currentPage]: response.text || 'Error translating' }));
    } catch (error) {
      console.error(error);
      alert(language === 'ku' ? 'هەڵەیەک ڕوویدا لە وەرگێڕاندا' : 'An error occurred during translation');
      setTranslations(prev => ({ ...prev, [currentPage]: language === 'en' ? 'An error occurred during translation' : 'هەڵەیەک ڕوویدا لە وەرگێڕاندا' }));
    } finally {
      setIsTranslating(false);
    }
  };

  useEffect(() => {
    setTranslations({});
  }, [selectedBook]);

  const filteredBooks = APOCALYPSE_BOOKS.filter(book => {
    const searchLower = searchTerm.toLowerCase();
    return (
      book.title_ar.toLowerCase().includes(searchLower) ||
      book.title_ku.toLowerCase().includes(searchLower) ||
      book.description_ar.toLowerCase().includes(searchLower) ||
      book.description_ku.toLowerCase().includes(searchLower)
    );
  });

  const loadBook = async (book: Book) => {
    setLoading(true);
    setError(null);
    try {
      // In a real app, this would fetch from a server or local storage
      // For this demo, we'll simulate loading since we can't easily read the unzipped files directly in the browser without a server endpoint
      // We will try to fetch it if it's placed in the public folder, otherwise show a placeholder
      const data: any = await safeFetch(`/apocalypse_books/${book.file}`);
      if (data) {
        if (data.contents) {
          data.pages = data.contents;
        }
        setBookContent(data);
      } else {
        // Fallback placeholder if file not found
        setBookContent({
          title: book.title_ar,
          pages: [
            { text: 'محتوى الكتاب غير متوفر حالياً. يرجى التأكد من نقل الملفات إلى المجلد الصحيح.' },
            { text: 'Content not available. Please ensure files are in the correct directory.' }
          ]
        });
      }
    } catch (err) {
      console.error('Error loading book:', err);
      setError(language === 'ar' ? 'حدث خطأ أثناء تحميل الكتاب' : language === 'en' ? 'An error occurred while loading the book' : 'هەڵەیەک ڕوویدا لە کاتی بارکردنی کتێبەکە');
      // Fallback
      setBookContent({
        title: book.title_ar,
        pages: [
          { text: 'محتوى الكتاب غير متوفر حالياً.' }
        ]
      });
    } finally {
      setLoading(false);
      setSelectedBook(book);
      setCurrentPage(0);
    }
  };

  if (selectedBook && bookContent) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="p-6 max-w-2xl mx-auto w-full pb-24"
      >
        <button 
          onClick={() => {
            setSelectedBook(null);
            setBookContent(null);
          }}
          className={`flex items-center gap-2 mb-6 px-4 py-2 rounded-full transition-colors ${theme === 'night' ? 'text-gold bg-stone-800 hover:bg-stone-700' : 'text-olive bg-olive/10 hover:bg-olive/20'}`}
        >
          {language === 'ar' ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          <span className="font-medium text-sm">{language === 'ar' ? 'رجوع' : language === 'en' ? 'Back' : 'گەڕانەوە'}</span>
        </button>

        <div className={`p-8 rounded-2xl shadow-sm border ${theme === 'night' ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'}`}>
          <h2 className={`text-2xl font-bold mb-6 text-center font-naskh ${theme === 'night' ? 'text-gold' : 'text-olive'}`}>
            {language === 'ar' ? selectedBook.title_ar : language === 'en' ? selectedBook.title_en || selectedBook.title_ar : selectedBook.title_ku}
          </h2>
          
          <div className={`prose max-w-none text-right font-naskh leading-loose text-lg ${theme === 'night' ? 'text-stone-300' : 'text-stone-800'}`}>
            {bookContent.pages && bookContent.pages[currentPage] ? (
              <>
                <div dangerouslySetInnerHTML={{ __html: bookContent.pages[currentPage].text || bookContent.pages[currentPage] }} />
                
                {(language === 'ku' || language === 'en') && (
                  <div className="mt-8 pt-8 border-t border-stone-200/20 text-right">
                    {translations[currentPage] ? (
                      <div className="bg-gold/5 p-6 rounded-2xl border border-gold/20">
                        <p className="text-sm font-bold text-gold mb-4 flex items-center gap-2">
                          <Quote className="w-4 h-4" />
                          {language === 'en' ? 'English Translation (AI):' : 'وەرگێڕانی کوردی (بە زیرەکی دەستکرد):'}
                        </p>
                        <div className="leading-relaxed whitespace-pre-wrap">
                          {translations[currentPage]}
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => translatePage(bookContent.pages[currentPage].text || bookContent.pages[currentPage])}
                        disabled={isTranslating}
                        className="flex items-center gap-2 bg-gold/10 text-gold px-6 py-3 rounded-full hover:bg-gold/20 transition-all font-medium text-sm disabled:opacity-50"
                      >
                        {isTranslating ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {language === 'en' ? 'Translating...' : 'لە وەرگێڕاندایە...'}
                          </>
                        ) : (
                          <>
                            <Quote className="w-4 h-4" />
                            {language === 'en' ? 'Translate to English' : 'وەرگێڕان بۆ کوردی'}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <p>{language === 'ar' ? 'لا يوجد محتوى لهذه الصفحة' : language === 'en' ? 'No content for this page' : 'هیچ ناوەڕۆکێک نییە بۆ ئەم پەڕەیە'}</p>
            )}
          </div>

          {bookContent.pages && bookContent.pages.length > 1 && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-stone-200/20">
              <button
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className={`p-2 rounded-full transition-colors ${currentPage === 0 ? 'opacity-50 cursor-not-allowed' : ''} ${theme === 'night' ? 'bg-stone-800 text-gold hover:bg-stone-700' : 'bg-olive/10 text-olive hover:bg-olive/20'}`}
              >
                <ChevronRight className="w-6 h-6" />
              </button>
              
              <span className={`text-sm font-medium ${theme === 'night' ? 'text-stone-400' : 'text-stone-500'}`}>
                {currentPage + 1} / {bookContent.pages.length}
              </span>

              <button
                onClick={() => setCurrentPage(Math.min(bookContent.pages.length - 1, currentPage + 1))}
                disabled={currentPage === bookContent.pages.length - 1}
                className={`p-2 rounded-full transition-colors ${currentPage === bookContent.pages.length - 1 ? 'opacity-50 cursor-not-allowed' : ''} ${theme === 'night' ? 'bg-stone-800 text-gold hover:bg-stone-700' : 'bg-olive/10 text-olive hover:bg-olive/20'}`}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            </div>
          )}
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
          {language === 'ar' ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          <span className="font-medium text-sm">{language === 'ar' ? 'رجوع' : language === 'en' ? 'Back' : 'گەڕانەوە'}</span>
        </button>
        <div className="relative flex-1 max-w-[150px] ml-4">
          <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 ${theme === 'night' ? 'text-gold/50' : 'text-olive/50'}`} />
          <input
            type="text"
            placeholder={language === 'ar' ? 'بحث...' : language === 'en' ? 'Search...' : 'گەڕان...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full ${language === 'ar' ? 'pr-9 pl-4' : 'pl-9 pr-4'} py-2 border rounded-full text-sm focus:outline-none ${theme === 'night' ? 'bg-stone-800 border-stone-700 text-gold placeholder-gold/50 focus:border-gold/50' : 'bg-olive/10 border-olive/20 text-olive placeholder-olive/50 focus:border-olive/50'}`}
          />
        </div>
      </div>

      <div className="text-center mb-6">
        <h2 className={`text-2xl font-bold mb-2 ${theme === 'night' ? 'text-gold' : 'text-olive'}`}>
          {language === 'ar' ? 'الفتن والملاحم وأشراط الساعة' : language === 'en' ? 'Trials and Tribulations of the Hour' : 'فتنە و جەنگەکان و ڕۆژی دوایی'}
        </h2>
        <p className={`text-sm ${theme === 'night' ? 'text-stone-400' : 'text-stone-500'}`}>
          {language === 'ar' ? 'مكتبة شاملة لكتب الفتن والملاحم' : language === 'en' ? 'Comprehensive library for books on trials and tribulations' : 'کتێبخانەیەکی گشتگیر بۆ کتێبەکانی فیتنە و جەنگەکان'}
        </p>
      </div>

      {error && (
        <div className={`p-4 mb-6 rounded-lg text-center ${theme === 'night' ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-600'}`}>
          {error}
        </div>
      )}

      <div className="space-y-3">
        {filteredBooks.map((book, idx) => (
          <motion.button
            key={book.id}
            onClick={() => loadBook(book)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            disabled={loading}
            className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${theme === 'night' ? 'bg-stone-800/50 border-stone-700 hover:border-gold/50' : 'bg-white border-stone-200 hover:border-olive/50 shadow-sm'} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${theme === 'night' ? 'bg-stone-800 text-gold' : 'bg-olive/10 text-olive'}`}>
                <Book className="w-5 h-5" />
              </div>
              <div className="text-right">
                <h3 className={`font-bold font-naskh text-lg ${theme === 'night' ? 'text-white' : 'text-stone-900'}`}>
                  {language === 'ar' ? book.title_ar : language === 'en' ? book.title_en || book.title_ar : book.title_ku}
                </h3>
                <p className={`text-sm ${theme === 'night' ? 'text-stone-400' : 'text-stone-500'}`}>
                  {language === 'ar' ? book.description_ar : language === 'en' ? book.description_en || book.description_ar : book.description_ku}
                </p>
              </div>
            </div>
            {language === 'ar' ? (
              <ChevronLeft className={`w-5 h-5 ${theme === 'night' ? 'text-stone-600' : 'text-stone-400'}`} />
            ) : (
              <ChevronRight className={`w-5 h-5 ${theme === 'night' ? 'text-stone-600' : 'text-stone-400'}`} />
            )}
          </motion.button>
        ))}
      </div>
      
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-2xl flex flex-col items-center ${theme === 'night' ? 'bg-stone-900' : 'bg-white'}`}>
            <Loader2 className={`w-8 h-8 animate-spin mb-4 ${theme === 'night' ? 'text-gold' : 'text-olive'}`} />
            <p className={`font-medium ${theme === 'night' ? 'text-white' : 'text-stone-900'}`}>
              {language === 'ar' ? 'جاري التحميل...' : language === 'en' ? 'Loading...' : 'لە بارکردندایە...'}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
