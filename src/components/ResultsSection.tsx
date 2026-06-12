import React from 'react';
import { Download, PlayCircle, FileText, Copy, Check } from 'lucide-react';
import type { PlaylistResponse, VideoResult } from '../types';

interface ResultsSectionProps {
  data: PlaylistResponse;
  copiedId: string | null;
  onCopy: (video: VideoResult) => void;
  onDownloadTxt: (video: VideoResult) => void;
  onDownloadAll: () => void;
}

export function ResultsSection({ 
  data, 
  copiedId, 
  onCopy, 
  onDownloadTxt, 
  onDownloadAll 
}: ResultsSectionProps) {
  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-[#121214] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
      <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/20 border-b border-slate-800">
        <div>
          <h3 className="font-medium text-lg text-white line-clamp-1">{data.playlistTitle}</h3>
          <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mt-1">{data.videos.length} vídeos extraídos</p>
        </div>
        <button 
          onClick={onDownloadAll}
          className="inline-flex items-center gap-2 px-6 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm font-medium rounded-2xl transition-colors"
        >
          <Download className="w-4 h-4" />
          Baixar Tudo
        </button>
      </div>

      <div className="w-full overflow-hidden">
        <table className="w-full text-left border-collapse table-fixed">
          <thead>
            <tr className="bg-slate-800/50 text-slate-400 text-xs font-bold uppercase tracking-widest">
              <th className="p-4 w-[22%]">Vídeo</th>
              <th className="p-4 w-[12%]">Canal</th>
              <th className="p-4 w-[10%]">Duração</th>
              <th className="p-4 w-[24%]">Transcrição</th>
              <th className="p-4 w-[24%]">Texto Formatado</th>
              <th className="p-4 text-right w-[8%]">Ações</th>
            </tr>
          </thead>
          <tbody className="">
            {data.videos.map((video) => (
              <tr key={video.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                <td className="p-4 align-top">
                  <div className="flex gap-3">
                    <div className="hidden lg:flex relative shrink-0 w-24 h-14 bg-[#0A0A0B] rounded-lg overflow-hidden items-center justify-center border border-slate-800">
                      {video.thumbnail ? (
                        <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
                      ) : (
                         <PlayCircle className="w-6 h-6 text-slate-600" />
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <a 
                        href={video.url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="font-medium text-sm text-slate-200 hover:text-indigo-400 transition-colors line-clamp-3 leading-snug break-words"
                      >
                        {video.title}
                      </a>
                    </div>
                  </div>
                </td>
                
                <td className="p-4 align-top">
                  <span className="text-sm text-slate-400 line-clamp-2 break-words">{video.author}</span>
                </td>

                <td className="p-4 align-top">
                  <span className="text-sm font-mono text-slate-500">{video.duration}</span>
                </td>

                <td className="p-4 align-top group">
                  {video.error ? (
                    <div className="text-[11px] font-bold uppercase tracking-tight bg-slate-700/50 text-slate-400 px-2 py-1 rounded-md inline-block border border-slate-700/50 break-words">
                      {video.error}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-400 bg-[#0A0A0B] p-3 rounded-xl border border-slate-800/50 max-h-32 overflow-y-auto leading-relaxed">
                      <p className="line-clamp-4 group-hover:line-clamp-none transition-all duration-300 break-words">
                         {video.transcript}
                      </p>
                    </div>
                  )}
                </td>

                <td className="p-4 align-top group">
                  {video.error ? (
                    <div className="text-sm text-slate-600">-</div>
                  ) : (
                    <div className="group relative">
                      <div className="text-sm text-slate-400 bg-[#0A0A0B] p-3 rounded-xl border border-slate-800/50 max-h-32 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                        <p className="line-clamp-4 group-hover:line-clamp-none transition-all duration-300 pr-6 break-words">
                           A transcrição é {video.transcript}
                        </p>
                      </div>
                      <button
                        onClick={() => onCopy(video)}
                        className="absolute top-2 right-2 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-md border border-slate-700 shadow-sm transition-all opacity-0 group-hover:opacity-100"
                        title="Copiar texto formatado"
                      >
                        {copiedId === video.id ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  )}
                </td>

                <td className="p-4 align-top text-right">
                  <button
                    onClick={() => onDownloadTxt(video)}
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
  );
}
