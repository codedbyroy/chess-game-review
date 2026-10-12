"use client";

import React, { useEffect, useRef } from "react";
import { MoveRecord, GameAnalysisReport } from "@/lib/types";

interface MoveListProps {
  moves: MoveRecord[];
  currentIndex: number;
  report?: GameAnalysisReport | null;
  onSelectMove: (index: number) => void;
}

export const MoveList: React.FC<MoveListProps> = ({
  moves,
  currentIndex,
  report,
  onSelectMove,
}) => {
  const activeRef = useRef<HTMLButtonElement | null>(null);

  // Auto-scroll to active move
  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [currentIndex]);

  // Group moves into turns (pairs of white and black)
  const turns: { moveNumber: number; white?: MoveRecord; black?: MoveRecord }[] =
    [];

  for (let i = 0; i < moves.length; i += 2) {
    turns.push({
      moveNumber: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1],
    });
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4 flex flex-col h-[280px] sm:h-[340px]">
      <div className="flex items-center justify-between pb-3 border-b border-border mb-2">
        <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
          Move History
        </h3>
        <span className="text-xs text-neutral-500 font-mono">
          {currentIndex >= 0
            ? `Ply ${currentIndex + 1} of ${moves.length}`
            : "Start Position"}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-0.5 pr-1 font-mono text-sm">
        {turns.length === 0 ? (
          <div className="flex items-center justify-center h-full text-neutral-500 text-xs">
            No moves loaded yet.
          </div>
        ) : (
          turns.map((turn) => {
            const whiteIndex = (turn.moveNumber - 1) * 2;
            const blackIndex = whiteIndex + 1;

            const isWhiteActive = currentIndex === whiteIndex;
            const isBlackActive = currentIndex === blackIndex;

            const whiteAnalysis = report?.moves[whiteIndex];
            const blackAnalysis = report?.moves[blackIndex];

            return (
              <div
                key={turn.moveNumber}
                className="grid grid-cols-[40px_1fr_1fr] items-center py-1 px-2 rounded hover:bg-card-hover/40 transition-colors text-xs"
              >
                {/* Move Number */}
                <span className="text-neutral-500 font-bold select-none">
                  {turn.moveNumber}.
                </span>

                {/* White Move */}
                {turn.white && (
                  <button
                    ref={isWhiteActive ? activeRef : null}
                    onClick={() => onSelectMove(whiteIndex)}
                    className={`flex items-center justify-between py-1 px-2 rounded font-semibold transition-all ${
                      isWhiteActive
                        ? "bg-accent-green text-white shadow-sm font-bold"
                        : "text-neutral-200 hover:text-white hover:bg-card-hover"
                    }`}
                  >
                    <span>{turn.white.san}</span>
                    {whiteAnalysis && (
                      <span
                        className="text-[10px] ml-1.5 font-bold"
                        style={{ color: whiteAnalysis.classification.color }}
                        title={whiteAnalysis.classification.name}
                      >
                        {whiteAnalysis.classification.icon || "•"}
                      </span>
                    )}
                  </button>
                )}

                {/* Black Move */}
                {turn.black ? (
                  <button
                    ref={isBlackActive ? activeRef : null}
                    onClick={() => onSelectMove(blackIndex)}
                    className={`flex items-center justify-between py-1 px-2 rounded font-semibold transition-all ${
                      isBlackActive
                        ? "bg-accent-green text-white shadow-sm font-bold"
                        : "text-neutral-200 hover:text-white hover:bg-card-hover"
                    }`}
                  >
                    <span>{turn.black.san}</span>
                    {blackAnalysis && (
                      <span
                        className="text-[10px] ml-1.5 font-bold"
                        style={{ color: blackAnalysis.classification.color }}
                        title={blackAnalysis.classification.name}
                      >
                        {blackAnalysis.classification.icon || "•"}
                      </span>
                    )}
                  </button>
                ) : (
                  <div />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
