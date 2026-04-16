import fs from 'fs';
import path from 'path';

const booksDir = path.join(process.cwd(), 'public', 'books');
const booksFile = path.join(process.cwd(), 'src', 'data', 'hadith_books.ts');

const booksContent = fs.readFileSync(booksFile, 'utf-8');
const localBooksMatch = booksContent.match(/\[([\s\S]*?)\]/);

if (localBooksMatch) {
    const booksStr = localBooksMatch[1];
    const lines = booksStr.split('\n').filter(l => l.includes('"isLocal":true'));
    
    lines.forEach(line => {
        const idMatch = line.match(/"id":"(.*?)"/);
        if (idMatch) {
            const id = idMatch[1];
            const filename = `${id}.json`;
            const filePath = path.join(booksDir, filename);
            if (!fs.existsSync(filePath)) {
                console.log(`MISSING: ${filename}`);
            } else {
                // console.log(`OK: ${filename}`);
            }
        }
    });
}
