"use client";

import React, { useEffect, useState } from "react";
import {
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
} from "lucide-react";

interface BoardControlsProps {
  currentIndex: number;
  totalMoves: number;
  onGoToMove: (index: number) => void;
  onFlipBoard: () => void;
}

export const BoardControls: React.FC<BoardControlsProps> = ({
  currentIndex,
  totalMoves,
  onGoToMove,
  onFlipBoard,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  // Auto-play interval effect
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isPlaying) {
      timer = setInterval(() => {
        if (currentIndex < totalMoves - 1) {
          onGoToMove(currentIndex + 1);
        } else {
          setIsPlaying(false);
        }
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, currentIndex, totalMoves, onGoToMove]);

  // Global Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          onGoToMove(currentIndex - 1);
          break;
        case "ArrowRight":
          e.preventDefault();
          onGoToMove(currentIndex + 1);
          break;
        case "Home":
          e.preventDefault();
          onGoToMove(-1);
          break;
        case "End":
          e.preventDefault();
          onGoToMove(totalMoves - 1);
          break;
        case " ":
          e.preventDefault();
          setIsPlaying((prev) => !prev);
          break;
        case "f":
        case "F":
          e.preventDefault();
          onFlipBoard();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, totalMoves, onGoToMove, onFlipBoard]);

  return (
    <div className="flex items-center justify-between bg-card border border-border p-2 rounded-xl shadow-md w-full max-w-[560px]">
      <div className="flex items-center gap-1">
        <button
          onClick={() => onGoToMove(-1)}
          disabled={currentIndex <= -1}
          title="Start Position (Home)"
          aria-label="Go to starting position"
          className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-card-hover disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <ChevronFirst className="w-5 h-5" />
        </button>

        <button
          onClick={() => onGoToMove(currentIndex - 1)}
          disabled={currentIndex <= -1}
          title="Previous Move (Left Arrow)"
          aria-label="Previous move"
          className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-card-hover disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={() => setIsPlaying((prev) => !prev)}
          title="Auto-play (Space)"
          aria-label={isPlaying ? "Pause auto-play" : "Start auto-play"}
          className="p-2.5 rounded-lg bg-accent-green hover:bg-accent-green-hover text-white transition-all transform active:scale-95"
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>

        <button
          onClick={() => onGoToMove(currentIndex + 1)}
          disabled={currentIndex >= totalMoves - 1}
          title="Next Move (Right Arrow)"
          aria-label="Next move"
          className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-card-hover disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <button
          onClick={() => onGoToMove(totalMoves - 1)}
          disabled={currentIndex >= totalMoves - 1}
          title="Last Move (End)"
          aria-label="Go to last move"
          className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-card-hover disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <ChevronLast className="w-5 h-5" />
        </button>
      </div>

      <div className="h-6 w-px bg-border mx-2" />

      <button
        onClick={onFlipBoard}
        title="Flip Board (F)"
        aria-label="Flip chessboard orientation"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-neutral-300 hover:text-white hover:bg-card-hover transition-colors"
      >
        <RotateCcw className="w-4 h-4" />
        <span className="text-xs font-semibold">Flip</span>
      </button>
    </div>
  );
};
