import { Chess } from "chess.js";
import { GameMetadata, MoveRecord, ParsedGame } from "./types";

/**
 * Default sample game: Paul Morphy's famous Opera Game (1858)
 */
export const SAMPLE_OPERA_GAME = `[Event "A Night at the Opera"]
[Site "Paris FRA"]
[Date "1858.??.??"]
[White "Paul Morphy"]
[Black "Duke Karl / Count Isouard"]
[Result "1-0"]
[ECO "C41"]

1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7 8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+ Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7 14. Rd1 Qe6 15. Bxd7+ Nxd7 16. Qb8+ Nxb8 17. Rd8# 1-0`;

/**
 * Extracts PGN header tags into a structured GameMetadata object.
 */
export function extractHeaders(pgnText: string): GameMetadata {
  const metadata: GameMetadata = {};
  const headerRegex = /\[(\w+)\s+"([^"]*)"\]/g;
  let match: RegExpExecArray | null;

  while ((match = headerRegex.exec(pgnText)) !== null) {
    const key = match[1];
    const value = match[2];
    const normalizedKey = key.charAt(0).toLowerCase() + key.slice(1);
    metadata[normalizedKey] = value;
    metadata[key] = value; // Keep both casing for convenient access
  }

  return metadata;
}

/**
 * Parses a PGN string into a structured game with validated moves and FEN positions.
 */
export function parsePgn(pgnText: string): ParsedGame {
  const cleanText = pgnText.trim();
  if (!cleanText) {
    return {
      metadata: {},
      moves: [],
      startingFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      error: "PGN text cannot be empty.",
    };
  }

  const metadata = extractHeaders(cleanText);
  const chess = new Chess();
  const startingFen = chess.fen();

  try {
    // Attempt standard chess.js loadPgn
    chess.loadPgn(cleanText);
    const history = chess.history({ verbose: true });

    // Replay on a fresh board to capture fenBefore and fenAfter for each ply
    const replayChess = new Chess();
    const moves: MoveRecord[] = [];

    for (let i = 0; i < history.length; i++) {
      const verboseMove = history[i];
      const fenBefore = replayChess.fen();
      const executed = replayChess.move({
        from: verboseMove.from,
        to: verboseMove.to,
        promotion: verboseMove.promotion,
      });

      if (!executed) {
        throw new Error(`Failed to replay legal move at ply ${i}: ${verboseMove.san}`);
      }

      const fenAfter = replayChess.fen();

      moves.push({
        ply: i,
        moveNumber: Math.floor(i / 2) + 1,
        turn: verboseMove.color,
        san: verboseMove.san,
        from: verboseMove.from,
        to: verboseMove.to,
        piece: verboseMove.piece,
        captured: verboseMove.captured ?? null,
        promotion: verboseMove.promotion ?? null,
        fenBefore,
        fenAfter,
      });
    }

    return {
      metadata,
      moves,
      startingFen,
      error: null,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Malformed PGN format.";
    return {
      metadata,
      moves: [],
      startingFen,
      error: `Invalid PGN: ${errorMsg}`,
    };
  }
}
