# ChessLens 🔍♟️

> **A free, browser-based chess game reviewer that helps players understand their mistakes through engine analysis, evaluation graphs, best-move suggestions, and actionable learning insights.**

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Stockfish Engine](https://img.shields.io/badge/Engine-Stockfish%20Wasm-blue.svg)](https://stockfishchess.org/)
[![Status](https://img.shields.io/badge/Status-Phase%200%20Complete-orange.svg)](docs/ROADMAP.md)

---

## 📖 About ChessLens

**ChessLens** is an open-source web application designed to democratize high-quality chess game review. Built with **Next.js**, **TypeScript**, and **Stockfish WebAssembly**, all evaluations are performed client-side inside an isolated Web Worker.

- **Zero Cloud Costs:** $0 server fees — runs 100% on the user's browser.
- **Private & Offline-First:** Your game PGNs are never transmitted to external servers.
- **Explainable Metrics:** Move classifications and accuracy ratings are based on transparent win-probability loss models.

---

## 🏗️ Architecture & Documentation

Comprehensive system documentation is maintained in the [`docs/`](docs/) directory:

- [**Project Brief**](docs/PROJECT_BRIEF.md): Product vision, user profiles, scope, and non-goals.
- [**System Architecture**](docs/ARCHITECTURE.md): Component boundaries, Web Worker concurrency model, and data flow.
- [**Phased Roadmap**](docs/ROADMAP.md): Task breakdown and milestone acceptance criteria.
- [**Architectural Decisions (ADRs)**](docs/DECISIONS.md): Technology choices, trade-offs, and rationale.
- [**Current Implementation State**](docs/CURRENT_STATE.md): Verified state of the codebase.
- [**Testing Strategy**](docs/TESTING.md): Unit, integration, and E2E test plan.
- [**Known Issues**](docs/KNOWN_ISSUES.md): Active limitations and workarounds.
- [**AI Agent Directives**](AGENTS.md): Operational rules for pair-programming agents.

---

## 🚀 Phased Roadmap Status

- [x] **Phase 0: Repository Audit & Project Setup** (Complete)
- [ ] **Phase 1: Application Foundation** (Next.js, TypeScript, Tailwind, PGN parser, Chessboard)
- [ ] **Phase 2: Stockfish WebAssembly Integration** (Web Worker, UCI bridge, position eval)
- [ ] **Phase 3: Move-by-Move Game Analysis Pipeline** (Win chance math, move classifications)
- [ ] **Phase 4: Full Review Interface** (Evaluation graphs, summary reports, move feedback)
- [ ] **Phase 5: Reliability & Quality Assurance** (Comprehensive test suite & edge cases)
- [ ] **Phase 6: Production Deployment** (Vercel / GitHub Pages deployment & CI/CD)
- [ ] **Phase 7: Portfolio Presentation** (Case study, LinkedIn launch, and enhancements)

---

## 🛠️ Local Development

```bash
# Clone the repository
git clone https://github.com/codedbyroy/chess-game-review.git
cd chess-game-review

# Current prototype preview
python3 -m http.server 8000
# Open http://localhost:8000 in your browser
```

---

## 📜 License

- **ChessLens Source Code:** [MIT License](LICENSE)
- **Stockfish Chess Engine:** [GNU General Public License v3 (GPLv3)](https://www.gnu.org/licenses/gpl-3.0.en.html)
