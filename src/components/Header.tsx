import React from 'react';
import { ListVideo } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-[#121214] border-b border-slate-800 sticky top-0 z-10 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center">
          <ListVideo className="w-5 h-5 text-white" />
        </div>
        <h1 className="font-bold text-xl tracking-tight text-white">Extrator de Transcrições do YouTube</h1>
      </div>
    </header>
  );
}
