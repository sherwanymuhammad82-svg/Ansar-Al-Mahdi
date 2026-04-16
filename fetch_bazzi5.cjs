const https = require('https');

https.get('https://raw.githubusercontent.com/sherwanymuhammad82-svg/my-book-api/refs/heads/main/Bazzi_Final.json', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    const parsed = JSON.parse(data);
    const text = parsed.full_text.trim();
    const parts = text.split(/سُورَةُ\s+/).filter(s => s.trim().length > 0);
    const surahs = parts.map(s => 'سُورَةُ ' + s.trim());
    console.log('Number of surahs found:', surahs.length);
    for (let i = 0; i < surahs.length; i++) {
        const title = surahs[i].split('\n')[0];
        console.log(i + 1, title);
    }
  });
});
