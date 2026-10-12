import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchLatestGame } from "@/lib/chess-api";

describe("chess-api client", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("throws validation error for empty username", async () => {
    await expect(fetchLatestGame("lichess", "   ")).rejects.toThrow(
      "Please enter a username."
    );
  });

  it("fetches latest game successfully from Lichess", async () => {
    const mockPgn = `[Event "Rated Blitz game"]\n[White "player1"]\n[Black "player2"]\n1. e4 e5 2. Nf3 Nc6 1-0`;

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => mockPgn,
    } as unknown as Response);

    const result = await fetchLatestGame("lichess", "magnuscarlsen");
    expect(result).toBe(mockPgn);
    expect(global.fetch).toHaveBeenCalledWith(
      "https://lichess.org/api/games/user/magnuscarlsen?max=1&pgnInBody=true",
      { headers: { Accept: "application/x-chess-pgn" } }
    );
  });

  it("handles Lichess 404 player not found error", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    } as unknown as Response);

    await expect(fetchLatestGame("lichess", "nonexistent_player_12345")).rejects.toThrow(
      'Lichess player "nonexistent_player_12345" was not found.'
    );
  });

  it("fetches latest game successfully from Chess.com archives", async () => {
    const mockArchives = {
      archives: [
        "https://api.chess.com/pub/player/hikaru/games/2026/01",
        "https://api.chess.com/pub/player/hikaru/games/2026/02",
      ],
    };

    const mockGamePgn = `[Event "Live Chess"]\n[White "Hikaru"]\n[Black "Opponent"]\n1. d4 Nf6 2. c4 e6 1-0`;
    const mockMonthlyGames = {
      games: [
        { pgn: "1. e4 e5 1/2-1/2" },
        { pgn: mockGamePgn },
      ],
    };

    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockArchives,
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockMonthlyGames,
      } as unknown as Response);

    const result = await fetchLatestGame("chesscom", "hikaru");
    expect(result).toBe(mockGamePgn);
    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      "https://api.chess.com/pub/player/hikaru/games/archives"
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "https://api.chess.com/pub/player/hikaru/games/2026/02"
    );
  });

  it("handles Chess.com player with no archives", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ archives: [] }),
    } as unknown as Response);

    await expect(fetchLatestGame("chesscom", "newplayer")).rejects.toThrow(
      'No game history found for Chess.com player "newplayer".'
    );
  });

  it("handles Chess.com 404 player not found", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as unknown as Response);

    await expect(fetchLatestGame("chesscom", "fakeplayer_404")).rejects.toThrow(
      'Chess.com player "fakeplayer_404" was not found.'
    );
  });
});
