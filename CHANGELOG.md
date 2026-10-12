# Changelog — ChessLens

All notable changes to the ChessLens project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Phase 6: Production Deployment] — 2026-10-12

### Added
- **Static Export Configuration (`next.config.ts`)**:
  - Configured Next.js for client-side static site generation (`output: 'export'`).
  - Added trailing slash resolution (`trailingSlash: true`) and unoptimized image support (`images: { unoptimized: true }`).
  - Dynamically configured `basePath` and `assetPrefix` when `GITHUB_PAGES=true` to support GitHub Pages subpath deployment while keeping Vercel/custom domain deployments clean.
- **GitHub Actions Workflows**:
  - Added `.github/workflows/ci.yml`: Automated CI pipeline running `npm run typecheck`, `npm test`, and `npm run build` on PRs and pushes to `master`.
  - Added `.github/workflows/deploy.yml`: Automated CD pipeline that builds and deploys static artifacts to GitHub Pages via official `actions/deploy-pages@v4`.
- **Production README & Documentation**:
  - Overhauled `README.md` with badging, live demo links, architecture diagram (Mermaid), mathematical models, and setup guides.

### Verified
- `npm run typecheck`: Passed with 0 errors.
- `npm test`: 38/38 Vitest tests passed across 4 test suites.
- `npm run build`: Static export succeeded cleanly in 3.1s emitting static HTML/JS bundle into `out/`.
- `GITHUB_PAGES=true npm run build`: Static export with base path `/chess-game-review` succeeded cleanly.

## [Phase 5: Reliability & Quality Assurance] — 2026-10-12

### Added
- **Chess Edge Cases Test Suite (`tests/chess-edge-cases.test.ts`)**:
  - Underpromotion coverage for Knight, Rook, and Bishop (`=N`, `=R`, `=B`).
  - En passant capture mechanics and board verification.
  - Castling rights validation in both directions.
  - Stalemate trap handling.
  - Defensive error handling against corrupt, truncated, and bare PGN inputs.
  - 100-ply marathon scalability benchmark (<150ms parsing time).
- **Accessibility Hardening**:
  - Explicit `aria-label` tags added to all board navigation buttons.
  - `role="region"` and `aria-label` added to the interactive chessboard.
  - `role="dialog"` and `aria-modal="true"` added to the PGN modal.
- **Updated Test Strategy Documentation (`docs/TESTING.md`)**:
  - Documented complete test matrix covering all 38 unit and edge case tests.

### Verified
- `npm run typecheck`: Passed with 0 errors.
- `npm test`: 38/38 Vitest tests passed across 4 test suites.
- `npm run build`: Production build succeeded in 1.7s.

## [Phase 4: Full Review Interface] — 2026-10-12

### Added
- **Evaluation Momentum Graph (`src/components/EvalGraph.tsx`)**:
  - Interactive SVG momentum line chart with area shading and turning point markers (Blunder ❌, Brilliant ‼️, Miss ⚠️).
  - Bidirectional scrub cursor: clicking any point jumps board and move list to that position.
- **Game Review Summary Card (`src/components/ReviewSummary.tsx`)**:
  - Side-by-side accuracy score comparison cards and category count comparison table for White and Black.
- **Move Feedback Card (`src/components/MoveFeedbackCard.tsx`)**:
  - Displays played move, engine recommended alternative, win-chance delta, and educational tactical commentary.
- **Complete Synchronized Workflow**:
  - Board, Move List, Eval Bar, Graph, and Feedback Cards fully synchronized.

### Verified
- `npm run typecheck`: Passed with 0 errors.
- `npm test`: 28/28 Vitest tests passed.
- `npm run build`: Production build and static prerendering succeeded in 2.0s.

## [Phase 3: Move-by-Move Game Analysis Pipeline] — 2026-10-12

### Added
- **Win Probability Sigmoid Model (`src/lib/review-pipeline.ts`)**:
  - Converts centipawns and forced mates into exact win percentages ($0\% - 100\%$).
- **Deterministic Move Classification Logic**:
  - Classifies moves based on change in win probability into Brilliant (‼️), Best (⭐), Excellent (👍), Good, Book (📖), Inaccuracy (❓), Mistake (❓❓), Blunder (❌), and Miss (⚠️).
- **Player Accuracy Formula**:
  - Calculates overall game accuracy scores (0–100%) for White and Black based on average win loss.
- **Batch Game Review Engine (`src/lib/engine-service.ts`)**:
  - Added `analyzeEntireGame` method executing sequential evaluations in background Web Worker.
