import React, { useState, useEffect } from 'react';
import type { PlaylistResponse, VideoResult } from './types';
import { Header } from './components/Header';
import { PlaylistInput } from './components/PlaylistInput';
import { ResultsSection } from './components/ResultsSection';

export default function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PlaylistResponse | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [splitStrategy, setSplitStrategy] = useState<'chapters' | 'interval' | 'none'>('chapters');
  const [splitInterval, setSplitInterval] = useState<number>(15);
  const [template, setTemplate] = useState(() => {
    return localStorage.getItem('transcriptTemplate') || 'A transcrição é {transcript}';
  });

  useEffect(() => {
    localStorage.setItem('transcriptTemplate', template);
  }, [template]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setProgress(0);
    setTotal(0);
    setError(null);
    setData(null);
    setCopiedId(null);

    try {
      const response = await fetch('/api/playlist/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playlistUrl: url.trim() }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch playlist info');
      }

      setLoading(false);

      const items = result.items || [];
      if (items.length === 0) {
        throw new Error('Nenhum vídeo encontrado nesta playlist.');
      }

      setTotal(items.length);

      const initialVideos: VideoResult[] = items.map((item: any) => ({
        id: item.id,
        title: item.title,
        url: item.shortUrl,
        thumbnail: item.bestThumbnail?.url || "",
        author: item.author?.name || "Unknown",
        duration: item.duration || "-",
        transcript: null,
        error: "⏳ Baixando transcrição...",
      }));

      setData({ playlistTitle: result.title, videos: initialVideos });

      let completedCount = 0;
      const BATCH_SIZE = 5;

      for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const batch = items.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map(async (item: any) => {
            try {
              const res = await fetch('/api/video/transcript', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videoId: item.id, splitStrategy, splitInterval }),
              });
              const tData = await res.json();

              setData(prev => {
                if (!prev) return prev;
                return {
                  ...prev,
                  videos: prev.videos.map(v => 
                    v.id === item.id 
                      ? { ...v, transcript: tData.transcript || null, error: tData.error || null } 
                      : v
                  )
                };
              });
            } catch (err: any) {
              setData(prev => {
                if (!prev) return prev;
                return {
                  ...prev,
                  videos: prev.videos.map(v => 
                    v.id === item.id 
                      ? { ...v, error: err.message || 'Erro ao processar' } 
                      : v
                  )
                };
              });
            } finally {
              completedCount++;
              setProgress(completedCount);
            }
          })
        );
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleCopy = (video: VideoResult, blockIndex?: number) => {
    if (!video.transcript) return;
    const textToInsert = typeof blockIndex === 'number' && Array.isArray(video.transcript) 
      ? video.transcript[blockIndex] 
      : (Array.isArray(video.transcript) ? video.transcript.join(' ') : video.transcript);
      
    const formattedText = template
      .split('{transcript}').join(textToInsert)
      .split('{titulo}').join(video.title);
    navigator.clipboard.writeText(formattedText);
    const copyId = typeof blockIndex === 'number' ? `${video.id}-${blockIndex}` : video.id;
    setCopiedId(copyId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadTxt = (video: VideoResult) => {
    if (!video.transcript) return;
    const textToDownload = Array.isArray(video.transcript) ? video.transcript.join('\n\n---\n\n') : video.transcript;
    const blob = new Blob([textToDownload], { type: 'text/plain' });
    const dlUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = dlUrl;
    a.download = `${video.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_transcript.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(dlUrl);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-slate-200 font-sans selection:bg-indigo-500/30">
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <PlaylistInput 
          url={url} 
          setUrl={setUrl} 
          loading={loading}
          progress={progress}
          total={total}
          error={error} 
          onSubmit={handleSubmit} 
          splitStrategy={splitStrategy}
          setSplitStrategy={setSplitStrategy}
          splitInterval={splitInterval}
          setSplitInterval={setSplitInterval}
        />
        {data && (
          <ResultsSection 
            data={data}
            copiedId={copiedId}
            template={template}
            setTemplate={setTemplate}
            onCopy={handleCopy}
            onDownloadTxt={handleDownloadTxt}
          />
        )}
      </main>
    </div>
  );
}
