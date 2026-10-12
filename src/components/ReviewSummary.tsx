"use client";

import React from "react";
import { GameAnalysisReport, MoveClassificationKey } from "@/lib/types";

interface ReviewSummaryProps {
  report: GameAnalysisReport | null;
  whiteName?: string;
  blackName?: string;
}

const CLASSIFICATION_METADATA: {
  key: MoveClassificationKey;
  label: string;
  icon: string;
  color: string;
}[] = [
  { key: "brilliant", label: "Brilliant", icon: "‼️", color: "#1baca6" },
  { key: "best", label: "Best", icon: "⭐", color: "#96bc4b" },
  { key: "excellent", label: "Excellent", icon: "👍", color: "#96bc4b" },
  { key: "good", label: "Good", icon: "•", color: "#86a666" },
  { key: "book", label: "Book", icon: "📖", color: "#d5a47d" },
  { key: "inaccuracy", label: "Inaccuracy", icon: "❓", color: "#f4bf42" },
  { key: "mistake", label: "Mistake", icon: "❓❓", color: "#e68f2a" },
  { key: "blunder", label: "Blunder", icon: "❌", color: "#ca3431" },
  { key: "miss", label: "Miss", icon: "⚠️", color: "#df6962" },
];

export const ReviewSummary: React.FC<ReviewSummaryProps> = ({
  report,
  whiteName = "White",
  blackName = "Black",
}) => {
  if (!report) return null;

  const { whiteAccuracy, blackAccuracy, classificationCounts } = report;

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
          Game Review Breakdown
        </h3>
        <span className="text-xs text-accent-green font-semibold">
          Review Complete
        </span>
      </div>

      {/* Accuracy Comparison Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* White Player */}
        <div className="bg-[#1a1917] border border-border rounded-xl p-3 flex flex-col items-center">
          <span className="text-[11px] font-bold text-neutral-300 truncate max-w-full mb-1">
            ⚪ {whiteName}
          </span>
          <span className="text-3xl font-black font-mono text-accent-green">
            {whiteAccuracy}%
          </span>
          <span className="text-[10px] text-neutral-400 uppercase font-semibold mt-0.5">
            Accuracy
          </span>
        </div>

        {/* Black Player */}
        <div className="bg-[#1a1917] border border-border rounded-xl p-3 flex flex-col items-center">
          <span className="text-[11px] font-bold text-neutral-300 truncate max-w-full mb-1">
            ⚫ {blackName}
          </span>
          <span className="text-3xl font-black font-mono text-accent-green">
            {blackAccuracy}%
          </span>
          <span className="text-[10px] text-neutral-400 uppercase font-semibold mt-0.5">
            Accuracy
          </span>
        </div>
      </div>

      {/* Classification Counts Table */}
      <div className="space-y-1.5 pt-1">
        <div className="grid grid-cols-[1fr_40px_40px] text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-2 pb-1 border-b border-border/60">
          <span>Move Category</span>
          <span className="text-center">W</span>
          <span className="text-center">B</span>
        </div>

        {CLASSIFICATION_METADATA.map((cat) => {
          const countW = classificationCounts.white[cat.key] || 0;
          const countB = classificationCounts.black[cat.key] || 0;

          // Only display if at least one player had this category, or if it's Brilliant/Best/Blunder
          const isKeyCategory = ["brilliant", "best", "blunder", "mistake"].includes(
            cat.key
          );
          if (countW === 0 && countB === 0 && !isKeyCategory) return null;

          return (
            <div
              key={cat.key}
              className="grid grid-cols-[1fr_40px_40px] items-center text-xs py-1 px-2 rounded-lg hover:bg-card-hover/40 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span style={{ color: cat.color }} className="font-bold text-sm">
                  {cat.icon}
                </span>
                <span className="font-medium text-neutral-300">{cat.label}</span>
              </div>
              <span
                className={`text-center font-mono font-bold ${
                  countW > 0 ? "text-neutral-100" : "text-neutral-600"
                }`}
              >
                {countW}
              </span>
              <span
                className={`text-center font-mono font-bold ${
                  countB > 0 ? "text-neutral-100" : "text-neutral-600"
                }`}
              >
                {countB}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
