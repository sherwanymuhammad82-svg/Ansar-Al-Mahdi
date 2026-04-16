async function run() {
  try {
    const response = await fetch("https://sg.docworkspace.com/d/sbCaia8XhMfywuhh_4lejwh6jcdefsha78p?sa=601.1258");
    const text = await response.text();
    const match = text.match(/window\.__NUXT__=(.*);<\/script>/);
    if (match) {
        console.log("Found NUXT data");
        const fs = require('fs');
        fs.writeFileSync('wps_data.json', match[1]);
    } else {
        console.log("No NUXT data found");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

run();
