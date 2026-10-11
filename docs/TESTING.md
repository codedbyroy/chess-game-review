# Testing Strategy — ChessLens

## 1. Overview
A core goal of ChessLens is verifiable reliability. We do not make unverified claims of feature completion. Every chess algorithm, engine bridge message, and move classifier must have test coverage.

---

## 2. Test Pyramid & Tooling

| Level | Tool | Responsibility |
| :--- | :--- | :--- |
| **Unit Tests** | Vitest | PGN parsing, win-probability sigmoid math, move classification rules, UCI protocol parsers. |
| **Component Tests** | React Testing Library | Chessboard interactions, move list navigation, modal accessibility, keyboard controls. |
| **Integration / E2E** | Playwright (Phase 5) | Full browser user flow: Load PGN -> trigger Stockfish worker analysis -> verify review dashboard. |

---

## 3. Test Suites Planned by Phase

### Phase 1: PGN & Chess Validation
- `tests/pgn-parser.test.ts`: Validates parsing of standard games, empty headers, long variations, and malformed inputs.
- `tests/chess-rules.test.ts`: Tests edge cases: underpromotion, en passant captures, kingside/queenside castling.

### Phase 2: Stockfish UCI Bridge
- `tests/uci-protocol.test.ts`: Tests parsing of engine strings (`info depth 15 score cp 42`, `info depth 18 score mate -2`, `bestmove e2e4`).
- `tests/worker-lifecycle.test.ts`: Tests cancellation, timeout handlers, and stale response guards.

### Phase 3: Game Review Engine
- `tests/win-probability.test.ts`: Verifies centipawn-to-win-rate sigmoid curve boundaries and monotonicity.
- `tests/move-classifier.test.ts`: Verifies classification against canonical game positions (identifying Morphy's Queen sacrifice in the Opera Game as Brilliant, hanging Queen as Blunder).

---

## 4. Test Execution Commands (Phase 1 Onward)
```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run TypeScript type check
npm run typecheck

# Run linter
npm run lint

# Run production build
npm run build
```
