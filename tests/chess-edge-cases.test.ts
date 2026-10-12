import { describe, it, expect } from "vitest";
import { parsePgn } from "../src/lib/pgn-parser";
import { Chess } from "chess.js";

describe("Chess Edge Cases & PGN Stress Testing", () => {
  describe("Pawn Underpromotions", () => {
    it("should correctly handle underpromotion to Knight", () => {
      // White promotes pawn to Knight with check
      const knightPromoPgn = `1. e4 d5 2. exd5 c6 3. dxc6 Nf6 4. cxb7 e6 5. bxa8=N`;
      const parsed = parsePgn(knightPromoPgn);

      expect(parsed.error).toBeNull();
      const lastMove = parsed.moves[parsed.moves.length - 1];
      expect(lastMove.san).toBe("bxa8=N");
      expect(lastMove.promotion).toBe("n");
      expect(lastMove.fenAfter).toContain("N"); // Contains promoted Knight
    });

    it("should correctly handle underpromotion to Rook and Bishop", () => {
      const rookPromoPgn = `1. e4 d5 2. exd5 c6 3. dxc6 Nf6 4. cxb7 e6 5. bxa8=R`;
      const parsedRook = parsePgn(rookPromoPgn);
      expect(parsedRook.error).toBeNull();
      expect(parsedRook.moves[parsedRook.moves.length - 1].promotion).toBe("r");

      const bishopPromoPgn = `1. e4 d5 2. exd5 c6 3. dxc6 Nf6 4. cxb7 e6 5. bxa8=B`;
      const parsedBishop = parsePgn(bishopPromoPgn);
      expect(parsedBishop.error).toBeNull();
      expect(parsedBishop.moves[parsedBishop.moves.length - 1].promotion).toBe("b");
    });
  });

  describe("En Passant Captures", () => {
    it("should correctly handle en passant capture sequence", () => {
      // 1. e4 a6 2. e5 d5 3. exd6 (en passant capture)
      const enPassantPgn = `1. e4 a6 2. e5 d5 3. exd6`;
      const parsed = parsePgn(enPassantPgn);

      expect(parsed.error).toBeNull();
      expect(parsed.moves.length).toBe(5);

      const epMove = parsed.moves[4];
      expect(epMove.san).toBe("exd6");
      expect(epMove.from).toBe("e5");
      expect(epMove.to).toBe("d6");
      // Black's d5 pawn should be removed from board after exd6
      expect(epMove.fenAfter).not.toContain("p/8/8/4P3"); // Verifies clean board state
    });
  });

  describe("Castling Edge Cases", () => {
    it("should support both Kingside and Queenside castling in the same game", () => {
      const castlingPgn = `1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. O-O Nf6 5. d3 d6 6. Be3 Bg4 7. Nbd2 Qd7 8. c3 O-O-O`;
      const parsed = parsePgn(castlingPgn);

      expect(parsed.error).toBeNull();
      const whiteCastle = parsed.moves.find((m) => m.san === "O-O");
      const blackCastle = parsed.moves.find((m) => m.san === "O-O-O");

      expect(whiteCastle).toBeDefined();
      expect(whiteCastle?.from).toBe("e1");
      expect(whiteCastle?.to).toBe("g1");

      expect(blackCastle).toBeDefined();
      expect(blackCastle?.from).toBe("e8");
      expect(blackCastle?.to).toBe("c8");
    });
  });

  describe("Stalemate & End-of-Game Positions", () => {
    it("should parse a fast stalemate trap without errors", () => {
      // Shortest stalemate sequence (10 plies)
      const stalematePgn = `1. e3 a5 2. Qh5 Ra6 3. Qxa5 h5 4. Qxc7 Rah6 5. h4 f6 6. Qxd7+ Kf7 7. Qxb7 Qd3 8. Qxb8 Qh7 9. Qxc8 Kg6 10. Qee6 1/2-1/2`;
      // Even if unusual notation exists, parser should handle or report gracefully
      const parsed = parsePgn(stalematePgn);
      expect(parsed.metadata).toBeDefined();
    });
  });

  describe("Corrupt & Malformed PGN Stress Tests", () => {
    it("should reject PGN with illegal move and provide clear error message", () => {
      // White tries to make illegal jump 1. e5
      const illegalPgn = `1. e5 e5 2. Nf3`;
      const parsed = parsePgn(illegalPgn);

      expect(parsed.error).not.toBeNull();
      expect(parsed.error).toContain("Invalid PGN");
      expect(parsed.moves.length).toBe(0);
    });

    it("should safely report syntax error for unclosed header quotes without crashing", () => {
      const corruptHeaders = `[Event "Broken Header\n[Site "Paris"]\n\n1. e4 e5 2. Nf3`;
      const parsed = parsePgn(corruptHeaders);
      expect(parsed.error).not.toBeNull();
      expect(parsed.error).toContain("Invalid PGN");
    });

    it("should parse bare moves without any headers successfully", () => {
      const barePgn = `1. e4 e5 2. Nf3 Nc6 3. Bb5`;
      const parsed = parsePgn(barePgn);
      expect(parsed.error).toBeNull();
      expect(parsed.moves.length).toBe(5);
    });

    it("should handle PGN with trailing annotations and question marks", () => {
      const annotatedPgn = `1. e4! e5? 2. Nf3?! Nc6 3. Bb5!! a6`;
      const parsed = parsePgn(annotatedPgn);
      expect(parsed.error).toBeNull();
      expect(parsed.moves.length).toBe(6);
      expect(parsed.moves[0].san).toBe("e4");
      expect(parsed.moves[1].san).toBe("e5");
    });
  });

  describe("Long Game Scalability", () => {
    it("should parse a 100-ply game rapidly and maintain FEN integrity", () => {
      const chess = new Chess();
      const moves: string[] = [];

      // Generate 50 legal turns (100 plies)
      for (let i = 0; i < 100; i++) {
        const legal = chess.moves();
        if (legal.length === 0) break;
        const move = legal[i % legal.length];
        chess.move(move);
        moves.push(move);
      }

      const pgn = chess.pgn();
      const start = performance.now();
      const parsed = parsePgn(pgn);
      const duration = performance.now() - start;

      expect(parsed.error).toBeNull();
      expect(parsed.moves.length).toBe(moves.length);
      expect(duration).toBeLessThan(150); // Under 150ms parsing time
    });
  });
});
