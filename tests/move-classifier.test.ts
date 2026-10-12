import { describe, it, expect } from "vitest";
import {
  classifyMove,
  isTrueMaterialSacrifice,
  calculateMaterialCount,
} from "@/lib/move-classifier";
import { MoveRecord } from "@/lib/types";

describe("Move Classifier & Conservative Brilliant Rules", () => {
  // Starting position FEN
  const startingFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  // Position after 1. e4
  const fenAfterE4 = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1";

  it("calculates material counts correctly from FEN", () => {
    const mat = calculateMaterialCount(startingFen);
    // 8 pawns (8) + 2 knights (6) + 2 bishops (6) + 2 rooks (10) + 1 queen (9) = 39
    expect(mat.white).toBe(39);
    expect(mat.black).toBe(39);
  });

  it("does NOT classify standard quiet piece development as Brilliant", () => {
    // White plays 2. Nf3 (standard quiet development, move 2 / ply 2)
    const knightMove: MoveRecord = {
      ply: 2,
      moveNumber: 2,
      turn: "w",
      san: "Nf3",
      from: "g1",
      to: "f3",
      piece: "n",
      captured: null,
      fenBefore: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2",
      fenAfter: "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2",
    };

    // Even if winLoss is 0, quiet development must NOT be brilliant!
    const result = classifyMove({
      move: knightMove,
      playerProbBefore: 52,
      playerProbAfter: 52,
      plyIndex: 2,
    });

    expect(result.classification.key).not.toBe("brilliant");
    expect(result.classification.key).toBe("book");
  });

  it("does NOT classify quiet bishop or rook moves as Brilliant", () => {
    // White plays 7. Re1 (quiet rook move, ply 12)
    const rookMove: MoveRecord = {
      ply: 12,
      moveNumber: 7,
      turn: "w",
      san: "Re1",
      from: "f1",
      to: "e1",
      piece: "r",
      captured: null,
      fenBefore: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQ1RK1 w kq - 1 7",
      fenAfter: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQR1K1 b kq - 2 7",
    };

    const result = classifyMove({
      move: rookMove,
      playerProbBefore: 55,
      playerProbAfter: 55,
      plyIndex: 12,
    });

    expect(result.classification.key).not.toBe("brilliant");
    expect(result.classification.key).toBe("best");
  });

  it("classifies a true tactical piece sacrifice maintaining winning edge as Brilliant", () => {
    // White sacrifices a Rook on d7: Rxd7 (giving up a 5-point rook for a 3-point bishop/knight: net material -2)
    const rookSacrifice: MoveRecord = {
      ply: 24,
      moveNumber: 13,
      turn: "w",
      san: "Rxd7",
      from: "d1",
      to: "d7",
      piece: "r",
      captured: "b",
      // White has 1 rook (5), Black has queen (9)
      fenBefore: "4kb1r/p2n1ppp/4q3/4p3/8/5Q2/PP1P1PPP/R1B1K1NR w KQk - 0 13",
      // In fenAfter, White traded rook for knight (-2 net material)
      fenAfter: "4kb1r/p2R1ppp/4q3/4p3/8/5Q2/PP1P1PPP/R1B1K1NR b KQk - 0 13",
    };

    const isSac = isTrueMaterialSacrifice(rookSacrifice);
    expect(isSac).toBe(true);

    const result = classifyMove({
      move: rookSacrifice,
      playerProbBefore: 75,
      playerProbAfter: 75,
      plyIndex: 24,
    });

    expect(result.classification.key).toBe("brilliant");
    expect(result.classification.icon).toBe("‼️");
  });

  it("classifies hanging a piece without compensation as Blunder, not Brilliant", () => {
    // Player hangs queen for free: win probability collapses
    const blunderMove: MoveRecord = {
      ply: 14,
      moveNumber: 8,
      turn: "w",
      san: "Qe4",
      from: "d1",
      to: "e4",
      piece: "q",
      captured: null,
      fenBefore: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1",
      fenAfter: "rnbqkbnr/pppp1ppp/8/4p3/4Q3/8/PPPP1PPP/RNB1KBNR b KQkq - 1 1",
    };

    const result = classifyMove({
      move: blunderMove,
      playerProbBefore: 50,
      playerProbAfter: 15, // Dropped by 35%
      plyIndex: 14,
    });

    expect(result.classification.key).toBe("blunder");
    expect(result.classification.key).not.toBe("brilliant");
  });

  it("classifies forced only-legal moves as Forced / Best", () => {
    // White King on a1 in check by Rook on b2: only 1 legal move (Kxb2)
    const forcedFen = "7k/8/8/8/8/8/1r6/K7 w - - 0 1";
    const forcedMove: MoveRecord = {
      ply: 30,
      moveNumber: 16,
      turn: "w",
      san: "Kxb2",
      from: "a1",
      to: "b2",
      piece: "k",
      captured: "r",
      fenBefore: forcedFen,
      fenAfter: "7k/8/8/8/8/8/1K6/8 b - - 0 1",
    };

    const result = classifyMove({
      move: forcedMove,
      playerProbBefore: 45,
      playerProbAfter: 45,
      plyIndex: 30,
    });

    expect(result.isForced).toBe(true);
    expect(result.classification.name).toBe("Forced");
  });
});
