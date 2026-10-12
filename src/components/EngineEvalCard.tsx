"use client";

import React from "react";
import { UciEvaluation } from "@/lib/uci-protocol";
import { GameAnalysisProgress } from "@/lib/engine-service";
import { GameAnalysisReport } from "@/lib/types";
import { Cpu, Play, Square, Gauge, Zap } from "lucide-react";

interface EngineEvalCardProps {
  evaluation: UciEvaluation | null;
  isAnalyzing: boolean;
  isBatchReviewing: boolean;
  reviewProgress: GameAnalysisProgress | null;
  report: GameAnalysisReport | null;
  targetDepth: number;
  onDepthChange: (depth: number) => void;
  onStartAnalysis: () => void;
  onStopAnalysis: () => void;
  onStartFullReview: () => void;
}

export const EngineEvalCard: React.FC<EngineEvalCardProps> = ({
  evaluation,
  isAnalyzing,
  isBatchReviewing,
  reviewProgress,
  report,
  targetDepth,
  onDepthChange,
  onStartAnalysis,
  onStopAnalysis,
  onStartFullReview,
}) => {
  // Format score display
  const formatScore = (): { text: string; isAdvantageWhite: boolean } => {
    if (!evaluation) return { text: "0.0", isAdvantageWhite: true };

    if (evaluation.whiteMate !== null) {
      return {
        text: `M${Math.abs(evaluation.whiteMate)}`,
        isAdvantageWhite: evaluation.whiteMate > 0,
      };
    }

    if (evaluation.whiteCp !== null) {
      const val = evaluation.whiteCp / 100;
      const formatted = (val >= 0 ? "+" : "") + val.toFixed(1);
      return {
        text: formatted,
        isAdvantageWhite: val >= 0,
      };
    }

    return { text: "0.0", isAdvantageWhite: true };
  };

  const scoreInfo = formatScore();

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-accent-green" />
          <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
            Stockfish Engine Review
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="depth-select" className="text-xs text-neutral-400">
            Depth:
          </label>
          <select
            id="depth-select"
            value={targetDepth}
            onChange={(e) => onDepthChange(parseInt(e.target.value, 10))}
            disabled={isAnalyzing || isBatchReviewing}
            className="bg-[#1a1917] border border-border text-xs rounded-lg px-2 py-1 text-neutral-300 focus:outline-none focus:border-accent-green"
          >
            <option value="10">10 (Fast Review)</option>
            <option value="12">12 (Standard Review)</option>
            <option value="15">15 (Deep Analysis)</option>
          </select>
        </div>
      </div>

      {/* Progress Bar (Visible during Full Game Review) */}
      {isBatchReviewing && reviewProgress && (
        <div className="p-3 rounded-xl bg-[#1a1917] border border-border space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-neutral-300">
              Analyzing Move {reviewProgress.currentPly} of {reviewProgress.totalPlies}...
            </span>
            <span className="font-mono text-accent-green">
              {reviewProgress.percentage}%
            </span>
          </div>
          <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent-green transition-all duration-150 ease-out"
              style={{ width: `${reviewProgress.percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Accuracy Readout when Report is ready */}
      {report && !isBatchReviewing && (
        <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-accent-green/5 border border-accent-green/30">
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase">
              White Accuracy
            </span>
            <span className="text-2xl font-black font-mono text-accent-green">
              {report.whiteAccuracy}%
            </span>
          </div>
          <div className="flex flex-col items-center border-l border-border/60">
            <span className="text-[10px] font-bold text-neutral-400 uppercase">
              Black Accuracy
            </span>
            <span className="text-2xl font-black font-mono text-accent-green">
              {report.blackAccuracy}%
            </span>
          </div>
        </div>
      )}

      {/* Evaluation Numbers & Status */}
      <div className="grid grid-cols-2 gap-3 items-center">
        {/* Score Box */}
        <div className="bg-[#1a1917] border border-border rounded-xl p-3 flex flex-col items-center justify-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-0.5">
            Position Eval
          </span>
          <span
            className={`text-2xl font-black font-mono tracking-tight ${
              scoreInfo.isAdvantageWhite ? "text-accent-green" : "text-amber-400"
            }`}
          >
            {scoreInfo.text}
          </span>
          <span className="text-[10px] text-neutral-400">
            {scoreInfo.isAdvantageWhite ? "White Advantage" : "Black Advantage"}
          </span>
        </div>

        {/* Depth / Speed Box */}
        <div className="bg-[#1a1917] border border-border rounded-xl p-3 flex flex-col items-center justify-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-0.5">
            Search Depth
          </span>
          <div className="flex items-center gap-1.5 text-lg font-black font-mono text-neutral-200">
            <Gauge className="w-4 h-4 text-accent-gold" />
            <span>
              {evaluation?.depth ?? 0} / {targetDepth}
            </span>
          </div>
          <span className="text-[10px] text-neutral-400">
            {isBatchReviewing
              ? "Reviewing game..."
              : isAnalyzing
              ? "Searching position..."
              : "Engine Ready"}
          </span>
        </div>
      </div>

      {/* Best Move & Principal Variation */}
      {evaluation && evaluation.bestMove && (
        <div className="p-3 rounded-xl bg-card-hover/40 border border-border/80 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-neutral-400">Engine Best Move:</span>
            <span className="font-mono font-bold text-accent-green px-2 py-0.5 bg-accent-green/10 border border-accent-green/20 rounded">
              {evaluation.bestMove}
            </span>
          </div>
          {evaluation.pv && evaluation.pv.length > 0 && (
            <div className="text-[11px] text-neutral-400 font-mono truncate">
              <span className="text-neutral-500">Line: </span>
              {evaluation.pv.slice(0, 6).join(" ")}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
        {isAnalyzing || isBatchReviewing ? (
          <button
            onClick={onStopAnalysis}
            className="col-span-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs bg-red-600 hover:bg-red-700 text-white shadow-md transition-all active:scale-95"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Stop Engine Analysis</span>
          </button>
        ) : (
          <>
            <button
              onClick={onStartAnalysis}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-bold text-xs bg-card-hover hover:bg-neutral-700 border border-border text-neutral-200 transition-all active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current text-accent-gold" />
              <span>Eval Position</span>
            </button>

            <button
              onClick={onStartFullReview}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-bold text-xs bg-accent-green hover:bg-accent-green-hover text-white shadow-md shadow-accent-green/20 transition-all active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Review Full Game</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
