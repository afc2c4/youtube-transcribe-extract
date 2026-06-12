import fs from 'fs';

async function run() {
  const html = await (await fetch('https://www.youtube.com/playlist?list=PLBCF2DAC6FFB574DE')).text();
  const match = html.match(/var ytInitialData = (\{.*?\});<\/script>/);
  if (match) {
    const data = JSON.parse(match[1]);
    if (data.contents.twoColumnBrowseResultsRenderer) {
       const content = data.contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content;
       const itemSection = content.sectionListRenderer.contents[0].itemSectionRenderer;
       const videos = itemSection.contents.filter(i => i.lockupViewModel).map(i => i.lockupViewModel);
       fs.writeFileSync('yt.json', JSON.stringify(videos[0], null, 2));
       console.log('Saved');
    }
  }
}
run();
