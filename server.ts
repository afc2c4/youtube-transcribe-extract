import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { YoutubeTranscript } from "youtube-transcript";

async function fetchPlaylist(inputUrl: string) {
  let listId = "";
  let videoId = "";
  
  if (inputUrl.includes("http")) {
    try {
      const urlObj = new URL(inputUrl);
      listId = urlObj.searchParams.get("list") || "";
      videoId = urlObj.searchParams.get("v") || "";
      if (urlObj.hostname === "youtu.be") {
         videoId = urlObj.pathname.slice(1);
      }
    } catch(e) {}
  } else {
    if (inputUrl.length === 11) {
      videoId = inputUrl;
    } else {
      listId = inputUrl;
    }
  }

  if (videoId && !listId) {
    return {
      title: "Vídeo Único",
      items: [{
        id: videoId,
        title: "Vídeo Adicionado (Buscando Transcrição...)",
        shortUrl: `https://youtu.be/${videoId}`,
        bestThumbnail: { url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` },
        author: { name: "YouTube Video" },
        duration: "-"
      }]
    };
  }

  if (!listId) {
    throw new Error("Invalid playlist URL");
  }

  const html = await (await fetch(`https://www.youtube.com/playlist?list=${listId}`)).text();
  const match = html.match(/var ytInitialData = (\{.*?\});<\/script>/);
  if (!match) throw new Error("Could not find playlist data (the playlist may be private or invalid)");
  
  const data = JSON.parse(match[1]);
  if (!data.contents?.twoColumnBrowseResultsRenderer) {
      throw new Error("Could not parse YouTube playlist layout (structure changed)");
  }

  const title = data.metadata?.playlistMetadataRenderer?.title || data.header?.playlistHeaderRenderer?.title?.simpleText || data.microformat?.microformatDataRenderer?.title || "Unknown Playlist";
  
  const content = data.contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content;
  const sectionList = content.sectionListRenderer;
  if (!sectionList || !sectionList.contents || !sectionList.contents[0]) throw new Error("Could not find sectionList");
  const itemSection = sectionList.contents[0].itemSectionRenderer;
  if (!itemSection) throw new Error("Could not find video list");

  let items = [];
  // Support both old playlistVideoListRenderer and new lockupViewModel
  if (itemSection.contents[0]?.playlistVideoListRenderer) {
      const vids = itemSection.contents[0].playlistVideoListRenderer.contents;
      for (const v of vids) {
          if (v.playlistVideoRenderer) {
              const r = v.playlistVideoRenderer;
              items.push({
                 id: r.videoId,
                 title: r.title?.runs?.[0]?.text || r.title?.simpleText || "Unknown",
                 shortUrl: `https://youtu.be/${r.videoId}`,
                 bestThumbnail: { url: r.thumbnail?.thumbnails?.[r.thumbnail.thumbnails.length - 1]?.url },
                 author: { name: r.shortBylineText?.runs?.[0]?.text },
                 duration: r.lengthText?.simpleText
              });
          }
      }
  } else {
     // lockupViewModel
     const vids = itemSection.contents.filter((i: any) => i.lockupViewModel).map((i: any) => i.lockupViewModel);
     for (const vm of vids) {
        let titleContent = "Unknown";
        if (vm.metadata?.lockupMetadataViewModel?.title?.content) {
            titleContent = vm.metadata.lockupMetadataViewModel.title.content;
        }
        
        let authorName = "Unknown";
        try {
            authorName = vm.metadata.lockupMetadataViewModel.metadata.contentMetadataViewModel.metadataRows[0].metadataParts[0].text.content;
        } catch(e){}
        
        items.push({
           id: vm.contentId,
           title: titleContent,
           shortUrl: `https://youtu.be/${vm.contentId}`,
           bestThumbnail: { url: vm.contentImage?.thumbnailViewModel?.image?.sources?.[0]?.url || "" },
           author: { name: authorName },
           duration: "N/A"
        });
     }
  }
  
  return { title, items: items.slice(0, 20) };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API endpoint
  app.post("/api/playlist/transcripts", async (req, res) => {
    try {
      const { playlistUrl } = req.body;
      if (!playlistUrl) {
        return res.status(400).json({ error: "Playlist URL is required" });
      }

      const playlist = await fetchPlaylist(playlistUrl);
      console.log(`Fetched playlist details, ${playlist.items.length} items found.`);

      const results = [];

      for (const item of playlist.items) {
        let transcript = null;
        let transcriptText = "";
        let error = null;

        try {
          console.log(`Fetching transcript for ${item.id} - ${item.title}`);
          const transcriptData = await YoutubeTranscript.fetchTranscript(item.id);
          transcriptText = transcriptData.map((t) => t.text).join(" ");
        } catch (err: any) {
          console.error(`Failed to fetch transcript for ${item.id}:`, err.message);
          if (err.message.includes("Transcript is disabled")) {
            error = "O YouTube bloqueou o acesso à transcrição para este IP (proteção anti-bot). As transcrições automáticas não podem ser acessadas por servidores Cloud no momento.";
          } else {
            error = "Transcrição indisponível ou inacessível.";
          }
        }

        results.push({
          id: item.id,
          title: item.title,
          url: item.shortUrl,
          thumbnail: item.bestThumbnail?.url || "",
          author: item.author?.name || "Unknown",
          duration: item.duration || "N/A",
          transcript: transcriptText,
          error: error
        });
      }

      res.json({
        playlistTitle: playlist.title,
        videos: results
      });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message || "Something went wrong fetching the playlist" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
