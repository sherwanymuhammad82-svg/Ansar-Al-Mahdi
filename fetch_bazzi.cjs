const https = require('https');

https.get('https://raw.githubusercontent.com/sherwanymuhammad82-svg/my-book-api/refs/heads/main/Bazzi_Final.json', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
    if (data.length > 1000) {
      console.log(data.substring(0, 1000));
      process.exit(0);
    }
  });
});