- **UI Enhancements**:
  - Added "Review Full Game" button with animated progress bar and cancellation.
  - Added real-time classification pills to the Move List.
- **Test Suite (`tests/review-pipeline.test.ts`)**:
  - 15 new unit tests covering win probability math, classification rules, accuracy ratings, and batch reporting. Total tests: 28/28 passing.

### Verified
- `npm run typecheck`: Passed with 0 errors.
- `npm test`: 28/28 Vitest tests passed.
- `npm run build`: Production build and static prerendering succeeded.

## [Phase 2: Stockfish WebAssembly Integration] — 2026-10-12

### Added
- **UCI Protocol Engine Parser (`src/lib/uci-protocol.ts`)**:
  - Parses depth, centipawn score, mate distance, and principal variation (PV).
  - Normalizes scores from the moving side's perspective to White's universal perspective.
- **Engine Web Worker Service (`src/lib/engine-service.ts`)**:
  - Dedicated background worker execution to prevent main thread blocking.
  - Thread-safe job ID generation with automatic stale-response filtering.
  - Request cancellation (`stop` command) and 20s safety timeout.
- **Engine Evaluation UI (`src/components/EngineEvalCard.tsx`)**:
  - Real-time score readout, depth meter, best move recommendations, and line previews.
  - Configurable depth slider (12/15/18).
- **Dynamic Evaluation Bar (`src/components/Chessboard.tsx`)**:
  - Vertical visual bar on the chessboard reflecting White/Black advantage.
- **Test Suite (`tests/uci-protocol.test.ts`)**:
  - 8 new unit tests verifying centipawns, negative evaluations, forced mates, and ponder moves. Total tests: 13/13 passing.

### Verified
- `npm run typecheck`: Passed with 0 errors.
- `npm test`: 13/13 Vitest tests passed.
- `npm run build`: Production build and static prerendering succeeded.

## [Phase 1: Application Foundation] — 2026-10-11

### Added
- **Next.js 15 & React 19 Architecture**: Bootstrapped App Router with strict TypeScript and Tailwind CSS.
- **Official `chess.js` Integration**: Added strict move validation and FEN generation in `src/lib/pgn-parser.ts`.
- **Unit Test Suite (`tests/pgn-parser.test.ts`)**: 5 passing unit tests for headers, plies, castling, promotions, and malformed inputs.
- **Component System**:
  - `Chessboard.tsx`: 8x8 SVG piece board with coordinates and highlights.
  - `BoardControls.tsx`: Move navigation controls and keyboard shortcut listeners.
  - `MoveList.tsx`: Two-column auto-scrolling SAN move list.
  - `PlayerCard.tsx`: Player metadata and active turn badges.
  - `PgnModal.tsx`: File upload and text paste dialog.
  - `Header.tsx`: Responsive navigation bar.
- **Archived Prototype**: Preserved preliminary prototype code in `legacy-prototype/`.

### Verified
- `npm run typecheck`: Passed with 0 errors.
- `npm test`: 5/5 Vitest unit tests passed.
- `npm run build`: Production build and static page generation succeeded.

## [Phase 0: Repository Audit & Project Setup] — 2026-10-11

### Added
- **Permanent AI Agent Directives (`AGENTS.md`)**: Core operational principles, learning-first mindset, and continuity requirements.
- **Project Brief (`docs/PROJECT_BRIEF.md`)**: Product vision, user profiles, and MVP scope.
- **System Architecture (`docs/ARCHITECTURE.md`)**: Tech stack, Web Worker concurrency model, data flow diagrams.
- **Roadmap (`docs/ROADMAP.md`)**: Phased milestones and task breakdown from Phase 0 to Phase 7.
- **Architectural Decisions (`docs/DECISIONS.md`)**: ADR-001 through ADR-005.
- **Current State (`docs/CURRENT_STATE.md`)**: Baseline verification of Node, npm, and repository status.
- **Handoff Guide (`docs/HANDOFF.md`)**: Session transition protocol for continuity across AI sessions.
- **Testing Strategy (`docs/TESTING.md`)**: Test pyramid and planned test suites.
- **Known Issues (`docs/KNOWN_ISSUES.md`)**: Documented GitHub Pages custom domain issue and performance mitigations.

### Audited
- Existing repository working tree at commit `31a566c`.
- Environment runtime: Node.js `v25.2.0`, npm `11.6.2`.
- Initial static prototype files (`index.html`, `index.css`, `js/*`).
