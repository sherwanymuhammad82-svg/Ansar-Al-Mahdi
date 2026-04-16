
import axios from 'axios';
import AdmZip from 'adm-zip';
import fs from 'fs';

async function run() {
  try {
    const url = 'https://github.com/sherwanymuhammad82-svg/my-book-api/releases/download/4/Hanbali_books.zip';
    console.log('Downloading ZIP...');
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const zip = new AdmZip(response.data);
    const zipEntries = zip.getEntries();
    
    const books = zipEntries
      .filter(entry => !entry.isDirectory && entry.entryName.endsWith('.json'))
      .map(entry => {
        const title = entry.entryName.replace('.json', '');
        return {
          id: `hanbali_${title}`,
          title_ar: title,
          title_ku: '', // Will be translated or left empty
          description_ar: `كتاب في الفقه الحنبلي: ${title}`,
          description_ku: `کتێبێک لە فیقهی حەنبەلی: ${title}`,
          category: 'fiqh_hanbali',
          filename: entry.entryName,
          source: 'github_zip'
        };
      });

    fs.writeFileSync('src/data/hanbali_metadata.json', JSON.stringify(books, null, 2));
    console.log(`Generated metadata for ${books.length} books.`);
  } catch (err) {
    console.error(err);
  }
}

run();
