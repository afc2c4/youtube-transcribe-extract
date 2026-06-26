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

  try {
    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Cookie": "SOCS=CAI; CONSENT=YES+cb.20230101-00-p0.en+FX+000;"
    };
    const html = await (await fetch(`https://www.youtube.com/playlist?list=${listId}`, { headers })).text();
    
    const startString = "var ytInitialData = ";
    const startIndex = html.indexOf(startString);
    if (startIndex === -1) {
       throw new Error("Página HTML não possui ytInitialData");
    }
    let jsonString = html.substring(startIndex + startString.length);
    const endIndex = jsonString.indexOf(";</script>");
    if (endIndex !== -1) {
      jsonString = jsonString.substring(0, endIndex);
    }
    
    const data = JSON.parse(jsonString);

    if (!data.contents?.twoColumnBrowseResultsRenderer) {
      if (listId.startsWith("RD")) {
         throw new Error("Mixes de YouTube necessitam uso pelo formato de vídeo único com as transcrições individuais.");
      }
      throw new Error("Formato de playlist inesperado (talvez seja privada ou a estrutura mudou)");
    }

    const title = data.metadata?.playlistMetadataRenderer?.title || data.header?.playlistHeaderRenderer?.title?.simpleText || data.microformat?.microformatDataRenderer?.title || "Playlist Desconhecida";
    
    const content = data.contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content;
    const sectionList = content.sectionListRenderer;
    if (!sectionList || !sectionList.contents || !sectionList.contents[0]) throw new Error("Lista de seções não encontrada");
    const itemSection = sectionList.contents[0].itemSectionRenderer;
    if (!itemSection || !itemSection.contents) throw new Error("Vídeos não encontrados na seção");

    let items = [];
    const videosContainer = itemSection.contents[0]?.playlistVideoListRenderer?.contents || itemSection.contents;
    
    for (const item of videosContainer) {
        if (item.playlistVideoRenderer) {
            const r = item.playlistVideoRenderer;
            items.push({
               id: r.videoId,
               title: r.title?.runs?.[0]?.text || r.title?.simpleText || "Desconhecido",
               shortUrl: `https://youtu.be/${r.videoId}`,
               bestThumbnail: { url: r.thumbnail?.thumbnails?.[r.thumbnail.thumbnails.length - 1]?.url },
               author: { name: r.shortBylineText?.runs?.[0]?.text },
               duration: r.lengthText?.simpleText
            });
        } else if (item.lockupViewModel) {
            const vm = item.lockupViewModel;
            let titleContent = "Desconhecido";
            if (vm.metadata?.lockupMetadataViewModel?.title?.content) {
                titleContent = vm.metadata.lockupMetadataViewModel.title.content;
            }
            
            let authorName = "Desconhecido";
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

    return { title, items: items.slice(0, 100) };
    
  } catch (err: any) {
    if (videoId) {
      return {
        title: "Vídeo Único (Fallback)",
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

async function fetchVideoDescriptionAndTitle(videoId: string) {
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Cookie": "SOCS=CAI; CONSENT=YES+cb.20230101-00-p0.en+FX+000;"
  };
  try {
    const html = await (await fetch(`https://www.youtube.com/watch?v=${videoId}`, { headers })).text();
    
    function findKey(obj: any, key: string): any {
      if (!obj || typeof obj !== "object") return null;
      if (obj[key] !== undefined) return obj[key];
      for (const k in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, k)) {
          const res = findKey(obj[k], key);
          if (res) return res;
        }
      }
      return null;
    }

    let description = "";
    let title = "";

    // Check ytInitialData
    const startString = "var ytInitialData = ";
    const startIndex = html.indexOf(startString);
    if (startIndex !== -1) {
      let jsonString = html.substring(startIndex + startString.length);
      const endIndex = jsonString.indexOf(";</script>");
      if (endIndex !== -1) {
        jsonString = jsonString.substring(0, endIndex);
      }
      try {
        const data = JSON.parse(jsonString);
        const descObj = findKey(data, "attributedDescription");
        if (descObj && descObj.content) {
          description = descObj.content;
        }
      } catch (e) {}
    }

    // Check ytInitialPlayerResponse
    const playerToken = "var ytInitialPlayerResponse = ";
    let playerIdx = html.indexOf(playerToken);
    if (playerIdx === -1) {
      playerIdx = html.indexOf("ytInitialPlayerResponse = ");
    }
    if (playerIdx !== -1) {
      const jsonStart = html.indexOf("{", playerIdx);
      if (jsonStart !== -1) {
        let depth = 0;
        let jsonString = "";
        for (let i = jsonStart; i < html.length; i++) {
          if (html[i] === "{") depth++;
          else if (html[i] === "}") {
            depth--;
            if (depth === 0) {
              jsonString = html.slice(jsonStart, i + 1);
              break;
            }
          }
        }
        try {
          const data = JSON.parse(jsonString);
          if (!description) {
            const descObj = findKey(data, "attributedDescription");
            if (descObj && descObj.content) {
              description = descObj.content;
            } else if (data.videoDetails && data.videoDetails.shortDescription) {
              description = data.videoDetails.shortDescription;
            }
          }
          if (data.videoDetails && data.videoDetails.title) {
            title = data.videoDetails.title;
          }
        } catch (e) {}
      }
    }

    return { description, title };
  } catch (err) {
    console.error("Failed to extract description for video:", videoId, err);
    return { description: "", title: "" };
  }
}

function parseChapters(description: string) {
  const lines = description.split(/\r?\n/);
  const chapters = [];
  const regex = /(?:\[|\()?(\d{1,2}:)?(\d{1,2}):(\d{2})(?:\]|\))?\s*[-–—:]?\s*(.+)/;
  
  for (const line of lines) {
    const match = line.match(regex);
    if (match) {
      const hStr = match[1];
      const mStr = match[2];
      const sStr = match[3];
      const title = match[4].trim();
      
      const hours = hStr ? parseInt(hStr.replace(":", "")) : 0;
      const minutes = parseInt(mStr);
      const seconds = parseInt(sStr);
      
      const timeSec = hours * 3600 + minutes * 60 + seconds;
      chapters.push({ timeSec, timeStr: (hStr || "") + mStr + ":" + sStr, title });
    }
  }
  
  chapters.sort((a, b) => a.timeSec - b.timeSec);
  return chapters;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.post("/api/playlist/info", async (req, res) => {
    try {
      const { playlistUrl } = req.body;
      if (!playlistUrl) {
        return res.status(400).json({ error: "Playlist URL is required" });
      }
      const playlist = await fetchPlaylist(playlistUrl);
      res.json(playlist);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message || "Something went wrong fetching the playlist" });
    }
  });

  app.post("/api/video/transcript", async (req, res) => {
    try {
      const { videoId, splitStrategy = "chapters", splitInterval = 15 } = req.body;
      if (!videoId) {
        return res.status(400).json({ error: "videoId is required" });
      }
      let transcriptOriginal = null;
      let error = null;
      try {
        const transcriptData = await YoutubeTranscript.fetchTranscript(videoId);
        transcriptOriginal = transcriptData;
      } catch (err: any) {
        if (err.message && err.message.includes("Transcript is disabled")) {
          error = "O YouTube bloqueou o acesso à transcrição para este IP (proteção anti-bot). As transcrições automáticas não podem ser acessadas por servidores Cloud no momento.";
        } else {
          error = "Transcrição indisponível ou inacessível.";
        }
      }

      if (!transcriptOriginal || transcriptOriginal.length === 0) {
        return res.json({ transcript: null, error: error || "Não foi possível obter a transcrição." });
      }

      // Check if transcript is in MS
      const averageDelta = transcriptOriginal[transcriptOriginal.length - 1].offset / transcriptOriginal.length;
      const isMs = averageDelta > 50;

      interface TranscriptItem {
        title: string;
        text: string;
        timeStartStr: string;
        timeStartSec: number;
      }

      let blocksToReturn: TranscriptItem[] = [];

      const splitStrategyFallbackInterval = () => {
        const intervalInMinutes = Number(splitInterval) || 15;
        const CHUNK_LIMIT = isMs ? intervalInMinutes * 60 * 1000 : intervalInMinutes * 60;
        let currentChunkText: string[] = [];
        let currentChunkStart = 0;
        let pIdx = 1;

        for (const line of transcriptOriginal) {
          if (line.offset - currentChunkStart > CHUNK_LIMIT && currentChunkText.length > 0) {
            const partSec = isMs ? currentChunkStart / 1000 : currentChunkStart;
            const h = Math.floor(partSec / 3600);
            const m = Math.floor((partSec % 3600) / 60);
            const s = Math.floor(partSec % 60);
            const formattedTime = (h > 0 ? `${h}:` : "") + `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;

            blocksToReturn.push({
              title: `Parte ${pIdx} (${formattedTime})`,
              text: currentChunkText.join(" "),
              timeStartStr: formattedTime,
              timeStartSec: partSec
            });
            pIdx++;
            currentChunkText = [];
            currentChunkStart = line.offset;
          }
          currentChunkText.push(line.text);
        }

        if (currentChunkText.length > 0) {
          const partSec = isMs ? currentChunkStart / 1000 : currentChunkStart;
          const h = Math.floor(partSec / 3600);
          const m = Math.floor((partSec % 3600) / 60);
          const s = Math.floor(partSec % 60);
          const formattedTime = (h > 0 ? `${h}:` : "") + `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;

          blocksToReturn.push({
            title: `Parte ${pIdx} (${formattedTime})`,
            text: currentChunkText.join(" "),
            timeStartStr: formattedTime,
            timeStartSec: partSec
          });
        }
      };

      if (splitStrategy === "none") {
        const fullText = transcriptOriginal.map((line: any) => line.text).join(" ");
        blocksToReturn.push({
          title: "Transcrição Completa",
          text: fullText,
          timeStartStr: "00:00",
          timeStartSec: 0
        });
      } else if (splitStrategy === "chapters") {
        // Fetch chapters from description
        let chapters: { timeSec: number; timeStr: string; title: string; }[] = [];
        try {
          const { description } = await fetchVideoDescriptionAndTitle(videoId);
          if (description) {
            chapters = parseChapters(description);
          }
        } catch (e) {
          console.error("Erro ao buscar capítulos:", e);
        }

        if (chapters.length > 0) {
          // Splitting using custom chapters!
          const bins = chapters.map(c => ({
            title: c.title,
            timeStartStr: c.timeStr,
            timeStartSec: c.timeSec,
            lines: [] as string[]
          }));

          for (const line of transcriptOriginal) {
            const lineSec = isMs ? line.offset / 1000 : line.offset;
            
            let activeBinIdx = 0;
            for (let i = 0; i < chapters.length; i++) {
              if (lineSec >= chapters[i].timeSec) {
                activeBinIdx = i;
              } else {
                break;
              }
            }
            bins[activeBinIdx].lines.push(line.text);
          }

          blocksToReturn = bins
            .filter(b => b.lines.length > 0)
            .map(b => ({
              title: b.title,
              text: b.lines.join(" "),
              timeStartStr: b.timeStartStr,
              timeStartSec: b.timeStartSec
            }));
        } else {
          // Standard fallback to chunk strategy if no chapters were parsed
          splitStrategyFallbackInterval();
        }
      } else {
        // Standard chunk strategy
        splitStrategyFallbackInterval();
      }

      res.json({ transcript: blocksToReturn, error });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
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
