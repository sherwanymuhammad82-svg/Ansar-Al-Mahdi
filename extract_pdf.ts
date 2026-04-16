import fs from "fs";
import pdf from "pdf-parse/lib/pdf-parse.js";

async function run() {
  try {
    const response = await fetch("https://drive.google.com/uc?export=download&id=1fLXj0dNc_fRNZVAXdfgWm2XoodBFhIXO");
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
