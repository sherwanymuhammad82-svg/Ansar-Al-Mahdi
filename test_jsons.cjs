const https = require('https');

const urls = [
  'https://raw.githubusercontent.com/sherwanymuhammad82-svg/my-book-api/refs/heads/main/Soosi_Final.json',
  'https://raw.githubusercontent.com/sherwanymuhammad82-svg/my-book-api/refs/heads/main/Shouba_Final.json',
  'https://raw.githubusercontent.com/sherwanymuhammad82-svg/my-book-api/refs/heads/main/Qumbul_Final.json',
  'https://raw.githubusercontent.com/sherwanymuhammad82-svg/my-book-api/refs/heads/main/Qaloon_Uthmanic_Full.json',
  'https://raw.githubusercontent.com/sherwanymuhammad82-svg/my-book-api/refs/heads/main/Doori_Final.json'
];

urls.forEach(url => {
  https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        console.log(url.split('/').pop(), 'Keys:', Object.keys(parsed));
        if (parsed.full_text) {
          console.log('  Length:', parsed.full_text.length);
        }
      } catch (e) {
        console.error('Error parsing', url);
      }
    });
  });
});
