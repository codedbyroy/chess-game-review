import { describe, it, expect } from "vitest";
import {
  parseUciInfoLine,
  parseBestMoveLine,
} from "../src/lib/uci-protocol";

describe("UCI Protocol Parser", () => {
  it("should parse standard centipawn evaluation for White's turn", () => {
    const line =
      "info depth 16 seldepth 22 multipv 1 score cp 45 nodes 120500 nps 250000 pv e2e4 e7e5 g1f3 b8c6";
    const parsed = parseUciInfoLine(line, "w");

    expect(parsed).not.toBeNull();
    expect(parsed?.depth).toBe(16);
    expect(parsed?.scoreCp).toBe(45);
    expect(parsed?.whiteCp).toBe(45);
    expect(parsed?.mate).toBeNull();
    expect(parsed?.whiteMate).toBeNull();
    expect(parsed?.pv).toEqual(["e2e4", "e7e5", "g1f3", "b8c6"]);
  });

  it("should normalize centipawns to White's perspective when Black is to move", () => {
    // Black is up by a knight (Black's turn, engine outputs positive score cp +320)
    const line = "info depth 14 score cp 320 pv c6d4 c3d4";
    const parsed = parseUciInfoLine(line, "b");

    expect(parsed).not.toBeNull();
    expect(parsed?.scoreCp).toBe(320); // Raw score from Black's view
    expect(parsed?.whiteCp).toBe(-320); // Normalized from White's view
  });

  it("should parse forced mate for White's turn", () => {
    const line = "info depth 18 score mate 2 pv d1d8 e8d8";
    const parsed = parseUciInfoLine(line, "w");

    expect(parsed).not.toBeNull();
    expect(parsed?.depth).toBe(18);
    expect(parsed?.scoreCp).toBeNull();
    expect(parsed?.whiteCp).toBeNull();
    expect(parsed?.mate).toBe(2);
    expect(parsed?.whiteMate).toBe(2);
    expect(parsed?.pv).toEqual(["d1d8", "e8d8"]);
  });

  it("should normalize mate for Black's turn", () => {
    // Black has mate in 1
    const line = "info depth 15 score mate 1 pv f2f1";
    const parsed = parseUciInfoLine(line, "b");

    expect(parsed).not.toBeNull();
    expect(parsed?.mate).toBe(1);
    expect(parsed?.whiteMate).toBe(-1); // White is being mated in 1
  });

  it("should parse negative mate when being mated", () => {
    // White is getting checkmated in 3
    const line = "info depth 20 score mate -3 pv g1h1 g2g1";
    const parsed = parseUciInfoLine(line, "w");

    expect(parsed).not.toBeNull();
    expect(parsed?.mate).toBe(-3);
    expect(parsed?.whiteMate).toBe(-3);
  });

  it("should parse bestmove with ponder", () => {
    const line = "bestmove e2e4 ponder e7e5";
    const parsed = parseBestMoveLine(line);

    expect(parsed).not.toBeNull();
    expect(parsed?.bestMove).toBe("e2e4");
    expect(parsed?.ponder).toBe("e7e5");
  });

  it("should parse bestmove without ponder", () => {
    const line = "bestmove d8d1#";
    const parsed = parseBestMoveLine(line);

    expect(parsed).not.toBeNull();
    expect(parsed?.bestMove).toBe("d8d1#");
    expect(parsed?.ponder).toBeUndefined();
  });

  it("should return null for non-eval or non-bestmove lines", () => {
    expect(parseUciInfoLine("uciok")).toBeNull();
    expect(parseUciInfoLine("readyok")).toBeNull();
    expect(parseBestMoveLine("info depth 1 score cp 0")).toBeNull();
    expect(parseBestMoveLine("bestmove (none)")).toBeNull();
  });
});
