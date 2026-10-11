/**
 * Core domain types for ChessLens
 */

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
