import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { YoutubeTranscript } from "youtube-transcript";
import ytpl from "ytpl";

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

  try {
    const playlist = await ytpl(listId, { limit: 20 });
    return {
      title: playlist.title,
      items: playlist.items.map(item => ({
        id: item.id,
        title: item.title,
        shortUrl: item.shortUrl,
        bestThumbnail: item.bestThumbnail || { url: `https://img.youtube.com/vi/${item.id}/hqdefault.jpg` },
        author: { name: item.author?.name || "Unknown" },
        duration: item.duration || "-"
      }))
    };
  } catch (err: any) {
    // Se a playlist falhar, mas tivermos um videoId, tentamos fallback para vídeo único
    if (videoId) {
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
    throw new Error(`Failed to fetch playlist: ${err.message}`);
  }
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
