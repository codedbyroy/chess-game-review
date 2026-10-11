# Roadmap & Milestones — ChessLens

## Phase 0: Repository Audit & Project Setup (Current Phase)
- [x] Inspect existing repository, Git commits, dependencies, and environment.
- [x] Analyze initial prototype codebase (`index.html`, `index.css`, `js/*`).
- [x] Establish architectural decisions and technology trade-offs.
- [x] Review licensing (GNU GPLv3 for Stockfish, MIT for ChessLens).
- [x] Create persistent project memory documents in `docs/` and root.
- [x] Define Phase 1 tasks with explicit acceptance criteria.
- [ ] User review and sign-off on Phase 0 audit report.

---

## Phase 1: Application Foundation
- [ ] Initialize Next.js project with TypeScript (strict), React 19/18, and Tailwind CSS.
- [ ] Configure linting (ESLint) and testing infrastructure (Vitest).
- [ ] Establish reusable layout system (header, board area, sidebar dashboard).
- [ ] Integrate official `chess.js` for legal move generation and PGN parsing.
- [ ] Build PGN Ingestion Modal & File Uploader with robust error handling.
- [ ] Implement interactive, responsive Chessboard component with flip board support.
- [ ] Implement synchronized Move List component supporting forward/backward navigation and keyboard shortcuts.
- [ ] Verify Phase 1: Type check passes, Vitest unit tests pass, production build succeeds.

---

## Phase 2: Stockfish WebAssembly Integration
- [ ] Audit and integrate a verified Stockfish.js / WebAssembly build.
- [ ] Build the Web Worker abstraction for UCI (Universal Chess Interface) communication.
- [ ] Implement lifecycle management: initialization, ready state, timeout, and termination.
- [ ] Build single-position evaluation (`position fen`, `go depth X`, parse `info depth ... cp ... mate`).
- [ ] Implement request cancellation and stale-response filtering.
- [ ] Verify Phase 2: Engine runs in worker without blocking UI; tests verify UCI parsing.

---

## Phase 3: Move-by-Move Game Analysis Pipeline
- [ ] Implement sequential full-game analysis queue.
- [ ] Normalize evaluation scores from White and Black player perspectives.
- [ ] Correctly handle mate scores ($Mate\ in\ N$) and score bounding.
- [ ] Implement win-probability calculation formula.
- [ ] Implement configurable move classification rules (Best, Excellent, Good, Inaccuracy, Mistake, Blunder, Miss).
- [ ] Expose real-time progress indicator with cancellation capability.
- [ ] Verify Phase 3: Unit tests verify move classification against canonical blunder/brilliant test positions.

---

## Phase 4: Full Review Interface
- [ ] Implement interactive Evaluation Momentum Graph (Recharts / Canvas).
- [ ] Bidirectionally synchronize graph clicks to board state and move list.
- [ ] Build Dynamic Evaluation Bar with centipawn and mate score display.
- [ ] Build Game Summary Report (accuracy meters, classification count pills, turning points).
- [ ] Implement Move Feedback Card detailing played vs suggested moves.
- [ ] Optimize responsive layout for desktop, tablet, and mobile browsers.
- [ ] Verify Phase 4: Full end-to-end user workflow operational from PGN import to final report.

---

## Phase 5: Reliability & Quality Assurance
- [ ] Expand Vitest test suites (edge cases: castling, promotion, en passant, stalemate, threefold repetition).
- [ ] Test malformed, truncated, and unusually long PGN files.
- [ ] Review keyboard navigation, ARIA labels, and color contrast.
- [ ] Benchmark client-side engine performance and memory consumption.
- [ ] Resolve all identified defects and document known limitations.
- [ ] Verify Phase 5: All automated suites pass, zero release-blocking defects.

---

## Phase 6: Production Deployment
- [ ] Configure production build optimization and WebAssembly MIME-type headers.
- [ ] Deploy to Vercel (or static hosting) with automated CI/CD via GitHub Actions.
- [ ] Test live URL on clean browser profiles and mobile devices.
- [ ] Update public `README.md` with live demo link, architecture diagram, and setup instructions.
- [ ] Verify Phase 6: Public URL is live and functioning without errors.

---

## Phase 7: Portfolio Presentation & Enhancements
- [ ] (Optional) Add Chess.com / Lichess username game fetcher.
- [ ] Create technical case study explaining Stockfish WebAssembly concurrency and move classification algorithms.
- [ ] Prepare portfolio screenshots, demo recording, and LinkedIn launch post.
