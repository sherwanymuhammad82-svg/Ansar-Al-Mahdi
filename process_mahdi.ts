import translate from 'translate-google';
import fs from 'fs';

translate.languages['ckb'] = 'Kurdish (Sorani)';

async function run() {
  try {
    const response = await fetch('https://raw.githubusercontent.com/sherwanymuhammad82-svg/my-book-api/refs/heads/main/book.json');
    const data = await response.json();
    
    const text = data.chapters[0].text;
    const paragraphs = text.split('\n');
    
    // Filter paragraphs related to Imam Mahdi or prophecies
    const mahdiParagraphs = paragraphs.filter(p => p.includes('المهدي') || p.includes('مهدي') || p.includes('نبوءة') || p.includes('الرايات السود') || p.includes('خراسان') || p.includes('الدجال'));
    
    const arText = mahdiParagraphs.join('\n\n');
    
    console.log("Translating " + mahdiParagraphs.length + " paragraphs...");
    
    let translatedChunks = [];
    for (let i = 0; i < mahdiParagraphs.length; i += 10) {
      const batch = mahdiParagraphs.slice(i, i + 10);
      try {
        const res = await translate(batch, {to: 'ckb'});
        translatedChunks.push(...res);
        console.log(`Translated batch ${i/10 + 1}/${Math.ceil(mahdiParagraphs.length/10)}`);
      } catch (err) {
        console.error(`Error translating batch ${i/10 + 1}:`, err);
        for (const chunk of batch) {
          if (!chunk.trim()) {
            translatedChunks.push("");
            continue;
          }
          try {
            const r = await translate(chunk, {to: 'ckb'});
            translatedChunks.push(r);
          } catch (e) {
            translatedChunks.push(chunk);
          }
        }
      }
      await new Promise(r => setTimeout(r, 1000));
    }
    
    const kuText = translatedChunks.join('\n\n');
    
    const result = {
      title_ar: "المسيح الدجال يطوف بالكعبة - مقتطفات عن المهدي والنبوءات",
      content_ar: arText,
      title_ku: "مەسیحی دەجال بە دەوری کەعبەدا دەسوڕێتەوە - کورتەیەک دەربارەی مەهدی و پێشبینییەکان",
      content_ku: kuText
    };
    
    fs.writeFileSync('mahdi_prophecies.json', JSON.stringify(result, null, 2));
    console.log("Done!");
  } catch (err) {
    console.error(err);
  }
}

run();
