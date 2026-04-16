const https = require('https');

https.get('https://raw.githubusercontent.com/sherwanymuhammad82-svg/my-book-api/refs/heads/main/Bazzi_Final.json', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    const parsed = JSON.parse(data);
    console.log(Object.keys(parsed));
    if (parsed.surahs) {
      console.log('Has surahs array, length:', parsed.surahs.length);
      console.log('First surah keys:', Object.keys(parsed.surahs[0]));
    }
  });
});
