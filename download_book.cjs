const fs = require('fs');

async function run() {
  const response = await fetch("https://raw.githubusercontent.com/sherwanymuhammad82-svg/my-book-api/refs/heads/main/book.json");
  const data = await response.json();
  fs.writeFileSync("book.json", JSON.stringify(data, null, 2));
  console.log("Downloaded book.json");
}
run();
