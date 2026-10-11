# Changelog — ChessLens

All notable changes to the ChessLens project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

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
