# Architecture Design — ChessLens

## 1. System Overview
ChessLens is architected as a client-side Single Page Application (SPA) built on **Next.js**, **React**, and **TypeScript**. Heavy chess engine computations are delegated to a dedicated **Web Worker** executing **Stockfish WebAssembly**, ensuring that the user interface maintains 60 FPS responsiveness even during deep tactical searches.

```mermaid
flowchart TD
    subgraph UI ["Main Thread (React / Next.js)"]
        Input[PGN Input / File Upload]
        Validator[chess.js Parser & Validator]
        State[Game & Review State Manager]
        Board[Interactive Chessboard]
        EvalBar[Dynamic Evaluation Bar]
        Chart[Evaluation Graph (Recharts)]
        Summary[Game Report & Accuracy Cards]
    end

    subgraph WorkerBridge ["Worker Bridge Layer"]
        Queue[UCI Command Queue & Job Manager]
        Debounce[Cancellation & Stale-Response Filter]
    end

    subgraph EngineThread ["Dedicated Web Worker Thread"]
        Stockfish[Stockfish 16 / 17 WebAssembly]
        NNUE[NNUE Neural Network]
    end

    Input --> Validator
    Validator --> State
    State --> Board
    State --> Queue
    Queue --> Debounce
    Debounce --> Stockfish
    Stockfish --> NNUE
    Stockfish -- "UCI Responses (info depth, score cp/mate, bestmove)" --> Debounce
    Debounce -- "Normalized Move Analysis" --> State
    State --> EvalBar
    State --> Chart
    State --> Summary
```

---

## 2. Technology Stack & Component Boundaries

| Layer | Technology | Rationale / Boundary |
| :--- | :--- | :--- |
| **Framework** | Next.js (App Router) + React | Modular component tree, fast build tooling, static export support. |
| **Language** | TypeScript (Strict Mode) | Strong compile-time type safety for complex chess states, UCI payloads, and eval data. |
| **Styling** | Tailwind CSS | Utility-first styling with zero runtime CSS-in-JS overhead; responsive dark theme. |
| **Chess Rules** | `chess.js` | Industry standard for move generation, FEN handling, and legal SAN parsing. |
| **Board UI** | `react-chessboard` (or SVG renderer) | Accessible, touch/mouse-friendly chessboard component. |
| **Engine** | Stockfish WebAssembly | Open-source, ~3600 Elo tactical calculation executed locally via Web Worker. |
| **Graphing** | Recharts (or Canvas Chart) | Lightweight evaluation momentum curve synchronized to move selection. |
| **Testing** | Vitest + React Testing Library | Blazing fast ESM unit and component testing. |

---

## 3. Data Flow & Evaluation Pipeline

### A. PGN Ingestion & Validation
1. User provides PGN text or `.pgn` file.
2. `chess.js` parses headers, tags, and SAN move sequence.
3. If valid, an array of `MoveRecord` items is generated containing:
   - Move index / ply number.
   - SAN notation (e.g., `Nf3`, `exd5`, `O-O`).
   - FEN string *before* the move.
   - FEN string *after* the move.

### B. Worker Concurrency & Stale-Response Guarding
To prevent race conditions when users jump between moves while the engine is thinking:
1. The `EngineService` assigns each analysis request a unique `jobId`.
2. When a new job begins or when the analysis is canceled, a `stop` command is sent to Stockfish.
3. Incoming worker messages with mismatched or obsolete `jobId`s are discarded immediately.

### C. Evaluation & Move Classification
1. Stockfish evaluates each position after move $i$ to a bounded depth (e.g., depth 15–18).
2. Scores are converted from White's perspective to centipawns ($cp$).
3. **Win Probability Mapping:**
   $$W(cp) = 50 + 50 \times \left(\frac{2}{1 + e^{-0.0035 \times cp}} - 1\right)$$
4. Win chance drop ($\Delta W$) dictates move classification:
   - **Brilliant (‼️):** Clean piece sacrifice that preserves high win chance.
   - **Best (⭐):** Minimal or zero win chance drop ($\le 1.5\%$).
   - **Excellent (👍):** Minor drop ($\le 4\%$).
   - **Good:** Small drop ($\le 8\%$).
   - **Inaccuracy (❓):** Moderate drop ($\le 15\%$).
   - **Mistake (❓❓):** Notable drop ($\le 25\%$).
   - **Blunder (❌):** Severe drop ($> 25\%$).
   - **Miss (⚠️):** Overlooking an opponent's blunder or immediate tactical win.

---

## 4. Performance & Memory Considerations
- **Memory Footprint**: Stockfish Wasm runtime utilizes 30MB–80MB of RAM inside the worker thread.
- **Worker Isolation**: The main React rendering thread is never blocked during engine calculations.
- **Web Worker Assets**: WebAssembly files (`.wasm`) must be served with appropriate MIME types (`application/wasm`) and cached statically.
