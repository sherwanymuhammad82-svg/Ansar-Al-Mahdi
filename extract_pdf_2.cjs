const fs = require("fs");
const pdf = require("pdf-parse");

async function run() {
  try {
    const response = await fetch("https://drive.google.com/uc?export=download&id=1S1DVKUuMh56PMuaYF0XT2rJ90DZMPQg7");
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const data = await pdf(buffer);
    console.log("TEXT_START");
    console.log(data.text);
    console.log("TEXT_END");
  } catch (error) {
    console.error("Error:", error);
  }
}

run();
