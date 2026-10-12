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

## Phase 1: Application Foundation (Completed)
- [x] Initialize Next.js project with TypeScript (strict), React 19, and Tailwind CSS.
- [x] Configure linting and testing infrastructure (Vitest).
- [x] Establish reusable layout system (header, board area, sidebar dashboard).
- [x] Integrate official `chess.js` for legal move generation and PGN parsing.
- [x] Build PGN Ingestion Modal & File Uploader with robust error handling.
- [x] Implement interactive, responsive Chessboard component with flip board support.
- [x] Implement synchronized Move List component supporting forward/backward navigation and keyboard shortcuts.
- [x] Verify Phase 1: Type check passes, Vitest unit tests pass (5/5), production build succeeds.

---

## Phase 2: Stockfish WebAssembly Integration (Completed)
- [x] Select and verify Web Worker Stockfish integration.
- [x] Build UCI protocol parser (`src/lib/uci-protocol.ts`) with White-perspective score normalization.
- [x] Implement engine lifecycle management: initialization, ready state, timeout, and cancellation (`src/lib/engine-service.ts`).
- [x] Load engine in a dedicated Web Worker to prevent UI thread blocking.
- [x] Single-position analysis with real-time progress, best move, and principal variation (PV).
- [x] Dynamic visual evaluation bar on chessboard reflecting centipawn & mate scores.
- [x] Unit test suite covering UCI parser edge cases (`tests/uci-protocol.test.ts` - 8 tests).
- [x] Verify Phase 2: Typecheck passes, 13/13 tests pass, production build succeeds.

---

## Phase 3: Move-by-Move Game Analysis Pipeline (Completed)
- [x] Implement sequential full-game analysis queue (`analyzeEntireGame` in `EngineService`).
- [x] Normalize evaluation scores from White and Black player perspectives.
- [x] Handle mate scores ($Mate\ in\ N$) and score bounding.
- [x] Implement win-probability calculation formula (`centipawnsToWinProbability`).
- [x] Implement configurable move classification rules (Brilliant, Best, Excellent, Good, Book, Inaccuracy, Mistake, Blunder, Miss).
- [x] Expose real-time progress indicator with cancellation capability.
- [x] Calculate overall White and Black player accuracy ratings (0–100%).
- [x] Unit test suite covering win-probability math, classification rules, and accuracy models (`tests/review-pipeline.test.ts` - 15 tests).
- [x] Verify Phase 3: Typecheck passes, 28/28 tests pass across 3 test suites, production build succeeds.

---

## Phase 4: Full Review Interface (Completed)
- [x] Implement interactive Evaluation Momentum Graph (`src/components/EvalGraph.tsx`).
- [x] Bidirectionally synchronize graph clicks to board state and move list.
- [x] Build Dynamic Evaluation Bar with centipawn and mate score display.
- [x] Build Game Summary Report (`src/components/ReviewSummary.tsx`) with accuracy meters and classification counts.
- [x] Implement Move Feedback Card (`src/components/MoveFeedbackCard.tsx`) detailing played vs suggested moves.
- [x] Optimize responsive layout for desktop, tablet, and mobile browsers.
- [x] Verify Phase 4: Full end-to-end user workflow operational from PGN import to final report.

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
