# Chess Game Review (Offline & WebAssembly Powered)

A 100% free, privacy-first, offline-capable **Chess.com-Style Game Review Web Application**. Features in-browser Stockfish WebAssembly engine evaluation, real-time win-probability accuracy metrics, move classifications (Brilliant ‼️, Great 🎯, Best ⭐, Blunder ❌, Miss ⚠️), interactive board navigation, evaluation graphs, and direct Chess.com game fetching.

![Chess Review Preview](https://img.shields.io/badge/Chess--Engine-Stockfish--Wasm-81b64c?style=for-the-badge&logo=chess)
![Offline](https://img.shields.io/badge/Offline-100%25-blue?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

---

## ✨ Features

- **📥 Chess.com Direct Game Fetcher:** Enter any public Chess.com username and instantly load their recent blitz/bullet/rapid games via the official Chess.com Public API.
- **📄 PGN / File Importer:** Paste PGN text or load `.pgn` files from any platform (Lichess, Chess.com, OTB).
- **⚡ In-Browser Stockfish Wasm Engine:** Zero cloud server costs, zero API keys required. Runs multi-threaded evaluations directly on your local device.
- **📊 Win Probability & Accuracy Ratings:** Mathematical model mapping centipawn scores to expected win percentage and overall player accuracy (0–100%).
- **🏷️ Chess.com-Style Move Badges:**
  - ‼️ **Brilliant:** Tactical piece sacrifices that preserve or increase win probability.
  - 🎯 **Great Move:** Key move found in critical positions.
  - ⭐ **Best Move:** Top Stockfish engine recommendation.
  - 👍 **Excellent / Good:** Solid positional play.
  - 📖 **Book:** Standard theoretical opening move.
  - ❓ **Inaccuracy:** Minor loss of evaluation.
  - ❓❓ **Mistake:** Noticeable loss of positional advantage.
  - ❌ **Blunder:** Severe blunder altering game trajectory.
  - ⚠️ **Miss:** Overlooked winning tactic.
- **📈 Evaluation Graph:** Dynamic canvas line chart plotting centipawn momentum across all moves.
- **⌨️ Keyboard Navigation:** Arrow keys (`Left`/`Right`), `Home`/`End`, `Space` (auto-play), and `F` (flip board).

---

## 🛠️ Local Setup & Quick Start

Since this is a client-side WebAssembly application, no build steps (npm/webpack) are required!

### Option 1: Double-Click / Local File
Simply open `index.html` in your Web Browser (Google Chrome, Brave, Safari, Edge, Firefox).

### Option 2: Local HTTP Server (Recommended for Web Workers)
If your browser blocks Web Workers from `file://` URIs, run a quick local HTTP server:

```bash
# Python 3
python3 -m http.server 8000
```
Then open `http://localhost:8000` in Chrome.

---

## 🚀 How to Push to Your GitHub Repository

Follow these standard commands to push this project to your GitHub repository:

### 1. Open Terminal and Navigate to the Directory
```bash
cd /Users/ankushroy/.gemini/antigravity/scratch/chess-game-review
```

### 2. Initialize Git Repository
```bash
git init
git add .
git commit -m "Initial commit: Offline Chess.com Game Review App with Stockfish Wasm"
```

### 3. Add Remote & Push
Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual GitHub repository details:

```bash
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

---

## 🌐 Free Hosting via GitHub Pages

You can host this app for free using **GitHub Pages**:

1. Go to your repository settings on GitHub: `https://github.com/YOUR_USERNAME/YOUR_REPO_NAME/settings/pages`
2. Under **Build and deployment**, select `Deploy from a branch`.
3. Select `main` branch and `/ (root)` folder.
4. Click **Save**. Your site will be live at `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/` in 1 minute!

---

## 📜 Technical Architecture

- **`index.html`**: Responsive dark theme UI layout.
- **`index.css`**: CSS design system matching modern chess interfaces.
- **`js/chess.js`**: Lightweight FEN/PGN move validator and SAN parser.
- **`js/stockfish-worker.js`**: Web Worker running local UCI position evaluation engine.
- **`js/review-engine.js`**: Mathematical engine for win chance calculation, accuracy score, and move badges.
- **`js/app.js`**: Event-driven application controller.

---

## 📄 License

Distributed under the MIT License. Stockfish Engine is licensed under GNU GPLv3.
