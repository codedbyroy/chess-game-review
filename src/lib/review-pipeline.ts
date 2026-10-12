/**
 * Review Pipeline: Coordinates Position Analysis, Move Classification, & Accuracy Calculation.
 */

import { Chess } from "chess.js";
import {
  MoveRecord,
  AnalyzedMove,
  GameAnalysisReport,
  MoveClassification,
  MoveClassificationKey,
} from "./types";
import { UciEvaluation } from "./uci-protocol";
import { classifyMove as classifyMoveInternal } from "./move-classifier";
import { calculatePlayerAccuracy } from "./accuracy-engine";

export { calculatePlayerAccuracy };

/**
 * Converts a UCI move string (e.g. "g1f3", "e7e8q") into Standard Algebraic Notation (e.g. "Nf3", "e8=Q")
 * using the board state in the given FEN.
 */
export function uciToSan(fen: string, uciMove?: string): string | undefined {
  if (!uciMove || uciMove.length < 4) return undefined;
  try {
    const chess = new Chess(fen);
    const from = uciMove.slice(0, 2);
    const to = uciMove.slice(2, 4);
    const promotion = uciMove.length > 4 ? uciMove[4].toLowerCase() : undefined;
    const move = chess.move({ from, to, promotion });
    return move ? move.san : uciMove;
  } catch {
    return uciMove;
  }
}

/**
 * Maps evaluation (centipawns or mate) to expected win probability percentage (0 - 100) from White's perspective.
 * Accounts for mate distance rather than collapsing all mates to a flat 100%.
 */
export function centipawnsToWinProbability(
  whiteCp: number | null,
  whiteMate: number | null
): number {
  if (whiteMate !== null && whiteMate !== undefined) {
    return whiteMate > 0 ? 100 : 0;
  }

  if (whiteCp === null || whiteCp === undefined) {
    return 50;
  }

  // Bound centipawns to avoid overflow
  const clamped = Math.max(-2000, Math.min(2000, whiteCp));
  // Logistic sigmoid model: W = 50 + 50 * (2 / (1 + exp(-0.0035 * cp)) - 1)
  const winProb = 50 + 50 * (2 / (1 + Math.exp(-0.0035 * clamped)) - 1);
  return Math.max(0, Math.min(100, Math.round(winProb * 10) / 10));
}

/**
 * Backward-compatible wrapper for classifyMove.
 */
export function classifyMove(
  move: MoveRecord,
  prevWhiteProb: number,
  currWhiteProb: number,
  plyIndex: number,
  engineBestUci?: string
): { classification: MoveClassification; winLoss: number; isForced: boolean } {
  const turn = move.turn;
  const playerProbBefore = turn === "w" ? prevWhiteProb : 100 - prevWhiteProb;
  const playerProbAfter = turn === "w" ? currWhiteProb : 100 - currWhiteProb;

  return classifyMoveInternal({
    move,
    playerProbBefore,
    playerProbAfter,
    plyIndex,
    engineBestUci,
  });
}

/**
 * Creates empty classification counter object.
 */
function createEmptyCounts(): Record<MoveClassificationKey, number> {
  return {
    brilliant: 0,
    best: 0,
    excellent: 0,
    good: 0,
    book: 0,
    inaccuracy: 0,
    mistake: 0,
    blunder: 0,
    miss: 0,
  };
}

/**
 * Analyzes an entire sequence of game moves using position evaluations.
 * Generates canonical move classifications, recommended alternatives from fenBefore,
 * and player accuracy scores.
 */
export function analyzeGameMoves(
  moves: MoveRecord[],
  evaluations: UciEvaluation[],
  startingEval?: UciEvaluation
): GameAnalysisReport {
  const analyzedMoves: AnalyzedMove[] = [];
  const whiteLosses: number[] = [];
  const blackLosses: number[] = [];

  const counts = {
    white: createEmptyCounts(),
    black: createEmptyCounts(),
  };

  // Initial win probability at the start of the game
  let prevWhiteProb = startingEval
    ? centipawnsToWinProbability(startingEval.whiteCp, startingEval.whiteMate)
    : 50.0;

  for (let i = 0; i < moves.length; i++) {
    const move = moves[i];
    const evaluation = evaluations[i] || {
      depth: 0,
      scoreCp: 0,
      mate: null,
      pv: [],
      whiteCp: 0,
      whiteMate: null,
    };

    const currWhiteProb = centipawnsToWinProbability(
      evaluation.whiteCp,
      evaluation.whiteMate
    );

    // Get the evaluation before this move to determine engine's suggested alternative for active player
    const beforeEval = i === 0 ? startingEval : evaluations[i - 1];
    const bestMoveUci = beforeEval?.bestMove;
    const bestMoveSan = uciToSan(move.fenBefore, bestMoveUci);

    const { classification, winLoss, isForced } = classifyMove(
      move,
      prevWhiteProb,
      currWhiteProb,
      i,
      bestMoveUci
    );

    if (move.turn === "w") {
      whiteLosses.push(winLoss);
      counts.white[classification.key]++;
    } else {
      blackLosses.push(winLoss);
      counts.black[classification.key]++;
    }

    analyzedMoves.push({
      ...move,
      evaluation,
      winProbWhite: currWhiteProb,
      winLoss,
      classification,
      bestMoveSan,
      bestMoveUci,
      isForced,
    });

    prevWhiteProb = currWhiteProb;
  }

  const whiteTotal = Math.ceil(moves.length / 2);
  const blackTotal = Math.floor(moves.length / 2);

  return {
    moves: analyzedMoves,
    whiteAccuracy: calculatePlayerAccuracy(whiteLosses, whiteLosses.length, whiteTotal),
    blackAccuracy: calculatePlayerAccuracy(blackLosses, blackLosses.length, blackTotal),
    classificationCounts: counts,
  };
}
