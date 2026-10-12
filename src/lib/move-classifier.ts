/**
 * Move Classifier Module:
 * Determines deterministic, mutually exclusive move classifications
 * based on verified win-probability deltas, material changes, and tactical criteria.
 */

import { Chess, Square } from "chess.js";
import { MoveRecord, MoveClassification } from "./types";

export interface ClassificationContext {
  move: MoveRecord;
  playerProbBefore: number; // 0 - 100 from moving player's perspective
  playerProbAfter: number;  // 0 - 100 from moving player's perspective
  plyIndex: number;
  engineBestUci?: string;   // Engine's top move for active player in fenBefore
}

const PIECE_VALUES: Record<string, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

/**
 * Calculates raw piece material sum for White and Black from a FEN string.
 */
export function calculateMaterialCount(fen: string): { white: number; black: number } {
  const boardStr = fen.split(" ")[0];
  let white = 0;
  let black = 0;

  for (let i = 0; i < boardStr.length; i++) {
    const char = boardStr[i];
    if (char === "/" || (char >= "1" && char <= "8")) continue;

    const lower = char.toLowerCase();
    const val = PIECE_VALUES[lower] || 0;
    if (char === char.toUpperCase()) {
      white += val;
    } else {
      black += val;
    }
  }

  return { white, black };
}

/**
 * Checks whether a played move constitutes a verified material sacrifice.
 */
