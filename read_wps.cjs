const fs = require('fs');
const data = fs.readFileSync('wps_data.json', 'utf8');
console.log(data.substring(0, 1000));
