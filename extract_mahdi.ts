import fs from 'fs';

const data = JSON.parse(fs.readFileSync('book.json', 'utf8'));
const text = data.chapters[0].text;

const paragraphs = text.split('\n');
const mahdiParagraphs = paragraphs.filter(p => p.includes('المهدي') || p.includes('مهدي'));

console.log(`Total paragraphs: ${paragraphs.length}`);
console.log(`Paragraphs mentioning Mahdi: ${mahdiParagraphs.length}`);

// Let's extract a contiguous section if possible, or just the paragraphs.
// Actually, the user says "Focus only on the section related to "Imam Mahdi" (or the relevant historical prophecies mentioned in the text)."
// Let's save the paragraphs to a file to inspect.
fs.writeFileSync('mahdi_mentions.txt', mahdiParagraphs.join('\n'));
