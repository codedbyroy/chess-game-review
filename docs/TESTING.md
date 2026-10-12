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

## 3. Active Test Suites & Coverage (38 Tests Passing)

### `tests/pgn-parser.test.ts` (5 tests)
- Metadata extraction (White, Black, Date, ECO, Result).
- Canonical Opera Game full 33-ply parsing.
- Malformed move sequence error reporting.
- Empty input defensive handling.
- Pawn promotion to Queen validation.

### `tests/uci-protocol.test.ts` (8 tests)
- Standard centipawn evaluation for White's turn.
- Score normalization to White's universal perspective when Black is to move.
- Forced mate calculations ($Mate\ in\ N$ and $-Mate\ in\ N$).
- Negative evaluations and mate normalization.
- Best move parsing with and without `ponder`.
- Defensive filtering of non-eval lines.

### `tests/review-pipeline.test.ts` (15 tests)
- Centipawn-to-win-probability S-curve boundary testing (0 cp $\to$ 50%, mate $\to$ 100%/0%).
- Monotonicity checks for positive and negative advantages.
- Classification rules: Book, Best, Inaccuracy, Mistake, Blunder, Miss.
- Tactical piece sacrifice detection for Brilliant moves.
- Player accuracy formula testing (0 loss $\to$ 100%, master play $\to$ ~95%, weak play $\to$ ~60%).
- Full-game batch analysis reporting.

### `tests/chess-edge-cases.test.ts` (10 tests)
- Underpromotions to Knight (`=N`), Rook (`=R`), and Bishop (`=B`).
- En passant capture mechanics and board square cleanup.
- Castling rights in both directions (`O-O` and `O-O-O`).
- Stalemate and terminal game handling.
- Corrupt PGN handling: unclosed quotes, illegal moves, and bare move lists.
- 100-ply marathon scalability benchmark (<150ms parsing time).

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
