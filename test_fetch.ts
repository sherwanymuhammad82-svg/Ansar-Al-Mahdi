
async function test() {
    const bookId = 'أحاديث أبي الحسن الجوبري';
    const url = `http://localhost:3000/books/${encodeURIComponent(bookId)}.json`;
    console.log(`Fetching ${url}`);
    try {
        const res = await fetch(url);
        console.log(`Status: ${res.status}`);
        if (res.ok) {
            const data = await res.json();
            console.log(`Data keys: ${Object.keys(data)}`);
            console.log(`Contents length: ${data.contents?.length}`);
        } else {
            console.log(`Error: ${await res.text()}`);
        }
    } catch (e) {
        console.error(e);
    }
}
test();
