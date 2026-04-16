import fs from 'fs';
import translate from 'google-translate-api-x';

async function main() {
  console.log('Fetching book...');
  const res = await fetch('https://raw.githubusercontent.com/sherwanymuhammad82-svg/my-book-api/refs/heads/main/book.json');
  const data = await res.json();
  
  console.log('Translating book title...');
  const title_ku_res = await translate(data.book_title, { to: 'ckb' });
  const title_ku = Array.isArray(title_ku_res) ? title_ku_res[0].text : (title_ku_res as any).text;
  
  const chapters = [];
  for (let i = 0; i < data.chapters.length; i++) {
    console.log(`Translating chapter ${i + 1}/${data.chapters.length}...`);
    const chapter = data.chapters[i];
    
    // Split text into smaller chunks for translation if it's too long
    const textChunks = chapter.text.match(/[\s\S]{1,3000}/g) || [];
    let text_ku = '';
    
    try {
        const translatedChunks = await translate(textChunks, { to: 'ckb' });
        if (Array.isArray(translatedChunks)) {
            text_ku = translatedChunks.map(t => t.text).join('');
        } else {
            text_ku = (translatedChunks as any).text;
        }
    } catch (e) {
        console.error('Translation error on chunk:', e);
        text_ku = chapter.text; // fallback to original
    }
    
    const title_ar_res = await translate(chapter.title, { to: 'ckb' });
    chapters.push({
      title_ar: chapter.title,
      title_ku: Array.isArray(title_ar_res) ? title_ar_res[0].text : (title_ar_res as any).text,
      text_ar: chapter.text,
      text_ku: text_ku
    });
  }
  
  const output = {
    title_ar: data.book_title,
    title_ku: title_ku,
    chapters: chapters
  };
  
  fs.writeFileSync('src/data/dajjal.json', JSON.stringify(output, null, 2));
  console.log('Done!');
}

main().catch(console.error);
