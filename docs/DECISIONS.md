# Architectural Decision Records (ADRs) — ChessLens

## ADR-001: Next.js with React & Strict TypeScript
- **Status:** Accepted
- **Context:** The application needs a production-grade component architecture, strong typing for complex chess engine states, and fast static delivery.
- **Decision:** Use Next.js (App Router) with React, strict TypeScript (`strict: true`), and Tailwind CSS.
- **Consequences:** Provides type safety across chess states, easy component modularization, and straightforward deployment to Vercel/GitHub Pages with zero server costs.

---

## ADR-002: Client-Side Web Worker Stockfish vs. Cloud API
- **Status:** Accepted
- **Context:** Running Stockfish analysis on remote cloud servers (e.g., AWS EC2 or paid chess APIs) incurs ongoing compute costs and rate-limiting issues.
- **Decision:** Run Stockfish compiled to WebAssembly (Wasm) inside an isolated Web Worker directly on the user's browser.
- **Consequences:**
  - *Pros:* $0 server infrastructure cost, infinite scaling per user, privacy-first (no games sent to third-party servers).
  - *Cons:* Computation utilizes the client device's CPU; requires Web Worker isolation to avoid freezing the UI thread.

---

## ADR-003: Industry-Standard `chess.js` Library
- **Status:** Accepted
- **Context:** Custom chess move parsers often fail on subtle edge cases (ambiguous disambiguation, en passant square clearing, castling rights, promotion notations).
- **Decision:** Utilize the battle-tested, actively maintained `chess.js` library for all FEN validation, move generation, and PGN parsing.
- **Consequences:** Eliminates chess rule edge-case bugs and ensures 100% compliance with FIDE rules.

---

## ADR-004: Win-Probability Sigmoid Mapping for Accuracy
- **Status:** Accepted
- **Context:** Centipawn scores are non-linear (e.g., dropping from +8.0 to +5.0 still leaves a completely winning position, whereas dropping from +0.5 to -2.5 is a fatal blunder). Fixed centipawn thresholds produce misleading accuracy scores.
- **Decision:** Map centipawn values to win probabilities using a standard logistic/sigmoid formula:
  $$Win\% = 50 + 50 \times \left(\frac{2}{1 + e^{-0.0035 \times cp}} - 1\right)$$
  Move classifications and overall player accuracy ratings are derived from the change in expected win probability ($\Delta Win\%$).
- **Consequences:** Produces fair, realistic move classifications that reflect human game impact.

---

## ADR-005: Preserving Existing Prototype Work
- **Status:** Accepted
- **Context:** The repository currently has an initial working vanilla HTML/JS proof-of-concept. Principle E dictates protecting existing work.
- **Decision:** Keep the initial prototype intact in `legacy-prototype/` so it remains a working reference while we scaffold and build the production Next.js application in Phase 1.
- **Consequences:** Ensures no loss of working code or functionality while transitioning cleanly to the production architecture.
