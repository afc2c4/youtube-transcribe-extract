import ytpl from 'ytpl';
async function run() {
  try {
    const pl = await ytpl('https://www.youtube.com/user/pewdiepie', { limit: 20 });
    console.log("ytpl success", pl.items.length);
  } catch(e) {
    console.log("Error:", e.stack);
  }
}
run();
