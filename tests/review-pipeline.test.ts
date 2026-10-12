import { describe, it, expect } from "vitest";
import {
  centipawnsToWinProbability,
  classifyMove,
  calculatePlayerAccuracy,
  analyzeGameMoves,
} from "../src/lib/review-pipeline";
import { MoveRecord } from "../src/lib/types";
import { UciEvaluation } from "../src/lib/uci-protocol";

describe("Review Pipeline Math & Classifications", () => {
  describe("centipawnsToWinProbability", () => {
    it("should return 50% for equal position (0 cp)", () => {
      expect(centipawnsToWinProbability(0, null)).toBe(50);
      expect(centipawnsToWinProbability(null, null)).toBe(50);
    });

    it("should scale positively with White advantage", () => {
      const prob300 = centipawnsToWinProbability(300, null);
      expect(prob300).toBeGreaterThan(70);
      expect(prob300).toBeLessThan(80);
    });

    it("should scale negatively with Black advantage", () => {
      const probMinus300 = centipawnsToWinProbability(-300, null);
      expect(probMinus300).toBeGreaterThan(20);
      expect(probMinus300).toBeLessThan(30);
    });

    it("should return 100% for forced mate for White", () => {
      expect(centipawnsToWinProbability(null, 3)).toBe(100);
      expect(centipawnsToWinProbability(500, 1)).toBe(100);
    });

    it("should return 0% for forced mate against White", () => {
      expect(centipawnsToWinProbability(null, -2)).toBe(0);
      expect(centipawnsToWinProbability(-800, -1)).toBe(0);
    });
  });

  describe("classifyMove", () => {
    const mockPawnMove: MoveRecord = {
      ply: 0,
      moveNumber: 1,
      turn: "w",
      san: "e4",
      from: "e2",
      to: "e4",
      piece: "p",
      fenBefore: "start",
      fenAfter: "after",
    };

    it("should classify early opening moves as Book", () => {
      const result = classifyMove(mockPawnMove, 50, 50, 1);
      expect(result.classification.key).toBe("book");
      expect(result.winLoss).toBe(0);
    });

    it("should classify moves with minimal win-loss as Best", () => {
      const laterMove = { ...mockPawnMove, ply: 10 };
      const result = classifyMove(laterMove, 55, 54.5, 10);
      expect(result.classification.key).toBe("best");
      expect(result.winLoss).toBeLessThanOrEqual(1.5);
    });

    it("should classify moderate loss as Inaccuracy", () => {
      const laterMove = { ...mockPawnMove, ply: 12 };
      const result = classifyMove(laterMove, 60, 50, 12); // 10% loss
      expect(result.classification.key).toBe("inaccuracy");
      expect(result.winLoss).toBe(10);
    });

    it("should classify severe loss as Blunder", () => {
      const laterMove = { ...mockPawnMove, ply: 14 };
      const result = classifyMove(laterMove, 50, 20, 14); // 30% loss
      expect(result.classification.key).toBe("blunder");
      expect(result.winLoss).toBe(30);
    });

    it("should classify missed winning tactical advantage as Miss", () => {
      const laterMove = { ...mockPawnMove, ply: 16 };
      const result = classifyMove(laterMove, 75, 40, 16); // Dropped from 75% to 40%
      expect(result.classification.key).toBe("miss");
    });

    it("should identify a tactical piece sacrifice as Brilliant", () => {
      const rookSacrifice: MoveRecord = {
        ply: 24,
        moveNumber: 13,
        turn: "w",
        san: "Rxd7",
        from: "d1",
        to: "d7",
        piece: "r",
        captured: "b",
        fenBefore: "4kb1r/p2n1ppp/4q3/4p3/8/5Q2/PP1P1PPP/R1B1K1NR w KQk - 0 13",
        fenAfter: "4kb1r/p2R1ppp/4q3/4p3/8/5Q2/PP1P1PPP/R1B1K1NR b KQk - 0 13",
      };

      const result = classifyMove(rookSacrifice, 75, 75, 24);
      expect(result.classification.key).toBe("brilliant");
      expect(result.classification.icon).toBe("‼️");
    });
  });

  describe("calculatePlayerAccuracy", () => {
    it("should return 99.8% for zero losses and 0 for empty array", () => {
      expect(calculatePlayerAccuracy([0, 0, 0])).toBe(99.8);
      expect(calculatePlayerAccuracy([])).toBe(0);
    });

    it("should compute realistic accuracy for master-level play", () => {
      const masterLosses = [0.5, 1.2, 0, 0.8, 2.0, 1.0];
      const acc = calculatePlayerAccuracy(masterLosses);
      expect(acc).toBeGreaterThan(90);
      expect(acc).toBeLessThan(99);
    });

    it("should drop accuracy for blunder-heavy games", () => {
      const blunderLosses = [0, 5, 25, 30, 20];
      const acc = calculatePlayerAccuracy(blunderLosses);
      expect(acc).toBeLessThan(65);
    });
  });

  describe("analyzeGameMoves", () => {
    it("should analyze a game batch and generate report", () => {
      const moves: MoveRecord[] = [
        {
          ply: 0,
          moveNumber: 1,
          turn: "w",
          san: "e4",
          from: "e2",
          to: "e4",
          piece: "p",
          fenBefore: "fen0",
          fenAfter: "fen1",
        },
        {
          ply: 1,
          moveNumber: 1,
          turn: "b",
          san: "e5",
          from: "e7",
          to: "e5",
          piece: "p",
          fenBefore: "fen1",
          fenAfter: "fen2",
        },
      ];

      const evaluations: UciEvaluation[] = [
        {
          depth: 15,
          scoreCp: 20,
          mate: null,
          pv: [],
          whiteCp: 20,
          whiteMate: null,
        },
        {
          depth: 15,
          scoreCp: -15,
          mate: null,
          pv: [],
          whiteCp: 15,
          whiteMate: null,
        },
      ];

      const report = analyzeGameMoves(moves, evaluations);
      expect(report.moves.length).toBe(2);
      expect(report.whiteAccuracy).toBeGreaterThan(90);
      expect(report.blackAccuracy).toBeGreaterThan(90);
      expect(report.classificationCounts.white.book).toBe(1);
      expect(report.classificationCounts.black.book).toBe(1);
    });
  });
});
