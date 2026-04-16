import translate from 'translate-google';
import fs from 'fs';

translate.languages['ckb'] = 'Kurdish (Sorani)';

async function run() {
  try {
    const tahamiContent = fs.readFileSync("src/data/tahami.ts", "utf-8");
    
    const arTextMatch = tahamiContent.match(/ar: \`([\s\S]*?)\`,\n\s*ku:/);
    if (!arTextMatch) {
      console.error("Could not find Arabic text");
      return;
    }
    const arText = arTextMatch[1];
    
    // Split text into chunks to avoid API limits
    const chunks = arText.split('\n');
    let translatedChunks = [];
    
    console.log("Translating " + chunks.length + " chunks to Sorani...");
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i].trim();
      if (chunk.length === 0) {
        translatedChunks.push("");
        continue;
      }
      
      try {
        const res = await translate(chunk, {to: 'ckb'});
        translatedChunks.push(res);
        console.log(`Translated chunk ${i + 1}/${chunks.length}`);
      } catch (err) {
        console.error(`Error translating chunk ${i + 1}:`, err);
        translatedChunks.push(chunk); // Fallback to original
      }
      
      // small delay
      await new Promise(r => setTimeout(r, 500));
    }
    
    const kuText = translatedChunks.join('\n');
    
    const updatedContent = tahamiContent.replace(/ku: \`[\s\S]*?\`\n\s*}/, `ku: \`${kuText.replace(/`/g, '\\`')}\`\n      }`);
    fs.writeFileSync("src/data/tahami.ts", updatedContent);
    console.log("Translation complete and saved.");
  } catch (err) {
    console.error(err);
  }
}

run();
