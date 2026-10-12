/**
 * Chess Platform API Integrations:
 * Fetches recent games for a given username from Lichess or Chess.com public APIs.
 * Operates entirely client-side with no backend proxy required.
 */

export type ChessPlatform = "chesscom" | "lichess";

/**
 * Fetches the most recent game PGN for a player from Lichess or Chess.com.
 */
export async function fetchLatestGame(
  platform: ChessPlatform,
  username: string
): Promise<string> {
  const cleanUsername = username.trim().toLowerCase();
  if (!cleanUsername) {
    throw new Error("Please enter a username.");
  }

  if (platform === "lichess") {
    return fetchLichessLatestGame(cleanUsername);
  } else {
    return fetchChessComLatestGame(cleanUsername);
  }
}

/**
 * Fetches the most recent game from Lichess via their public games endpoint.
 */
async function fetchLichessLatestGame(username: string): Promise<string> {
  const url = `https://lichess.org/api/games/user/${encodeURIComponent(username)}?max=1&pgnInBody=true`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/x-chess-pgn",
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Lichess player "${username}" was not found.`);
    }
    throw new Error(`Failed to fetch game from Lichess (Status: ${response.status}).`);
  }

  const pgn = await response.text();
  if (!pgn || pgn.trim().length === 0) {
    throw new Error(`No games found for Lichess player "${username}".`);
  }

  return pgn.trim();
}

/**
 * Fetches the most recent game from Chess.com via their public archives API.
 */
async function fetchChessComLatestGame(username: string): Promise<string> {
  const archivesUrl = `https://api.chess.com/pub/player/${encodeURIComponent(username)}/games/archives`;
  const archivesRes = await fetch(archivesUrl);

  if (!archivesRes.ok) {
    if (archivesRes.status === 404) {
      throw new Error(`Chess.com player "${username}" was not found.`);
    }
    throw new Error(`Failed to fetch archives from Chess.com (Status: ${archivesRes.status}).`);
  }

  const archivesData = await archivesRes.json();
  const archives: string[] = archivesData.archives || [];

  if (archives.length === 0) {
    throw new Error(`No game history found for Chess.com player "${username}".`);
  }

  // The latest archive URL is the last element in the array
  const latestArchiveUrl = archives[archives.length - 1];
  const gamesRes = await fetch(latestArchiveUrl);

  if (!gamesRes.ok) {
    throw new Error(`Failed to fetch monthly games from Chess.com (Status: ${gamesRes.status}).`);
  }

  const gamesData = await gamesRes.json();
  const games = gamesData.games || [];

  if (games.length === 0) {
    throw new Error(`No games found in the latest archive for "${username}".`);
  }

  // The most recent game is the last game in the monthly archive
  const latestGame = games[games.length - 1];
  if (!latestGame.pgn) {
    throw new Error("The latest game did not contain PGN notation.");
  }

  return latestGame.pgn.trim();
}
