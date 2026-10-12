"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { Chessboard } from "@/components/Chessboard";
import { BoardControls } from "@/components/BoardControls";
import { MoveList } from "@/components/MoveList";
import { PlayerCard } from "@/components/PlayerCard";
import { PgnModal } from "@/components/PgnModal";
import { EngineEvalCard } from "@/components/EngineEvalCard";
import { parsePgn, SAMPLE_OPERA_GAME } from "@/lib/pgn-parser";
import { ParsedGame, GameAnalysisReport } from "@/lib/types";
import { UciEvaluation } from "@/lib/uci-protocol";
import { EngineService, GameAnalysisProgress } from "@/lib/engine-service";
import { Trophy, Calendar, MapPin } from "lucide-react";

export default function HomePage() {
  const [parsedGame, setParsedGame] = useState<ParsedGame>(() =>
    parsePgn(SAMPLE_OPERA_GAME)
  );
  const [currentPlyIndex, setCurrentPlyIndex] = useState<number>(-1);
  const [orientation, setOrientation] = useState<"w" | "b">("w");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Single-position engine state
  const [evaluation, setEvaluation] = useState<UciEvaluation | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [targetDepth, setTargetDepth] = useState<number>(15);

  // Full-game review batch state
  const [isBatchReviewing, setIsBatchReviewing] = useState(false);
  const [reviewProgress, setReviewProgress] = useState<GameAnalysisProgress | null>(null);
  const [analysisReport, setAnalysisReport] = useState<GameAnalysisReport | null>(null);

  const engineServiceRef = useRef<EngineService | null>(null);

  // Initialize engine service once on mount
  useEffect(() => {
    engineServiceRef.current = new EngineService();
    return () => {
      engineServiceRef.current?.terminate();
    };
  }, []);

  const moves = parsedGame.moves;
  const metadata = parsedGame.metadata;

  // Active FEN based on navigation index
  const currentFen = useMemo(() => {
    if (currentPlyIndex < 0 || moves.length === 0) {
      return parsedGame.startingFen;
    }
    const safeIndex = Math.min(currentPlyIndex, moves.length - 1);
    return moves[safeIndex].fenAfter;
  }, [currentPlyIndex, moves, parsedGame.startingFen]);

  // Active Move Record (for square highlights)
  const currentMove = useMemo(() => {
    if (currentPlyIndex < 0 || moves.length === 0) return null;
    return moves[currentPlyIndex] || null;
  }, [currentPlyIndex, moves]);

  // Navigation handler
  const handleGoToMove = (index: number) => {
    if (isAnalyzing || isBatchReviewing) {
      engineServiceRef.current?.stop();
      setIsAnalyzing(false);
      setIsBatchReviewing(false);
    }
    const clamped = Math.max(-1, Math.min(index, moves.length - 1));
    setCurrentPlyIndex(clamped);

    // If report exists for this move, load its evaluation
    if (analysisReport && clamped >= 0 && analysisReport.moves[clamped]) {
      setEvaluation(analysisReport.moves[clamped].evaluation);
    } else {
      setEvaluation(null);
    }
  };

  const handleFlipBoard = () => {
    setOrientation((prev) => (prev === "w" ? "b" : "w"));
  };

  const handleLoadPgn = (pgnText: string): boolean => {
    if (isAnalyzing || isBatchReviewing) {
      engineServiceRef.current?.stop();
      setIsAnalyzing(false);
      setIsBatchReviewing(false);
    }
    const result = parsePgn(pgnText);
    if (result.error || result.moves.length === 0) {
      return false;
    }
    setParsedGame(result);
    setCurrentPlyIndex(-1);
    setEvaluation(null);
    setAnalysisReport(null);
    setReviewProgress(null);
    return true;
  };

  const handleLoadSample = () => {
    handleLoadPgn(SAMPLE_OPERA_GAME);
  };

  // Start single-position analysis
  const handleStartAnalysis = useCallback(async () => {
    if (!engineServiceRef.current) return;
    setIsAnalyzing(true);
    setEvaluation(null);

    try {
      const finalEval = await engineServiceRef.current.evaluatePosition({
        fen: currentFen,
        depth: targetDepth,
        onProgress: (progress) => {
          setEvaluation({ ...progress });
        },
      });
      setEvaluation(finalEval);
    } catch (err) {
      console.error("[HomePage] Analysis error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [currentFen, targetDepth]);

  // Start full game review batch
  const handleStartFullReview = useCallback(async () => {
    if (!engineServiceRef.current || moves.length === 0) return;
    setIsBatchReviewing(true);
    setAnalysisReport(null);

    try {
      const report = await engineServiceRef.current.analyzeEntireGame(
        moves,
        targetDepth,
        (progress) => {
          setReviewProgress(progress);
          setCurrentPlyIndex(progress.currentPly - 1);
          setEvaluation(progress.currentEval);
        }
      );

      setAnalysisReport(report);
      setCurrentPlyIndex(0);
      setEvaluation(report.moves[0]?.evaluation || null);
    } catch (err) {
      console.error("[HomePage] Full game review error:", err);
    } finally {
      setIsBatchReviewing(false);
      setReviewProgress(null);
    }
  }, [moves, targetDepth]);

  // Stop analysis handler
  const handleStopAnalysis = useCallback(() => {
    engineServiceRef.current?.stop();
    setIsAnalyzing(false);
    setIsBatchReviewing(false);
    setReviewProgress(null);
  }, []);

  // Determine active turn for player cards
  const activeTurn = useMemo(() => {
    if (currentPlyIndex < 0) return "w";
    return currentPlyIndex % 2 === 0 ? "b" : "w";
  }, [currentPlyIndex]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Top Header */}
      <Header
        onOpenImport={() => setIsModalOpen(true)}
        onLoadSample={handleLoadSample}
      />

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-[580px_1fr] gap-8 items-start">
        {/* Left Section: Board & Controls */}
        <section className="flex flex-col items-center gap-3 w-full max-w-[580px] mx-auto">
          {/* Top Player Card */}
          <div className="w-full">
            <PlayerCard
              color={orientation === "w" ? "b" : "w"}
              name={
                orientation === "w"
                  ? metadata.Black || metadata.black || "Black"
                  : metadata.White || metadata.white || "White"
              }
              rating={
                orientation === "w"
                  ? metadata.BlackElo || metadata.blackElo
                  : metadata.WhiteElo || metadata.whiteElo
              }
              isTurn={activeTurn === (orientation === "w" ? "b" : "w")}
            />
          </div>

          {/* Interactive Chessboard with Dynamic Eval Bar */}
          <Chessboard
            fen={currentFen}
            orientation={orientation}
            lastMove={currentMove}
            evaluation={evaluation}
          />

          {/* Bottom Player Card */}
          <div className="w-full">
            <PlayerCard
              color={orientation === "w" ? "w" : "b"}
              name={
                orientation === "w"
                  ? metadata.White || metadata.white || "White"
                  : metadata.Black || metadata.black || "Black"
              }
              rating={
                orientation === "w"
                  ? metadata.WhiteElo || metadata.whiteElo
                  : metadata.BlackElo || metadata.blackElo
              }
              isTurn={activeTurn === (orientation === "w" ? "w" : "b")}
            />
          </div>

          {/* Navigation Controls */}
          <BoardControls
            currentIndex={currentPlyIndex}
            totalMoves={moves.length}
            onGoToMove={handleGoToMove}
            onFlipBoard={handleFlipBoard}
          />
        </section>

        {/* Right Section: Game Details, Move List, & Engine Review Card */}
        <section className="flex flex-col gap-5 w-full">
          {/* Game Metadata Card */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-accent-green uppercase tracking-wider">
                {metadata.ECO ? `ECO: ${metadata.ECO}` : "Standard Chess Game"}
              </span>
              {metadata.Result && (
                <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
                  Result: {metadata.Result}
                </span>
              )}
            </div>

            <h2 className="text-xl font-extrabold text-foreground tracking-tight">
              {metadata.White || metadata.white || "White"} vs.{" "}
              {metadata.Black || metadata.black || "Black"}
            </h2>

            <div className="flex flex-wrap gap-4 text-xs text-neutral-400 pt-1">
              {metadata.Event && (
                <div className="flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-accent-gold" />
                  <span>{metadata.Event}</span>
                </div>
              )}
              {metadata.Site && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{metadata.Site}</span>
                </div>
              )}
              {metadata.Date && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{metadata.Date}</span>
                </div>
              )}
            </div>
          </div>

          {/* Synchronized Move List with Classification Badges */}
          <MoveList
            moves={moves}
            currentIndex={currentPlyIndex}
            report={analysisReport}
            onSelectMove={handleGoToMove}
          />

          {/* Live Engine Review Card */}
          <EngineEvalCard
            evaluation={evaluation}
            isAnalyzing={isAnalyzing}
            isBatchReviewing={isBatchReviewing}
            reviewProgress={reviewProgress}
            report={analysisReport}
            targetDepth={targetDepth}
            onDepthChange={setTargetDepth}
            onStartAnalysis={handleStartAnalysis}
            onStopAnalysis={handleStopAnalysis}
            onStartFullReview={handleStartFullReview}
          />
        </section>
      </main>

      {/* PGN Ingestion Modal */}
      <PgnModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onLoadPgn={handleLoadPgn}
      />
    </div>
  );
}
