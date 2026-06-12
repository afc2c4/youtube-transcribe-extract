import React, { useState } from 'react';
import { Download, Loader2, PlayCircle, Video, ListVideo, AlertCircle, FileText } from 'lucide-react';
import type { PlaylistResponse, VideoResult } from './types';

export default function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PlaylistResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setData(null);

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
      <header className="bg-[#121214] border-b border-slate-800 sticky top-0 z-10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center">
            <ListVideo className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-bold text-xl tracking-tight text-white">Extrator de Transcrições do YouTube</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Input section */}
        <section className="bg-[#121214] rounded-2xl border border-slate-800 p-6 mb-8 max-w-3xl">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Analisar Playlist</h2>
          <p className="text-slate-400 mb-6 text-sm">Insira o link de uma playlist do YouTube. Obteremos os vídeos e extrairemos as transcrições disponíveis automaticamente. (Limita a 20 vídeos para performance).</p>
          
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                className="w-full px-4 py-4 pl-11 bg-[#0A0A0B] border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 placeholder-slate-600 transition-all text-sm"
                placeholder="https://www.youtube.com/playlist?list=..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={loading}
              />
              <Video className="w-5 h-5 text-slate-500 absolute left-3.5 top-4" />
            </div>
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-indigo-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processando...
                </>
              ) : (
                'Extrair Dados'
              )}
            </button>
          </form>

          {error && (
             <div className="mt-4 p-4 bg-red-900/20 text-red-400 rounded-xl border border-red-900/50 flex items-start gap-3 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>{error}</p>
             </div>
          )}
        </section>

        {/* Results section */}
        {data && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-[#121214] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
            <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/20 border-b border-slate-800">
              <div>
                <h3 className="font-medium text-lg text-white line-clamp-1">{data.playlistTitle}</h3>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mt-1">{data.videos.length} vídeos extraídos</p>
              </div>
              <button 
                onClick={handleDownloadAll}
                className="inline-flex items-center gap-2 px-6 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm font-medium rounded-2xl transition-colors"
              >
                <Download className="w-4 h-4" />
                Baixar Tudo
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800/50 text-slate-400 text-xs font-bold uppercase tracking-widest">
                    <th className="px-6 py-4 min-w-[250px]">Vídeo</th>
                    <th className="px-6 py-4 min-w-[120px]">Canal</th>
                    <th className="px-6 py-4 min-w-[100px]">Duração</th>
                    <th className="px-6 py-4 min-w-[400px]">Transcrição</th>
                    <th className="px-6 py-4 text-right min-w-[120px]">Ações</th>
                  </tr>
                </thead>
                <tbody className="">
                  {data.videos.map((video) => (
                    <tr key={video.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4 align-top">
                        <div className="flex gap-4">
                          <div className="relative shrink-0 w-28 h-16 bg-[#0A0A0B] rounded-lg overflow-hidden flex items-center justify-center border border-slate-800">
                            {video.thumbnail ? (
                              <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
                            ) : (
                               <PlayCircle className="w-6 h-6 text-slate-600" />
                            )}
                          </div>
                          <div>
                            <a 
                              href={video.url} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="font-medium text-sm text-slate-200 hover:text-indigo-400 transition-colors line-clamp-2 leading-snug"
                            >
                              {video.title}
                            </a>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 align-top">
                        <span className="text-sm text-slate-400 line-clamp-1">{video.author}</span>
                      </td>

                      <td className="px-6 py-4 align-top">
                        <span className="text-sm font-mono text-slate-500">{video.duration}</span>
                      </td>

                      <td className="px-6 py-4 align-top group">
                        {video.error ? (
                          <div className="text-[11px] font-bold uppercase tracking-tight bg-slate-700/50 text-slate-400 px-2 py-1 rounded-md inline-block border border-slate-700/50">
                            {video.error}
                          </div>
                        ) : (
                          <div className="text-sm text-slate-400 bg-[#0A0A0B] p-3 rounded-xl border border-slate-800/50 max-h-32 overflow-y-auto leading-relaxed">
                            <p className="line-clamp-4 group-hover:line-clamp-none transition-all duration-300">
                               {video.transcript}
                            </p>
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 align-top text-right">
                        <button
                          onClick={() => handleDownloadTxt(video)}
                          disabled={!video.transcript}
                          className="inline-flex items-center justify-center w-10 h-10 bg-slate-800/50 border border-slate-700/50 rounded-lg text-indigo-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:text-slate-600 group/btn"
                          title="Baixar Transcrição"
                        >
                          <FileText className="w-4 h-4 transition-colors" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.videos.length === 0 && (
              <div className="p-12 text-center text-slate-500">
                Nenhum vídeo encontrado nesta playlist.
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
