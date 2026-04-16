const fs = require('fs');
const buffer = fs.readFileSync('mahdi.doc');
console.log(buffer.toString('utf8', 0, 200));
