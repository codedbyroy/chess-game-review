import React from "react";
import { FileUp, Sparkles, Github } from "lucide-react";

interface HeaderProps {
  onOpenImport: () => void;
  onLoadSample: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenImport,
  onLoadSample,
}) => {
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-card border-b border-border shadow-sm">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-green to-emerald-700 flex items-center justify-center text-white shadow-lg shadow-accent-green/20 font-black text-xl select-none">
          ♟
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-extrabold tracking-tight text-white">
              ChessLens
            </h1>
            <span className="text-[10px] font-bold text-accent-green bg-accent-green/10 border border-accent-green/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Phase 1 Foundation
            </span>
          </div>
          <p className="text-[11px] text-neutral-400">
            Free, in-browser chess game analysis with Stockfish Wasm
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onLoadSample}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-neutral-300 bg-card-hover hover:bg-neutral-700/60 border border-border transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-accent-gold" />
          <span>Opera Game</span>
        </button>

        <button
          onClick={onOpenImport}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-accent-green hover:bg-accent-green-hover text-white shadow-md shadow-accent-green/20 transition-all active:scale-95"
        >
          <FileUp className="w-3.5 h-3.5" />
          <span>Import PGN</span>
        </button>

        <a
          href="https://github.com/codedbyroy/chess-game-review"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-card-hover transition-colors"
          title="View on GitHub"
        >
          <Github className="w-4 h-4" />
        </a>
      </div>
    </header>
  );
};
