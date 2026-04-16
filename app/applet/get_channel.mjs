import https from 'https';

https.get('https://youtube.com/@ansarmahdi_kurdi', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const match = data.match(/"channelId":"([^"]+)"/);
    if (match) {
      console.log(match[1]);
    } else {
      console.log("Not found");
    }
  });
});
