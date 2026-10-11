# Project Brief — ChessLens

## 1. Product Vision
**ChessLens** is a free, browser-based chess game reviewer designed to help chess players understand their mistakes through client-side engine analysis, interactive evaluation graphs, best-move suggestions, and clear learning insights.

Unlike superficial clones or expensive commercial services, ChessLens prioritizes:
- **Zero-cost, private client-side compute**: Stockfish runs directly in the user's browser via WebAssembly, requiring no subscription or remote compute server.
- **Explainable game reviews**: Move classification algorithms and accuracy formulas are transparent, documented, and reproducible.
- **Educational engineering quality**: Built from the ground up with clean TypeScript, isolated Web Workers, and test-driven development to serve as an exemplary resume/portfolio project.

---

## 2. Target Users
1. **Club & Casual Chess Players**: Want to quickly understand why a game was won or lost without hitting a paywall or daily analysis limit.
2. **Software Engineers & Interviewers**: Reviewing the project repository to evaluate software architecture, performance optimization, Web Worker concurrency, and software design quality.

---

## 3. Product Scope

### In-Scope for MVP:
- PGN ingestion via direct text paste and `.pgn` file upload.
- Full chess rules validation using `chess.js` (including castling, en passant, promotions, checks, mates, draws).
- Responsive chessboard with bidirectional move navigation and move-list synchronization.
- Stockfish engine integration inside an isolated Web Worker (UCI protocol).
- Move-by-move evaluation pipeline calculating centipawn and mate evaluations.
- Mathematical conversion from centipawns to win-probability percentage.
- Move classification: Best, Excellent, Good, Inaccuracy, Mistake, Blunder, Miss.
- Evaluation momentum graph plotted over game ply.
- Summary report of player accuracy scores (0–100%) and mistake count breakdown.

### Out-of-Scope for MVP:
- User accounts and login.
- Cloud database persistence of games.
- Server-side analysis queues.
- Real-time multiplayer play.
- Proprietary Chess.com visual assets, audio files, or trademarked branding.

---

## 4. Key Constraints
- **Hosting & Infrastructure**: Pure static/JAMstack deployment (Vercel / GitHub Pages) to maintain $0 operational expenses.
- **Browser Compatibility**: Modern Evergreen browsers supporting WebAssembly and Web Workers (Chrome, Edge, Firefox, Safari).
- **Licensing**: Stockfish is licensed under GNU GPLv3. Any distribution of Stockfish binaries or derivatives must respect GPLv3 obligations.
