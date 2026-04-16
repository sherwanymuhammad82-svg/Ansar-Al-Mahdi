const https = require('https');

https.get('https://raw.githubusercontent.com/sherwanymuhammad82-svg/my-book-api/refs/heads/main/Bazzi_Final.json', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    const parsed = JSON.parse(data);
    const text = parsed.full_text;
    const surahs = text.split(/سُورَةُ\s+/).filter(Boolean).map(s => 'سُورَةُ ' + s.trim());
    console.log('Number of surahs found:', surahs.length);
    console.log('Surah 1:', surahs[0].substring(0, 100));
    console.log('Surah 2:', surahs[1].substring(0, 100));
    console.log('Surah 114:', surahs[surahs.length - 1].substring(0, 100));
  });
});
