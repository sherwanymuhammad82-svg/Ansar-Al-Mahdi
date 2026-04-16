import fs from 'fs';

async function fetchBook() {
  const res = await fetch('https://raw.githubusercontent.com/sherwanymuhammad82-svg/my-book-api/refs/heads/main/book.json');
  const data = await res.json();
  fs.writeFileSync('book_dajjal_kaaba.json', JSON.stringify(data, null, 2));
  console.log('Saved to book_dajjal_kaaba.json');
}

fetchBook();
