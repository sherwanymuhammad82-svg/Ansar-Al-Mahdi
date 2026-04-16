import fetch from 'node-fetch';

async function test() {
  const res = await fetch('https://api.codetabs.com/v1/proxy?quest=https://www.youtube.com/channel/UCdpDH9SKlsYYojWPgzVQsoA/videos');
  const text = await res.text();
  const match = text.match(/var ytInitialData = (.*?);<\/script>/);
  if (match) {
    const data = JSON.parse(match[1]);
    try {
      const tabs = data.contents.twoColumnBrowseResultsRenderer.tabs;
      const videosTab = tabs.find(t => t.tabRenderer?.title === 'Videos' || t.tabRenderer?.title === 'ڤیدیۆکان' || t.tabRenderer?.title === 'فيديوهات' || t.tabRenderer?.endpoint?.commandMetadata?.webCommandMetadata?.url?.includes('/videos'));
      const items = videosTab.tabRenderer.content.richGridRenderer.contents;
      const videos = items.filter(i => i.richItemRenderer?.content?.videoRenderer).map(i => {
        const v = i.richItemRenderer.content.videoRenderer;
        return {
          id: v.videoId,
          title: v.title.runs[0].text,
          thumbnail: v.thumbnail.thumbnails[v.thumbnail.thumbnails.length - 1].url,
          published: v.publishedTimeText?.simpleText || ''
        };
      });
      console.log('Found videos:', videos.length);
      console.log(videos[0]);
    } catch(e) {
      console.log('Error parsing structure', e);
    }
  }
}
test();
