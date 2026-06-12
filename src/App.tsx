import React, { useState, useEffect } from 'react';
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
    const formattedText = template.split('{transcript}').join(video.transcript);
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