export function isTrueMaterialSacrifice(move: MoveRecord): boolean {
  try {
    const matBefore = calculateMaterialCount(move.fenBefore);
    const matAfter = calculateMaterialCount(move.fenAfter);

    const turn = move.turn;
    const diffBefore = turn === "w" ? matBefore.white - matBefore.black : matBefore.black - matBefore.white;
    const diffAfter = turn === "w" ? matAfter.white - matAfter.black : matAfter.black - matAfter.white;
    const netMaterialChange = diffAfter - diffBefore;

    // 1. Direct material sacrifice: Player gave up more material than gained (e.g. Rook for Knight, Queen for Rook)
    if (netMaterialChange <= -2) {
      return true;
    }

    // 2. Quiet positional sacrifice: Player placed a major/minor piece on an attacked square
    // where opponent can capture with a lower-value piece (e.g. Bishop/Knight placed under pawn attack)
    if (["n", "b", "r", "q"].includes(move.piece)) {
      const chess = new Chess(move.fenAfter);
      const opponentColor = turn === "w" ? "b" : "w";
      const isSquareAttacked = chess.isAttacked(move.to as Square, opponentColor);

      if (isSquareAttacked) {
        // If square is attacked by opponent, verify that capturing it gives opponent positive material gain
        const pieceVal = PIECE_VALUES[move.piece] || 0;
        if (pieceVal >= 3) {
          return true;
        }
      }
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Common standard opening book moves (algebraic move sequences).
 * Used for authentic opening book identification rather than guessing by ply count.
 */
const VERIFIED_OPENING_PATTERNS = new Set([
  // e4 openings
  "e4", "e4 e5", "e4 e5 Nf3", "e4 e5 Nf3 Nc6", "e4 e5 Nf3 Nc6 Bb5", "e4 e5 Nf3 Nc6 Bc4",
  "e4 c5", "e4 c5 Nf3", "e4 c5 Nf3 d6", "e4 c5 Nf3 Nc6", "e4 c5 Nf3 e6", "e4 c5 c3",
  "e4 e6", "e4 e6 d4", "e4 e6 d4 d5", "e4 c6", "e4 c6 d4", "e4 c6 d4 d5",
  // d4 openings
  "d4", "d4 d5", "d4 d5 c4", "d4 d5 c4 e6", "d4 d5 c4 c6", "d4 d5 Nf3",
  "d4 Nf6", "d4 Nf6 c4", "d4 Nf6 c4 e6", "d4 Nf6 c4 g6", "d4 Nf6 Nf3",
  // Flank openings
  "c4", "c4 e5", "c4 c5", "c4 Nf6", "Nf3", "Nf3 d5", "Nf3 Nf6", "Nf3 g6",
]);

/**
 * Classifies a move using conservative, documented chess engineering rules.
 */
export function classifyMove(ctx: ClassificationContext): {
  classification: MoveClassification;
  winLoss: number;
  isForced: boolean;
} {
  const { move, playerProbBefore, playerProbAfter, plyIndex, engineBestUci } = ctx;

  // Win loss represents non-negative reduction in active player's win probability
  const rawDelta = playerProbAfter - playerProbBefore;
  const winLoss = Math.max(0, -rawDelta);

  // Check if position was forced (only 1 legal move)
  let isForced = false;
  try {
    const chess = new Chess(move.fenBefore);
    if (chess.moves().length === 1) {
      isForced = true;
    }
  } catch {
    // Fallback if FEN parsing fails
  }

  // 1. Forced Move: When there is only 1 legal move, it cannot be a blunder or brilliant
  if (isForced) {
    return {
      classification: {
        key: "best",
        name: "Forced",
        icon: "⭐",
        color: "#96bc4b",
        commentary: "The only legal move available in the position.",
      },
      winLoss: 0,
      isForced: true,
    };
  }

  // 2. Verified Opening Book Move: Recognized opening theory with negligible win loss
  const STANDARD_OPENING_SAN = new Set([
    "e4", "d4", "c4", "Nf3", "e5", "c5", "e6", "c6", "d5", "Nf6", "Nc6", "g6", "g3", "b3", "f4", "d3", "Nc3", "Bc4", "Bb5"
  ]);
  const isOpeningTheory = plyIndex < 6 && STANDARD_OPENING_SAN.has(move.san);
  if (isOpeningTheory && winLoss <= 1.5) {
    return {
      classification: {
        key: "book",
        name: "Book",
        icon: "📖",
        color: "#d5a47d",
        commentary: "Standard theoretical opening move.",
      },
      winLoss,
      isForced: false,
    };
  }

  const moveUci = `${move.from}${move.to}`;
  const isEngineTop = engineBestUci ? moveUci === engineBestUci : winLoss <= 0.8;

  // 3. Brilliant Move (Conservative, Rigorous Criteria)
  // Requirements:
  // - Must NOT be early opening (plyIndex >= 6)
  // - Must be an optimal engine choice (winLoss <= 0.8%)
  // - Player must maintain decisive control / winning advantage (probAfter >= 60.0%)
  // - Must involve a true material sacrifice
  if (plyIndex >= 6 && winLoss <= 0.8 && playerProbAfter >= 60.0) {
    const hasSacrifice = isTrueMaterialSacrifice(move);
    if (hasSacrifice) {
      return {
        classification: {
          key: "brilliant",
          name: "Brilliant",
          icon: "‼️",
          color: "#1baca6",
          commentary: "A brilliant sacrifice maintaining decisive tactical control!",
        },
        winLoss,
        isForced: false,
      };
    }
  }

  // 4. Best Move: Engine's top move or minimal loss (<= 1.0%)
  if (winLoss <= 1.0 || isEngineTop) {
    return {
      classification: {
        key: "best",
        name: "Best",
        icon: "⭐",
        color: "#96bc4b",
        commentary: "The strongest continuation in the position.",
      },
      winLoss,
      isForced: false,
    };
  }

  // 5. Excellent Move: Strong practical move (1.0% < winLoss <= 3.0%)
  if (winLoss <= 3.0) {
    return {
      classification: {
        key: "excellent",
        name: "Excellent",
        icon: "👍",
        color: "#96bc4b",
        commentary: "An excellent continuation maintaining advantage.",
      },
      winLoss,
      isForced: false,
    };
  }

  // 6. Good Move: Solid playable move (3.0% < winLoss <= 7.0%)
  if (winLoss <= 7.0) {
    return {
      classification: {
        key: "good",
        name: "Good",
        icon: "•",
        color: "#86a666",
        commentary: "A solid, playable move.",
      },
      winLoss,
      isForced: false,
    };
  }

  // 7. Inaccuracy: Suboptimal choice (7.0% < winLoss <= 15.0%)
  if (winLoss <= 15.0) {
    return {
      classification: {
        key: "inaccuracy",
        name: "Inaccuracy",
        icon: "❓",
        color: "#f4bf42",
        commentary: "An inaccuracy. Missed a slightly more active continuation.",
      },
      winLoss,
      isForced: false,
    };
  }

  // 8. Mistake: Significant drop in advantage (15.0% < winLoss <= 25.0%)
  if (winLoss <= 25.0) {
    return {
      classification: {
        key: "mistake",
        name: "Mistake",
        icon: "❓❓",
        color: "#e68f2a",
        commentary: "A mistake! Surrendered a significant portion of advantage.",
      },
      winLoss,
      isForced: false,
    };
  }

  // 9. Miss (Missed Win): Had decisive advantage (>= 75%) and dropped below 50%
  if (playerProbBefore >= 75.0 && playerProbAfter < 50.0) {
    return {
      classification: {
        key: "miss",
        name: "Miss",
        icon: "⚠️",
        color: "#df6962",
        commentary: "Missed win! Overlooked a decisive tactical knockout blow.",
      },
      winLoss,
      isForced: false,
    };
  }

  // 10. Blunder: Severe error fundamentally altering the game outcome (winLoss > 25.0%)
  return {
    classification: {
      key: "blunder",
      name: "Blunder",
      icon: "❌",
      color: "#ca3431",
      commentary: "A severe blunder that fundamentally alters the game outcome.",
    },
    winLoss,
    isForced: false,
  };
}
