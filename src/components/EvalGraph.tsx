"use client";

import React from "react";
import { GameAnalysisReport } from "@/lib/types";

interface EvalGraphProps {
  report: GameAnalysisReport | null;
  currentIndex: number;
  onSelectPly: (ply: number) => void;
}

export const EvalGraph: React.FC<EvalGraphProps> = ({
  report,
  currentIndex,
  onSelectPly,
}) => {
  if (!report || report.moves.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-5 flex flex-col items-center justify-center h-36 text-neutral-500 text-xs">
        <span>Run "Review Full Game" to view the evaluation momentum graph.</span>
      </div>
    );
  }

  const moves = report.moves;
  const totalPlies = moves.length;

  const width = 500;
  const height = 120;
  const paddingX = 15;
  const paddingY = 12;

  const graphWidth = width - paddingX * 2;
  const graphHeight = height - paddingY * 2;

  // Generate SVG path points
  const points = moves.map((m, idx) => {
    const x = paddingX + (idx / Math.max(1, totalPlies - 1)) * graphWidth;
    // 100% winProb = top of graph (y = paddingY), 0% = bottom (y = height - paddingY)
    const y = paddingY + (1 - m.winProbWhite / 100) * graphHeight;
    return { x, y, move: m, ply: idx };
  });

  const pathD = points.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, "");

  // Area fill under path
  const areaD = `${pathD} L ${points[points.length - 1].x} ${
    height - paddingY
  } L ${points[0].x} ${height - paddingY} Z`;

  // Active cursor coordinates
  const activePoint = currentIndex >= 0 ? points[currentIndex] : null;

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-2 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
          Evaluation Momentum Graph
        </h3>
        <span className="text-[11px] text-neutral-400 font-mono">
          {currentIndex >= 0
            ? `Move ${moves[currentIndex].moveNumber} (${moves[currentIndex].san})`
            : "Starting Position"}
        </span>
      </div>

      <div className="relative w-full aspect-[500/120] select-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
        >
          {/* Zero/Equal centerline (50% win probability) */}
          <line
            x1={paddingX}
            y1={height / 2}
            x2={width - paddingX}
            y2={height / 2}
            stroke="#3d3a37"
            strokeDasharray="4 4"
            strokeWidth="1"
          />

          {/* Area fill */}
          <path d={areaD} fill="#81b64c" fillOpacity="0.12" />

          {/* Main evaluation line */}
          <path
            d={pathD}
            fill="none"
            stroke="#81b64c"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Key turning point markers (Blunders, Misses, Brilliants) */}
          {points.map((pt) => {
            const key = pt.move.classification.key;
            if (key === "blunder") {
              return (
                <circle
                  key={pt.ply}
                  cx={pt.x}
                  cy={pt.y}
                  r="4"
                  fill="#ca3431"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  className="cursor-pointer transition-transform hover:scale-125"
                  onClick={() => onSelectPly(pt.ply)}
                >
                  <title>{`Ply ${pt.ply + 1}: Blunder by ${pt.move.turn === "w" ? "White" : "Black"}`}</title>
                </circle>
              );
            }
            if (key === "brilliant") {
              return (
                <circle
                  key={pt.ply}
                  cx={pt.x}
                  cy={pt.y}
                  r="4"
                  fill="#1baca6"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  className="cursor-pointer transition-transform hover:scale-125"
                  onClick={() => onSelectPly(pt.ply)}
                >
                  <title>{`Ply ${pt.ply + 1}: Brilliant Move by ${pt.move.turn === "w" ? "White" : "Black"}`}</title>
                </circle>
              );
            }
            if (key === "miss") {
              return (
                <circle
                  key={pt.ply}
                  cx={pt.x}
                  cy={pt.y}
                  r="3.5"
                  fill="#df6962"
                  stroke="#ffffff"
                  strokeWidth="1"
                  className="cursor-pointer transition-transform hover:scale-125"
                  onClick={() => onSelectPly(pt.ply)}
                >
                  <title>{`Ply ${pt.ply + 1}: Missed Chance`}</title>
                </circle>
              );
            }
            return null;
          })}

          {/* Active move vertical cursor line */}
          {activePoint && (
            <g>
              <line
                x1={activePoint.x}
                y1={paddingY}
                x2={activePoint.x}
                y2={height - paddingY}
                stroke="#f7c04a"
                strokeWidth="1.5"
              />
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r="5"
                fill="#f7c04a"
                stroke="#161512"
                strokeWidth="2"
              />
            </g>
          )}

          {/* Invisible click targets across columns for fast scrubbing */}
          {points.map((pt) => {
            const stepW = graphWidth / Math.max(1, totalPlies - 1);
            return (
              <rect
                key={pt.ply}
                x={pt.x - stepW / 2}
                y={paddingY}
                width={stepW}
                height={graphHeight}
                fill="transparent"
                className="cursor-pointer"
                onClick={() => onSelectPly(pt.ply)}
              />
            );
          })}
        </svg>
      </div>

      <div className="flex items-center justify-between text-[10px] text-neutral-400 font-medium px-1">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#81b64c]" />
          White Advantage
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-neutral-600" />
          Equal (50%)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          Black Advantage
        </span>
      </div>
    </div>
  );
};
