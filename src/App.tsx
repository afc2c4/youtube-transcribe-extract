import React, { useState } from 'react';
import type { PlaylistResponse, VideoResult } from './types';
import { Header } from './components/Header';
import { PlaylistInput } from './components/PlaylistInput';
import { ResultsSection } from './components/ResultsSection';

export default function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PlaylistResponse | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setData(null);
    setCopiedId(null);

    try {
      const response = await fetch('/api/playlist/transcripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playlistUrl: url.trim() }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch transcripts');
      }

      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (video: VideoResult) => {
    if (!video.transcript) return;
    const formattedText = `A transcrição é ${video.transcript}`;
    navigator.clipboard.writeText(formattedText);
    setCopiedId(video.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadTxt = (video: VideoResult) => {
    if (!video.transcript) return;
    const blob = new Blob([video.transcript], { type: 'text/plain' });
    const dlUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = dlUrl;
    a.download = `${video.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_transcript.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(dlUrl);
  };

  const handleDownloadAll = () => {
    if (!data) return;
    let combined = `Playlist: ${data.playlistTitle}\n\n`;
    
    data.videos.forEach(v => {
      combined += `--- ${v.title} ---\n`;
      combined += `URL: ${v.url}\n`;
      combined += `Duração: ${v.duration}\n`;
      if (v.transcript) {
         combined += `Transcrição:\n${v.transcript}\n\n`;
      } else {
         combined += `[Sem Transcrição Disponível: ${v.error}]\n\n`;
      }
    });

    const blob = new Blob([combined], { type: 'text/plain' });
    const dlUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = dlUrl;
    a.download = `${data.playlistTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_all_transcripts.txt`;
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
          error={error} 
          onSubmit={handleSubmit} 
        />
        {data && (
          <ResultsSection 
            data={data}
            copiedId={copiedId}
            onCopy={handleCopy}
            onDownloadTxt={handleDownloadTxt}
            onDownloadAll={handleDownloadAll}
          />
        )}
      </main>
    </div>
  );
}
