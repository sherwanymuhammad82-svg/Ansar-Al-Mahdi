import fs from "fs";

async function run() {
  try {
    const response = await fetch("https://drive.google.com/uc?export=download&id=1fLXj0dNc_fRNZVAXdfgWm2XoodBFhIXO");
    const text = await response.text();
    console.log("TEXT_START");
    console.log(text.substring(0, 1000));
    console.log("TEXT_END");
  } catch (error) {
    console.error("Error:", error);
  }
}

run();
