async function run() {
  try {
    const response = await fetch("https://drive.google.com/uc?export=download&id=1S1DVKUuMh56PMuaYF0XT2rJ90DZMPQg7");
    const text = await response.text();
    console.log(text);
  } catch (error) {
    console.error("Error:", error);
  }
}

run();
