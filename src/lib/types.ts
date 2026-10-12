/**
 * Core domain types for ChessLens
 */

import { UciEvaluation } from "./uci-protocol";

export interface GameMetadata {
  event?: string;
  site?: string;
  date?: string;
  round?: string;
  white?: string;
  black?: string;
  result?: string;
  whiteElo?: string;
  blackElo?: string;
  eco?: string;
  [key: string]: string | undefined;
}

export interface MoveRecord {
  ply: number;
  moveNumber: number;
  turn: "w" | "b";
  san: string;
  from: string;
  to: string;
  piece: string;
  captured?: string | null;
  promotion?: string | null;
  fenBefore: string;
  fenAfter: string;
}

export interface ParsedGame {
  metadata: GameMetadata;
  moves: MoveRecord[];
  startingFen: string;
  error?: string | null;
}

export type MoveClassificationKey =
  | "brilliant"
  | "best"
  | "excellent"
  | "good"
  | "book"
  | "inaccuracy"
  | "mistake"
  | "blunder"
  | "miss";

export interface MoveClassification {
  key: MoveClassificationKey;
  name: string;
  icon: string;
  color: string;
  commentary: string;
}

export interface AnalyzedMove extends MoveRecord {
  evaluation: UciEvaluation;
  winProbWhite: number;
  winLoss: number;
  classification: MoveClassification;
  bestMoveSan?: string;
  bestMoveUci?: string;
  isForced?: boolean;
}

export interface GameAnalysisReport {
  moves: AnalyzedMove[];
  whiteAccuracy: number;
  blackAccuracy: number;
  classificationCounts: {
    white: Record<MoveClassificationKey, number>;
    black: Record<MoveClassificationKey, number>;
  };
}
