import React from 'react';
import { Loader2, Video, AlertCircle } from 'lucide-react';

interface PlaylistInputProps {
  url: string;
  setUrl: (url: string) => void;
  loading: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent) => void;
}

export function PlaylistInput({ url, setUrl, loading, error, onSubmit }: PlaylistInputProps) {
  return (
    <section className="bg-[#121214] rounded-2xl border border-slate-800 p-6 mb-8 max-w-3xl">
      <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Analisar Playlist</h2>
      <p className="text-slate-400 mb-6 text-sm">Insira o link de uma playlist do YouTube. Obteremos os vídeos e extrairemos as transcrições disponíveis automaticamente. (Limita a 20 vídeos para performance).</p>
      
      <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-3">
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
  );
}
