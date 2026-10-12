/**
 * UCI (Universal Chess Interface) Protocol Parser for Stockfish.
 */

export interface UciEvaluation {
  depth: number;
  scoreCp: number | null;
  mate: number | null;
  pv: string[];
  bestMove?: string;
  // Scores normalized to White's perspective (+ = White advantage, - = Black advantage)
  whiteCp: number | null;
  whiteMate: number | null;
}

/**
 * Parses a single UCI 'info' line into structured evaluation data.
 * @param line - Raw line from Stockfish (e.g. "info depth 15 score cp 42 pv e2e4 ...")
 * @param turn - Side to move ('w' or 'b') to normalize score to White's perspective
 */
export function parseUciInfoLine(
  line: string,
  turn: "w" | "b" = "w"
): Partial<UciEvaluation> | null {
  if (!line.startsWith("info ") || !line.includes("score ")) {
    return null;
  }

  const result: Partial<UciEvaluation> = {};

  // Extract depth
  const depthMatch = line.match(/\bdepth\s+(\d+)/);
  if (depthMatch) {
    result.depth = parseInt(depthMatch[1], 10);
  }

  // Extract Centipawn score
  const cpMatch = line.match(/\bscore\s+cp\s+(-?\d+)/);
  if (cpMatch) {
    const rawCp = parseInt(cpMatch[1], 10);
    result.scoreCp = rawCp;
    result.whiteCp = turn === "w" ? rawCp : -rawCp;
    result.mate = null;
    result.whiteMate = null;
  }

  // Extract Mate score
  const mateMatch = line.match(/\bscore\s+mate\s+(-?\d+)/);
  if (mateMatch) {
    const rawMate = parseInt(mateMatch[1], 10);
    result.mate = rawMate;
    result.whiteMate = turn === "w" ? rawMate : -rawMate;
    result.scoreCp = null;
    result.whiteCp = null;
  }

  // Extract Principal Variation (PV)
  const pvMatch = line.match(/\bpv\s+(.+)$/);
  if (pvMatch) {
    result.pv = pvMatch[1].trim().split(/\s+/);
  }

  return result;
}

/**
 * Parses a UCI 'bestmove' line.
 * @param line - Raw line from Stockfish (e.g. "bestmove e2e4 ponder e7e5")
 */
export function parseBestMoveLine(
  line: string
): { bestMove: string; ponder?: string } | null {
  if (!line.startsWith("bestmove ")) {
    return null;
  }

  const parts = line.trim().split(/\s+/);
  const bestMove = parts[1];
  if (!bestMove || bestMove === "(none)") {
    return null;
  }

  const ponderIndex = parts.indexOf("ponder");
  const ponder = ponderIndex !== -1 ? parts[ponderIndex + 1] : undefined;

  return {
    bestMove,
    ponder,
  };
}
