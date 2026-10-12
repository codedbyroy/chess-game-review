"use client";

import React from "react";
import { AnalyzedMove } from "@/lib/types";
import { MessageSquareText, TrendingDown, TrendingUp, Sparkles } from "lucide-react";

interface MoveFeedbackCardProps {
  analyzedMove: AnalyzedMove | null;
}

export const MoveFeedbackCard: React.FC<MoveFeedbackCardProps> = ({
  analyzedMove,
}) => {
  if (!analyzedMove) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-center text-xs text-neutral-500 h-28">
        <span>Select any move after running Game Review to see tactical insights.</span>
      </div>
    );
  }

  const { classification, winLoss, san, moveNumber, turn, bestMoveSan } =
    analyzedMove;
  const isWhite = turn === "w";
  const playerLabel = isWhite ? "White" : "Black";
  const hasAlternative = bestMoveSan && bestMoveSan !== san && winLoss > 2.0;

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-3">
      {/* Header with Classification Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquareText className="w-4 h-4 text-accent-green" />
          <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
            Move Feedback
          </h3>
        </div>

        {/* Classification Pill */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-sm"
          style={{ backgroundColor: classification.color }}
        >
          <span>{classification.icon}</span>
          <span>{classification.name}</span>
        </div>
      </div>

      {/* Move Summary Row */}
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#1a1917] border border-border text-xs">
        <div>
          <span className="text-neutral-400">Played Move: </span>
          <span className="font-mono font-bold text-white">
            {moveNumber}.{isWhite ? "" : ".."} {san}
          </span>
          <span className="text-neutral-500 text-[11px] ml-1.5">
            ({playerLabel})
          </span>
        </div>

        <div className="flex items-center gap-1 font-mono font-semibold">
          {winLoss > 0.5 ? (
            <span className="flex items-center gap-1 text-red-400">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>-{winLoss.toFixed(1)}%</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-accent-green">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Optimal</span>
            </span>
          )}
        </div>
      </div>

      {/* Suggested Alternative (for the moving player from fenBefore) */}
      {hasAlternative && (
        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-card-hover/40 border border-border/80 text-xs">
          <span className="text-neutral-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-accent-gold" />
            <span>Recommended Alternative:</span>
          </span>
          <span className="font-mono font-bold text-accent-green bg-accent-green/10 border border-accent-green/20 px-2 py-0.5 rounded">
            {bestMoveSan}
          </span>
        </div>
      )}

      {/* Contextual Commentary */}
      <p className="text-xs text-neutral-300 leading-relaxed pt-0.5">
        {classification.commentary}
      </p>
    </div>
  );
};
