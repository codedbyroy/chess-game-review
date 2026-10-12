/**
 * Review Pipeline: Win Probability Mapping, Move Classification, & Accuracy Calculation.
 */

import { MoveRecord, AnalyzedMove, GameAnalysisReport, MoveClassification, MoveClassificationKey } from "./types";
import { UciEvaluation } from "./uci-protocol";

/**
 * Maps evaluation (centipawns or mate) to expected win probability percentage (0 - 100) from White's perspective.
 * Uses a logistic sigmoid model standard in modern chess engines.
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
  // Logistic function
  const winProb = 50 + 50 * (2 / (1 + Math.exp(-0.0035 * clamped)) - 1);
  return Math.max(0, Math.min(100, Math.round(winProb * 10) / 10));
}

/**
 * Classifies a single played move based on active player's win-probability drop.
 */
export function classifyMove(
  move: MoveRecord,
  prevWhiteProb: number,
  currWhiteProb: number,
  plyIndex: number
): { classification: MoveClassification; winLoss: number } {
  const turn = move.turn;

  // Calculate active player's win probability before and after the move
  const playerProbBefore = turn === "w" ? prevWhiteProb : 100 - prevWhiteProb;
  const playerProbAfter = turn === "w" ? currWhiteProb : 100 - currWhiteProb;

  // Win probability lost (non-negative)
  const delta = playerProbAfter - playerProbBefore;
  const winLoss = Math.max(0, -delta);

  // Default classification
  let classification: MoveClassification = {
    key: "good",
    name: "Good",
    icon: "",
    color: "#86a666",
    commentary: "A solid practical move.",
  };

  // 1. Opening Book Move (first 6 plies with minimal loss)
  if (plyIndex < 6 && winLoss <= 2.0) {
    classification = {
      key: "book",
      name: "Book",
      icon: "📖",
      color: "#d5a47d",
      commentary: "Theoretical opening move.",
    };
    return { classification, winLoss };
  }

  // 2. Brilliant Move check (tactical piece sacrifice preserving winning advantage)
  const isPieceSacrifice =
    move.captured === null &&
    ["n", "b", "r", "q"].includes(move.piece) &&
    playerProbBefore >= 45.0 &&
    playerProbAfter >= 45.0;

  if (isPieceSacrifice && winLoss <= 1.0) {
    classification = {
      key: "brilliant",
      name: "Brilliant",
      icon: "‼️",
      color: "#1baca6",
      commentary: "A brilliant piece sacrifice maintaining complete tactical control!",
    };
    return { classification, winLoss };
  }

  // 3. Best Move
  if (winLoss <= 1.5) {
    classification = {
      key: "best",
      name: "Best",
      icon: "⭐",
      color: "#96bc4b",
      commentary: "The strongest engine move in the position.",
    };
  }
  // 4. Excellent Move
  else if (winLoss <= 4.0) {
    classification = {
      key: "excellent",
      name: "Excellent",
      icon: "👍",
      color: "#96bc4b",
      commentary: "An excellent continuation maintaining a strong position.",
    };
  }
  // 5. Good Move
  else if (winLoss <= 8.0) {
    classification = {
      key: "good",
      name: "Good",
      icon: "",
      color: "#86a666",
      commentary: "A good practical move.",
    };
  }
  // 6. Inaccuracy
  else if (winLoss <= 15.0) {
    classification = {
      key: "inaccuracy",
      name: "Inaccuracy",
      icon: "❓",
      color: "#f4bf42",
      commentary: "An inaccuracy. Missed a slightly more active continuation.",
    };
  }
  // 7. Mistake
  else if (winLoss <= 25.0) {
    classification = {
      key: "mistake",
      name: "Mistake",
      icon: "❓❓",
      color: "#e68f2a",
      commentary: "A mistake! Surrendered a significant portion of advantage.",
    };
  }
  // 8. Missed Win / Blunder
  else {
    // If player held a decisive advantage and lost it completely
    if (playerProbBefore >= 65.0 && playerProbAfter <= 45.0) {
      classification = {
        key: "miss",
        name: "Miss",
        icon: "⚠️",
        color: "#df6962",
        commentary: "Missed win! Overlooked an immediate winning tactical blow.",
      };
    } else {
      classification = {
        key: "blunder",
        name: "Blunder",
        icon: "❌",
        color: "#ca3431",
        commentary: "A severe blunder that fundamentally alters the game outcome.",
      };
    }
  }

  return { classification, winLoss };
}

/**
 * Calculates overall player accuracy rating (0 - 100%) from win losses.
 */
export function calculatePlayerAccuracy(winLosses: number[]): number {
  if (!winLosses || winLosses.length === 0) return 100;

  const avgLoss = winLosses.reduce((acc, cur) => acc + cur, 0) / winLosses.length;
  if (avgLoss === 0) return 100;

  // Exponential decay model
  const rawAccuracy = 100 * Math.exp(-0.035 * avgLoss);
  return Math.max(10.0, Math.min(99.8, Math.round(rawAccuracy * 10) / 10));
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
 * Analyzes an entire sequence of moves using position evaluations.
 */
export function analyzeGameMoves(
  moves: MoveRecord[],
  evaluations: UciEvaluation[]
): GameAnalysisReport {
  const analyzedMoves: AnalyzedMove[] = [];
  const whiteLosses: number[] = [];
  const blackLosses: number[] = [];

  const counts = {
    white: createEmptyCounts(),
    black: createEmptyCounts(),
  };

  let prevWhiteProb = 50.0; // Start at equal position (50%)

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

    const { classification, winLoss } = classifyMove(
      move,
      prevWhiteProb,
      currWhiteProb,
      i
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
    });

    prevWhiteProb = currWhiteProb;
  }

  return {
    moves: analyzedMoves,
    whiteAccuracy: calculatePlayerAccuracy(whiteLosses),
    blackAccuracy: calculatePlayerAccuracy(blackLosses),
    classificationCounts: counts,
  };
}
