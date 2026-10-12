# ChessLens 🔍♟️

> **A free, privacy-first, browser-based chess game reviewer powered by Stockfish WebAssembly. Analyze your games with real-time evaluation momentum graphs, win-probability accuracy metrics, and engine-guided move classifications — with 100% client-side computation ($0 cloud server fees).**

[![CI Test Suite & Build Verification](https://github.com/codedbyroy/chess-game-review/actions/workflows/ci.yml/badge.svg)](https://github.com/codedbyroy/chess-game-review/actions/workflows/ci.yml)
[![Deploy to GitHub Pages](https://github.com/codedbyroy/chess-game-review/actions/workflows/deploy.yml/badge.svg)](https://github.com/codedbyroy/chess-game-review/actions/workflows/deploy.yml)
[![Tests Passing](https://img.shields.io/badge/Vitest-50%2F50%20Passed-brightgreen.svg)](docs/TESTING.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue.svg)](tsconfig.json)
[![Next.js](https://img.shields.io/badge/Next.js-15.2-black.svg)](https://nextjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

### 🌐 Live Demo

🔗 **[Launch ChessLens Live on GitHub Pages](https://codedbyroy.github.io/chess-game-review/)**

---

## 📖 About ChessLens

**ChessLens** is an open-source, production-oriented chess game analysis platform built to bring professional-grade post-game reviews to any browser without requiring paid subscriptions, cloud server farms, or transmitting private game data over the wire.

Unlike traditional chess review tools that send PGNs to expensive backend analysis clusters, ChessLens loads **Stockfish in an isolated Web Worker via WebAssembly**, streaming UCI evaluations directly into the user interface without freezing UI frame rates.

### 🌟 Key Highlights

- **⚡ 100% Client-Side Engine Analysis:** Stockfish runs in a dedicated Web Worker using asynchronous UCI messaging. Your device does the math; no servers, no rate limits, no queue delays.
- **🔒 Zero Data Transmission (Privacy-First):** PGNs and game moves never leave your browser.
- **🌐 One-Click Account Importer:** Direct client-side integration with **Chess.com** and **Lichess** public APIs — analyze any player's latest game by username without downloading files.
- **📉 Win-Probability Sigmoid Scoring:** Centipawn engine scores are mapped into intuitive win chances using a verified logistic sigmoid curve ($W = 50 + 50 \times \tanh(0.00175 \times cp)$).
- **🏷️ 9-Tier Move Classification:** Categorizes moves into **Brilliant**, **Best**, **Excellent**, **Good**, **Book**, **Inaccuracy**, **Mistake**, **Blunder**, and **Miss**.
- **📈 Interactive Evaluation Momentum Graph:** SVG-rendered momentum curve visualizing White/Black advantages across every ply, with click-to-move scrubbing and turning-point indicators.
- **📊 Accuracy Engine:** Calculates realistic human player accuracy ratings (10%–100%) using an exponential error loss formula.
- **🛡️ Hardened Edge-Case Handling:** Fully tested against pawn underpromotions (`=N`, `=R`, `=B`), en passant captures, castling rights, stalemates, malformed PGN headers, and 100-ply marathon games.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    User([User / PGN Input]) --> Modal[PGN Modal & File Reader]
    Modal --> Parser[chess.js PGN Parser]
    Parser --> State[Board & History State]

    subgraph UI ["Presentation Layer (React 19 / Tailwind CSS)"]
        Board[SVG Chessboard & Eval Bar]
        Controls[Board Controls & Flipper]
        MoveList[Move List Navigator]
        Graph[Interactive Momentum Graph]
        Summary[Review Summary & Accuracies]
        Feedback[Move Feedback & Recommendations]
    end

    State --> Board
    State --> MoveList
    Controls --> State

    subgraph Pipeline ["Analysis & Scoring Pipeline"]
        Queue[Sequential Ply Queue]
        EngineBridge[Engine Service Bridge]
        Sigmoid[Win Probability Sigmoid Model]
        Classifier[Move Classification Engine]
        AccuracyCalc[Accuracy Model]
    end

    State --> Queue
    Queue --> EngineBridge

    subgraph Worker ["Isolated Background Thread"]
        WebWorker[Web Worker (Stockfish Wasm)]
        UCI[UCI Protocol Handler]
        WebWorker <--> UCI
    end

    EngineBridge <-->|postMessage / onmessage| WebWorker
    EngineBridge --> Sigmoid
    Sigmoid --> Classifier
    Classifier --> AccuracyCalc

    Classifier --> Summary
    Classifier --> Feedback
    AccuracyCalc --> Summary
    Sigmoid --> Graph
    EngineBridge --> Board
```

---

## 📐 Mathematical Models

### 1. Win-Probability Sigmoid Transformation
Raw engine evaluations (centipawns) are unbounded and non-linear (a $+1000$ cp advantage is functionally identical to $+2000$ cp — both represent a completely winning position). ChessLens normalizes scores using a logistic sigmoid:

$$W(cp) = 50 + 50 \times \left( \frac{2}{1 + e^{-0.0035 \times cp}} - 1 \right)$$

- At $0$ cp $\to 50\%$ win probability (balanced).
- At $+300$ cp $\to \approx 74\%$ win probability.
- At $+1000$ cp $\to \approx 97\%$ win probability.
- Forced checkmate in $N$ moves ($Mate\ N$) $\to 100\%$ ($+Mate$) or $0\%$ ($-Mate$).

### 2. Move Classification Thresholds
Move quality is assessed by calculating the delta between the played move's win probability and the engine's best move:

$$\Delta W = W_{best} - W_{played}$$

| Classification | Condition | Description |
|---|---|---|
| **Brilliant** 💎 | $\Delta W \le 0.5\%$ and Piece Sacrificed | Optimal tactical move sacrificing material to gain a decisive advantage. |
| **Best** ⭐ | $\Delta W \le 1.0\%$ | The top move found by the engine. |
| **Excellent** 👍 | $1.0\% < \Delta W \le 3.0\%$ | Nearly optimal move maintaining advantage. |
| **Good** ✔️ | $3.0\% < \Delta W \le 7.0\%$ | Solid playable move. |
| **Book** 📖 | Opening plies within standard theory | Recognized opening moves. |
| **Inaccuracy** ⚠️ | $7.0\% < \Delta W \le 15.0\%$ | Suboptimal choice yielding slight advantage. |
| **Mistake** ❓ | $15.0\% < \Delta W \le 25.0\%$ | Significant drop in win probability. |
| **Blunder** ❌ | $\Delta W > 25.0\%$ | Critical error shifting the game outcome. |
| **Miss** ⭕ | Best move was winning ($\ge 80\%$), played move $\le 50\%$ | Missed tactical knockout blow. |

---

## 🧪 Testing & Reliability

The application includes comprehensive unit testing via **Vitest** covering core chess logic, engine communication, and edge cases:

```bash
npm test
```

```text
 ✓ tests/chess-api.test.ts (6 tests)
 ✓ tests/uci-protocol.test.ts (8 tests)
 ✓ tests/review-pipeline.test.ts (15 tests)
 ✓ tests/pgn-parser.test.ts (5 tests)
 ✓ tests/chess-edge-cases.test.ts (10 tests)

Test Files  5 passed (5)
     Tests  44 passed (44)
```

Test suites cover:
- **Online platform APIs**: Lichess and Chess.com success parsing, 404 user validation, and empty archive edge cases.
- **Pawn underpromotions** (`=N`, `=R`, `=B`), verifying disambiguation and legal move generation.
- **En passant captures** and castling rights preservation across FEN transitions.
- **Stalemate and draw detection** without engine crashes.
- **UCI protocol edge cases**: White-perspective normalization, negative centipawns, and forced checkmate strings (`mate -2`, `mate 4`).
- **100-ply marathon game parsing**: stress tested under 150ms execution ceiling.

---

## 🛠️ Local Development

```bash
# 1. Clone the repository
git clone https://github.com/codedbyroy/chess-game-review.git
cd chess-game-review

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev

# 4. Open in browser
# http://localhost:3000
```

### Verification Commands
```bash
# TypeScript type check (strict mode)
npm run typecheck

# Run unit tests
npm test

# Production static export build
npm run build
```

---

## 📚 Project Documentation

- [**Technical Case Study & System Design**](docs/CASE_STUDY.md): Complete engineering architecture, concurrency, math models, and interview Q&A.
- [**System Architecture**](docs/ARCHITECTURE.md): Web Worker concurrency, state management, and component breakdown.
- [**Phased Roadmap**](docs/ROADMAP.md): Milestone progress and completed deliverables.
- [**Architectural Decisions (ADRs)**](docs/DECISIONS.md): Key engineering choices and trade-offs.
- [**Current Implementation State**](docs/CURRENT_STATE.md): Source-of-truth status document.
- [**Testing Strategy**](docs/TESTING.md): Test matrix and coverage breakdown.
- [**Release Changelog**](CHANGELOG.md): Historical record of major version iterations.

---

## 📜 License

- **ChessLens Application Code:** [MIT License](LICENSE)
- **Stockfish Chess Engine:** [GNU General Public License v3 (GPLv3)](https://www.gnu.org/licenses/gpl-3.0.en.html)
