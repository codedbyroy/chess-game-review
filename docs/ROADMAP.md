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

## Phase 5: Reliability & Quality Assurance (Completed)
- [x] Expand Vitest test suites (`tests/chess-edge-cases.test.ts` covering underpromotions, en passant, castling, and stalemates).
- [x] Test malformed, truncated, and bare PGN files with defensive error handling.
- [x] Benchmark 100-ply marathon scalability (<150ms parsing time).
- [x] Enhance accessibility: added ARIA labels, roles (`role="region"`, `role="dialog"`), and modal attributes.
- [x] Update test documentation matrix in `docs/TESTING.md`.
- [x] Verify Phase 5: All 38 tests pass across 4 suites, typecheck passes, zero release-blocking defects.

---

## Phase 6: Production Deployment (Completed)
- [x] Configure production build optimization, static export (`next.config.ts`), and trailing slashes.
- [x] Configure dual deployment pipeline: Vercel static support & GitHub Pages static base path.
- [x] Create automated CI workflow via GitHub Actions (`.github/workflows/ci.yml`).
- [x] Create automated Continuous Deployment workflow for GitHub Pages (`.github/workflows/deploy.yml`).
- [x] Update public `README.md` with live demo link, architecture diagram, mathematical formulas, and setup instructions.
- [x] Verify Phase 6: Typecheck passes, 38/38 unit tests pass, static export completes cleanly.

---

## Phase 7: Portfolio Presentation & Enhancements (Completed)
- [x] Implement Chess.com & Lichess online game fetcher (`src/lib/chess-api.ts`).
- [x] Enhance PGN modal with tabbed account importer and famous player presets (`src/components/PgnModal.tsx`).
- [x] Add unit test suite for platform API integrations (`tests/chess-api.test.ts` - 6 tests, 44/44 total passing).
- [x] Create comprehensive Technical Case Study & Interview Guide (`docs/CASE_STUDY.md`).
- [x] Prepare LinkedIn launch announcement and technical interview talking points.
- [x] Verify Phase 7: 44/44 unit tests pass, TypeScript strict check passes, static export build succeeds.

---

## Engine Audit & Move Classification Repair Milestones

### Phase A: Audit and Diagnosis (Completed)
- [x] Audit entire codebase from engine Web Worker to UI rendering.
- [x] Identify root cause of inflated 17 brilliant moves (quiet piece moves false positive).
- [x] Diagnose opponent-move inversion in `MoveFeedbackCard`.
- [x] Confirm synthetic material heuristic in Web Worker script.
- [x] Produce prioritized diagnosis report.

### Phase B: Core Correctness (Completed)
- [x] Separate review engine into modular boundaries (`move-classifier.ts`, `accuracy-engine.ts`, `review-pipeline.ts`).
- [x] Implement conservative, verifiable brilliant move criteria requiring genuine material sacrifice.
- [x] Implement forced move detection (`isForced: true`).
- [x] Evaluate starting FEN in `analyzeEntireGame` to provide baseline and Move 1 recommendations.
- [x] Generate `bestMoveSan` from `fenBefore` for active player and display in `MoveFeedbackCard`.
- [x] Verify Phase B: Strict typecheck passes (0 errors), 50/50 unit tests pass across 6 suites, static build succeeds.

### Phase C: Engine and Accuracy Quality (Upcoming)
- [ ] Integrate official Stockfish WebAssembly binary into Web Worker.
- [ ] Stream real principal variation (PV) and genuine multi-depth evaluations.
- [ ] Implement position caching for evaluated FENs.

### Phase D: Interface Refinement (Upcoming)
- [ ] Align board layout, eval bar, and review cards across viewport breakpoints.
- [ ] Enhance responsive behavior and accessibility attributes.

### Phase E: Final Verification & Release (Upcoming)
- [ ] Comprehensive E2E verification on full representative games.
- [ ] Update public documentation, case study, and changelog.
