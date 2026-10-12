"use client";

import React from "react";
import { MoveRecord } from "@/lib/types";
import { UciEvaluation } from "@/lib/uci-protocol";

interface ChessboardProps {
  fen: string;
  orientation?: "w" | "b";
  lastMove?: MoveRecord | null;
  evaluation?: UciEvaluation | null;
  onSquareClick?: (square: string) => void;
}

// Public domain SVG piece symbols
const PIECE_SYMBOLS: Record<string, string> = {
  pw: "♙",
  nw: "♘",
  bw: "♗",
  rw: "♖",
  qw: "♕",
  kw: "♔",
  pb: "♟",
  nb: "♞",
  bb: "♝",
  rb: "♜",
  qb: "♛",
  kb: "♚",
};

export const Chessboard: React.FC<ChessboardProps> = ({
  fen,
  orientation = "w",
  lastMove = null,
  evaluation = null,
  onSquareClick,
}) => {
  // Parse FEN piece placement string (first part before space)
  const piecePlacement = fen.split(" ")[0];
  const rows = piecePlacement.split("/");

  // Build 8x8 matrix
  const boardMatrix: (string | null)[][] = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null));

  for (let r = 0; r < 8; r++) {
    let c = 0;
    for (const char of rows[r]) {
      if (/\d/.test(char)) {
        c += parseInt(char, 10);
      } else {
        const color = char === char.toUpperCase() ? "w" : "b";
        const type = char.toLowerCase();
        boardMatrix[r][c] = `${type}${color}`;
        c++;
      }
    }
  }

  const isFlipped = orientation === "b";

  // Calculate Evaluation Bar Fill Percentage (0% = Black winning, 100% = White winning)
  const calculateWhitePercentage = (): number => {
    if (!evaluation) return 50;
    if (evaluation.whiteMate !== null) {
      return evaluation.whiteMate > 0 ? 98 : 2;
    }
    if (evaluation.whiteCp !== null) {
      // Sigmoid mapping for smooth bar visual
      const cp = Math.max(-1500, Math.min(1500, evaluation.whiteCp));
      const winProb = 50 + 50 * (2 / (1 + Math.exp(-0.0035 * cp)) - 1);
      return Math.max(5, Math.min(95, winProb));
    }
    return 50;
  };

  const whitePercent = calculateWhitePercentage();
  const barHeightStyle = isFlipped
    ? `${100 - whitePercent}%`
    : `${whitePercent}%`;

  return (
    <div className="flex gap-2.5 items-stretch w-full max-w-[580px]">
      {/* Evaluation Bar */}
      <div className="w-5 sm:w-6 bg-[#262421] rounded-lg border border-border overflow-hidden relative flex flex-col justify-end shadow-md shrink-0">
        <div
          className="w-full bg-[#f3f3f3] transition-all duration-300 ease-out"
          style={{ height: barHeightStyle }}
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-[9px] font-mono font-black text-neutral-800 rotate-90 select-none drop-shadow-[0_0_2px_rgba(255,255,255,0.9)]">
            {evaluation?.whiteMate !== null && evaluation?.whiteMate !== undefined
              ? `M${Math.abs(evaluation.whiteMate)}`
              : evaluation?.whiteCp !== null && evaluation?.whiteCp !== undefined
              ? `${(evaluation.whiteCp / 100).toFixed(1)}`
              : "0.0"}
          </span>
        </div>
      </div>

      {/* Main Board Container */}
      <div
        role="region"
        aria-label="Interactive chessboard"
        className="relative aspect-square flex-1 select-none rounded-xl overflow-hidden border-2 border-border shadow-2xl bg-card"
      >
        <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
          {Array.from({ length: 64 }).map((_, index) => {
            const rawRow = Math.floor(index / 8);
            const rawCol = index % 8;

            const r = isFlipped ? 7 - rawRow : rawRow;
            const c = isFlipped ? 7 - rawCol : rawCol;

            const file = String.fromCharCode(97 + c);
            const rank = 8 - r;
            const squareName = `${file}${rank}`;
            const isLight = (r + c) % 2 === 0;

            const piece = boardMatrix[r][c];

            const isLastMoveFrom = lastMove?.from === squareName;
            const isLastMoveTo = lastMove?.to === squareName;
            const isHighlighted = isLastMoveFrom || isLastMoveTo;

            return (
              <div
                key={squareName}
                onClick={() => onSquareClick?.(squareName)}
                data-square={squareName}
                className={`relative flex items-center justify-center cursor-pointer transition-colors ${
                  isLight ? "bg-[#eeeed2]" : "bg-[#769656]"
                } ${isHighlighted ? "!bg-[#f7c04a]/60" : ""}`}
              >
                {/* File coordinate */}
                {rawRow === 7 && (
                  <span
                    className={`absolute bottom-0.5 right-1 text-[10px] font-bold ${
                      isLight ? "text-[#769656]" : "text-[#eeeed2]"
                    }`}
                  >
                    {file}
                  </span>
                )}

                {/* Rank coordinate */}
                {rawCol === 0 && (
                  <span
                    className={`absolute top-0.5 left-1 text-[10px] font-bold ${
                      isLight ? "text-[#769656]" : "text-[#eeeed2]"
                    }`}
                  >
                    {rank}
                  </span>
                )}

                {/* Piece render */}
                {piece && (
                  <div
                    className={`w-full h-full flex items-center justify-center text-4xl sm:text-5xl md:text-6xl select-none transition-transform hover:scale-105 ${
                      piece.endsWith("w")
                        ? "text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                        : "text-neutral-900 drop-shadow-[0_1px_2px_rgba(255,255,255,0.4)]"
                    }`}
                  >
                    {PIECE_SYMBOLS[piece] || ""}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
