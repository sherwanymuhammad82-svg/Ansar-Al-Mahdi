const fs = require('fs');

async function run() {
  const response = await fetch("https://drive.google.com/uc?export=download&id=1S1DVKUuMh56PMuaYF0XT2rJ90DZMPQg7");
  const buffer = await response.arrayBuffer();
  fs.writeFileSync("mahdi.doc", Buffer.from(buffer));
  console.log("Downloaded", buffer.byteLength, "bytes");
}
run();
