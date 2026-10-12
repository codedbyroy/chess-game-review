# Engineer Handoff Note — ChessLens

## 1. Quick Start & Environment
- **Node Version:** `v25.2.0` (compatible with `>=18.0.0`)
- **Package Manager:** `npm 11.6.2`
- **Development Server:** `npm run dev` (running locally at `http://localhost:3000`)
- **Type Checking:** `npm run typecheck` (`tsc --noEmit`)
- **Unit & Integration Tests:** `npm test` (`vitest run`)
- **Production Build:** `npm run build` (`next build` with static HTML export to `out/`)

---

## 2. Completed Milestones
All five phases of the Engine Audit, Move Classification Repair, and UI Refinement have been completed and verified:
1. **Phase A (Audit & Diagnosis):**
   - Uncovered flawed brilliant logic where any quiet piece move was marked brilliant.
   - Identified opponent move recommendations resulting from analyzing `fenAfter` instead of `fenBefore`.
   - Identified mock material counter in previous worker script.
2. **Phase B (Core Correctness):**
   - Created modular classification domain (`move-classifier.ts`, `accuracy-engine.ts`, `review-pipeline.ts`).
   - Implemented strict sacrifice verification (`isTrueMaterialSacrifice`).
   - Corrected alternative move translation for active player (`bestMoveSan` from `fenBefore`).
3. **Phase C (Engine Quality & Real Stockfish):**
   - Vendored authentic `stockfish.js` into `public/stockfish.js`.
   - Configured UCI options (`Threads 1`, `Hash 16`, `UCI_AnalyseMode true`).
   - Implemented position caching (`evalCache`, capped at 500 positions) for instant scrubbing.
   - Added robust UCI concurrency barrier preventing stale responses during rapid navigation or cancellations.
4. **Phase D (Interface Refinement):**
   - Moved `EngineEvalCard` to the top of the sidebar above `EvalGraph` for immediate action access.
   - Calibrated search depths: 10 (Fast Review ~5s), 12 (Standard Review), 15 (Deep Analysis).
5. **Phase E (Verification & Documentation):**
   - 57 passing tests across 8 suites.
   - Production static export tested and working.

---

## 3. Key Architectural Files
- `public/stockfish.js`: The authentic Stockfish engine script executed in a dedicated Web Worker.
- `src/lib/engine-service.ts`: Web Worker orchestrator, UCI protocol driver, and cache manager.
- `src/lib/move-classifier.ts`: Classification engine implementing Chess.com-style heuristics (Brilliant, Best, Excellent, Good, Book, Inaccuracy, Mistake, Blunder, Miss, Forced).
- `src/lib/accuracy-engine.ts`: Non-linear logistic sigmoid win-loss accuracy model.
- `src/lib/review-pipeline.ts`: Move-by-move reviewer that pairs positions with evaluations and alternatives.
- `src/components/EngineEvalCard.tsx`: Engine control interface with live progress bar and depth selector.
- `src/components/EvalGraph.tsx`: Interactive SVG momentum graph.
- `src/components/MoveFeedbackCard.tsx`: Tactical commentary card displaying played vs recommended move.
