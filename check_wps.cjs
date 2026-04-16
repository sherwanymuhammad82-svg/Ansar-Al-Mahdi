async function run() {
  try {
    const response = await fetch("https://sg.docworkspace.com/d/sbCaia8XhMfywuhh_4lejwh6jcdefsha78p?sa=601.1258");
    const text = await response.text();
    console.log(text.substring(0, 1000));
  } catch (error) {
    console.error("Error:", error);
  }
}

run();
