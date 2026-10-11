import { describe, it, expect } from "vitest";
import { parsePgn, extractHeaders, SAMPLE_OPERA_GAME } from "../src/lib/pgn-parser";

describe("PGN Parser", () => {
  it("should extract metadata headers correctly", () => {
    const headers = extractHeaders(SAMPLE_OPERA_GAME);
    expect(headers.White).toBe("Paul Morphy");
    expect(headers.white).toBe("Paul Morphy");
    expect(headers.Black).toBe("Duke Karl / Count Isouard");
    expect(headers.Result).toBe("1-0");
    expect(headers.ECO).toBe("C41");
  });

  it("should parse Morphy's Opera Game with all 33 plies", () => {
    const parsed = parsePgn(SAMPLE_OPERA_GAME);
    expect(parsed.error).toBeNull();
    expect(parsed.moves.length).toBe(33);

    // Check first move: 1. e4
    const firstMove = parsed.moves[0];
    expect(firstMove.san).toBe("e4");
    expect(firstMove.turn).toBe("w");
    expect(firstMove.moveNumber).toBe(1);
    expect(firstMove.from).toBe("e2");
    expect(firstMove.to).toBe("e4");
    expect(firstMove.fenBefore).toBe("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
    expect(firstMove.fenAfter).toMatch(/^rnbqkbnr\/pppppppp\/8\/8\/4P3\/8\/PPPP1PPP\/RNBQKBNR b KQkq/);

    // Check Queenside Castle (Move 12: O-O-O)
    const castleMove = parsed.moves.find((m) => m.san === "O-O-O");
    expect(castleMove).toBeDefined();
    expect(castleMove?.turn).toBe("w");
    expect(castleMove?.from).toBe("e1");
    expect(castleMove?.to).toBe("c1");

    // Check Final Checkmate move (33: Rd8#)
    const lastMove = parsed.moves[parsed.moves.length - 1];
    expect(lastMove.san).toBe("Rd8#");
    expect(lastMove.turn).toBe("w");
  });

  it("should return an error for malformed PGN", () => {
    const malformedPgn = `1. e4 e5 2. Qh5 Ke7 3. Qxe5# 4. InvalidMove99`;
    const parsed = parsePgn(malformedPgn);
    expect(parsed.error).not.toBeNull();
    expect(parsed.moves.length).toBe(0);
  });

  it("should handle empty PGN gracefully", () => {
    const parsed = parsePgn("");
    expect(parsed.error).toBe("PGN text cannot be empty.");
    expect(parsed.moves.length).toBe(0);
  });

  it("should handle pawn promotion games correctly", () => {
    // Short promotion sequence
    const promotionPgn = `1. e4 d5 2. exd5 c6 3. dxc6 Nf6 4. cxb7 e6 5. bxa8=Q`;
    const parsed = parsePgn(promotionPgn);
    expect(parsed.error).toBeNull();
    const promoMove = parsed.moves.find((m) => m.promotion === "q");
    expect(promoMove).toBeDefined();
    expect(promoMove?.san).toBe("bxa8=Q");
  });
});
