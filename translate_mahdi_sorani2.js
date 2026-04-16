import translate from 'translate-google';
import fs from 'fs';

translate.languages['ckb'] = 'Kurdish (Sorani)';

async function run() {
  try {
    const arText = fs.readFileSync("mahdi_text.txt", "utf-8");
    
    // Split text into chunks to avoid API limits
    const chunks = arText.split('\n');
    let translatedChunks = [];
    
    console.log("Translating " + chunks.length + " chunks to Sorani...");
    
    // Process in batches of 10
    for (let i = 0; i < chunks.length; i += 10) {
      const batch = chunks.slice(i, i + 10);
      try {
        const res = await translate(batch, {to: 'ckb'});
        translatedChunks.push(...res);
        console.log(`Translated batch ${i/10 + 1}/${Math.ceil(chunks.length/10)}`);
      } catch (err) {
        console.error(`Error translating batch ${i/10 + 1}:`, err);
        // Fallback to translating one by one
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
    
    const kuText = translatedChunks.join('\n');
    
    const mahdiContent = `export const MAHDI_CONTENT = {
  title: { ar: 'الإمام المهدي', ku: 'ئیمام مەهدی' },
  items: [
    {
      id: 'post-1',
      date: '',
      title: { ar: 'علامات مهم جدا عند ظهور المهدي', ku: 'نیشانە زۆر گرنگەکان لە کاتی دەرکەوتنی مەهدی' },
      author: { ar: 'الإمام المهدي', ku: 'ئیمام مەهدی' },
      content: { 
        ar: \`${arText.replace(/`/g, '\\`')}\`,
        ku: \`${kuText.replace(/`/g, '\\`')}\`
      },
      imageUrl: 'https://drive.google.com/thumbnail?id=1Gl7I0iUQ8t0ab2tygifzzQYgtw_GaySx&sz=w1000',
    }
  ]
};
`;

    fs.writeFileSync("src/data/mahdi.ts", mahdiContent);
    console.log("Translation complete and saved to src/data/mahdi.ts");
  } catch (err) {
    console.error(err);
  }
}

run();
