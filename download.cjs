const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const url = 'https://github.com/sherwanymuhammad82-svg/-/releases/download/0/apocalypse_books.zip';
const dest = path.join(__dirname, 'apocalypse_books.zip');

const file = fs.createWriteStream(dest);
https.get(url, function(response) {
  if (response.statusCode === 301 || response.statusCode === 302) {
    https.get(response.headers.location, function(res) {
      res.pipe(file);
      file.on('finish', function() {
        file.close();
        console.log('Downloaded');
        try {
          execSync('unzip -o apocalypse_books.zip -d apocalypse_books');
          console.log('Unzipped');
          const files = fs.readdirSync('apocalypse_books');
          console.log(files);
        } catch (e) {
          console.error(e);
        }
      });
    });
  } else {
    response.pipe(file);
    file.on('finish', function() {
      file.close();
      console.log('Downloaded');
      try {
        execSync('unzip -o apocalypse_books.zip -d apocalypse_books');
        console.log('Unzipped');
        const files = fs.readdirSync('apocalypse_books');
        console.log(files);
      } catch (e) {
        console.error(e);
      }
    });
  }
});
