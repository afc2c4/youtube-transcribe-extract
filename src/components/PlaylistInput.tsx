import React from 'react';
import { Loader2, Video, AlertCircle } from 'lucide-react';

interface PlaylistInputProps {
  url: string;
  setUrl: (url: string) => void;
  loading: boolean;
  progress: number;
  total: number;
  error: string | null;
  onSubmit: (e: React.FormEvent) => void;
  splitStrategy: 'chapters' | '15min' | 'none';
  setSplitStrategy: (val: 'chapters' | '15min' | 'none') => void;
}

export function PlaylistInput({ 
  url, 
  setUrl, 
  loading, 
  progress, 
  total, 
  error, 
  onSubmit,
  splitStrategy,
  setSplitStrategy
}: PlaylistInputProps) {
  const percentage = total > 0 ? Math.round((progress / total) * 100) : 0;

  return (
    <section className="bg-[#121214] rounded-2xl border border-slate-800 p-6 mb-8 max-w-3xl">
      <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Analisar Playlist</h2>
      <p className="text-slate-400 mb-6 text-sm">Insira o link de uma playlist do YouTube. Obteremos os vídeos e extrairemos as transcrições disponíveis automaticamente. (Limita a 100 vídeos para performance).</p>
      
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
          disabled={loading || (total > 0 && progress < total) || !url.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-indigo-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 whitespace-nowrap"
        >
          {loading || (total > 0 && progress < total) ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {loading ? 'Buscando info...' : 'Baixando...'}
            </>
          ) : (
            'Extrair Dados'
          )}
        </button>
      </form>

      {total > 0 && (progress < total) && (
        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2 text-slate-400 font-medium">
             <span>Baixando transcrições...</span>
             <span>{progress} / {total} ({percentage}%)</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-indigo-500 h-2 rounded-full transition-all duration-300 ease-out" 
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        </div>
      )}

      {error && (
         <div className="mt-4 p-4 bg-red-900/20 text-red-400 rounded-xl border border-red-900/50 flex items-start gap-3 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>{error}</p>
         </div>
      )}

      <div className="mt-6 border-t border-slate-850 pt-6">
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3.5">
          Opção de Divisão da Transcrição
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { id: 'chapters', label: 'Dividir por Capítulos / Timestamps', desc: 'Usa a grade de conteúdo/cronograma da descrição do vídeo se disponível (padrão)' },
            { id: '15min', label: 'Dividir a cada 15 min', desc: 'Divide de forma homogênea a cada 15 minutos de conteúdo' },
            { id: 'none', label: 'Não Dividir', desc: 'Retorna um único bloco para toda a transcrição' }
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              disabled={loading}
              onClick={() => setSplitStrategy(opt.id as any)}
              className={`flex flex-col text-left p-3.5 rounded-xl border text-xs transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
                splitStrategy === opt.id
                  ? 'bg-indigo-500/10 border-indigo-500/80 text-indigo-300 shadow-sm shadow-indigo-500/5'
                  : 'bg-[#0A0A0B]/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
              }`}
            >
              <span className="font-bold text-sm mb-1">{opt.label}</span>
              <span className="text-[11px] text-slate-500 leading-snug">{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
