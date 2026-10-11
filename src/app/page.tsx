"use client";

import React, { useState, useMemo } from "react";
import { Header } from "@/components/Header";
import { Chessboard } from "@/components/Chessboard";
import { BoardControls } from "@/components/BoardControls";
import { MoveList } from "@/components/MoveList";
import { PlayerCard } from "@/components/PlayerCard";
import { PgnModal } from "@/components/PgnModal";
import { parsePgn, SAMPLE_OPERA_GAME } from "@/lib/pgn-parser";
import { ParsedGame } from "@/lib/types";
import { Trophy, Calendar, MapPin, Cpu } from "lucide-react";

export default function HomePage() {
  const [parsedGame, setParsedGame] = useState<ParsedGame>(() =>
    parsePgn(SAMPLE_OPERA_GAME)
  );
  const [currentPlyIndex, setCurrentPlyIndex] = useState<number>(-1);
  const [orientation, setOrientation] = useState<"w" | "b">("w");
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  // Navigation handlers
  const handleGoToMove = (index: number) => {
    const clamped = Math.max(-1, Math.min(index, moves.length - 1));
    setCurrentPlyIndex(clamped);
  };

  const handleFlipBoard = () => {
    setOrientation((prev) => (prev === "w" ? "b" : "w"));
  };

  const handleLoadPgn = (pgnText: string): boolean => {
    const result = parsePgn(pgnText);
    if (result.error || result.moves.length === 0) {
      return false;
    }
    setParsedGame(result);
    setCurrentPlyIndex(-1);
    return true;
  };

  const handleLoadSample = () => {
    handleLoadPgn(SAMPLE_OPERA_GAME);
  };

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
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-[560px_1fr] gap-8 items-start">
        {/* Left Section: Board & Controls */}
        <section className="flex flex-col items-center gap-3 w-full max-w-[560px] mx-auto">
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

          {/* Interactive Chessboard */}
          <Chessboard
            fen={currentFen}
            orientation={orientation}
            lastMove={currentMove}
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

        {/* Right Section: Game Details, Move List, & Analysis Card */}
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

          {/* Synchronized Move List */}
          <MoveList
            moves={moves}
            currentIndex={currentPlyIndex}
            onSelectMove={handleGoToMove}
          />

          {/* Phase 1 Architecture & Upcoming Engine Card */}
          <div className="bg-card/70 border border-border rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-accent-green" />
              <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                Engine Status & Architecture
              </h3>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Phase 1 application foundation is operational. The game board is synchronized with legal FEN state updates across all {moves.length} plies.
            </p>
            <div className="p-3 rounded-lg bg-[#1a1917] border border-border/80 text-[11px] font-mono text-neutral-400 space-y-1">
              <div>• Active Position FEN:</div>
              <div className="text-accent-green break-all select-all">{currentFen}</div>
            </div>
          </div>
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
