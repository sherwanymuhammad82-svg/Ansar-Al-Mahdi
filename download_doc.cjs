const fs = require('fs');
const https = require('https');

const file = fs.createWriteStream("mahdi.doc");
https.get("https://drive.google.com/uc?export=download&id=1S1DVKUuMh56PMuaYF0XT2rJ90DZMPQg7", function(response) {
  response.pipe(file);
  file.on('finish', function() {
    file.close();
    console.log("Download complete");
  });
});
