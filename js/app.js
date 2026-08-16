import { Chess } from './chess.js';
import { StockfishEngine } from './stockfish-worker.js';
import { GameReviewEngine } from './review-engine.js';

/**
 * Main Application Controller for Chess Game Review.
 */
class App {
  constructor() {
    this.game = new Chess();
    this.engine = new StockfishEngine();
    this.parsedMoves = [];
    this.analysisResults = null;
    this.currentMoveIndex = -1;
    this.isFlipped = false;
    this.isPlaying = false;
    this.playInterval = null;

    // Piece SVG URLs (Wikimedia public domain SVG chess set)
    this.pieceSvgMap = {
      pw: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg',
      nw: 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg',
      bw: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg',
      rw: 'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg',
      qw: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg',
      kw: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg',
      pb: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg',
      nb: 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg',
      bb: 'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg',
      rb: 'https://upload.wikimedia.org/wikipedia/commons/ff/ff/Chess_rdt45.svg',
      qb: 'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg',
      kb: 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg'
    };

    this.initUi();
    this.loadSampleGame();
  }

  initUi() {
    // DOM Elements
    this.chessboardEl = document.getElementById('chessboard');
    this.evalBarFill = document.getElementById('eval-bar-fill');
    this.evalBarScore = document.getElementById('eval-bar-score');

    // Controls
    document.getElementById('btn-first').addEventListener('click', () => this.goToMove(-1));
    document.getElementById('btn-prev').addEventListener('click', () => this.goToMove(this.currentMoveIndex - 1));
    document.getElementById('btn-next').addEventListener('click', () => this.goToMove(this.currentMoveIndex + 1));
    document.getElementById('btn-last').addEventListener('click', () => this.goToMove(this.parsedMoves.length - 1));
    document.getElementById('btn-play').addEventListener('click', () => this.togglePlay());
    document.getElementById('btn-flip').addEventListener('click', () => this.toggleFlip());
    document.getElementById('btn-start-review').addEventListener('click', () => this.runGameReview());

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft') this.goToMove(this.currentMoveIndex - 1);
      if (e.key === 'ArrowRight') this.goToMove(this.currentMoveIndex + 1);
      if (e.key === 'Home') this.goToMove(-1);
      if (e.key === 'End') this.goToMove(this.parsedMoves.length - 1);
      if (e.key === ' ') { e.preventDefault(); this.togglePlay(); }
      if (e.key === 'f' || e.key === 'F') this.toggleFlip();
    });

    // PGN Modal
    const pgnModal = document.getElementById('pgn-modal');
    document.getElementById('open-pgn-modal-btn').addEventListener('click', () => pgnModal.classList.remove('hidden'));
    document.getElementById('close-pgn-modal').addEventListener('click', () => pgnModal.classList.add('hidden'));
    document.getElementById('cancel-pgn-btn').addEventListener('click', () => pgnModal.classList.add('hidden'));
    document.getElementById('load-pgn-btn').addEventListener('click', () => {
      const text = document.getElementById('pgn-textarea').value;
      if (text) {
        this.loadPgn(text);
        pgnModal.classList.add('hidden');
      }
    });

    // File Upload
    document.getElementById('pgn-file-input').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          this.loadPgn(evt.target.result);
          pgnModal.classList.add('hidden');
        };
        reader.readAsText(file);
      }
    });

    // Chess.com Fetcher Form
    document.getElementById('fetch-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const username = document.getElementById('username-input').value.trim();
      if (username) this.fetchChessComGames(username);
    });

    // Games Modal Close
    document.getElementById('close-games-modal').addEventListener('click', () => {
      document.getElementById('games-modal').classList.add('hidden');
    });
    document.getElementById('close-games-btn').addEventListener('click', () => {
      document.getElementById('games-modal').classList.add('hidden');
    });

    this.renderBoard();
  }

  loadSampleGame() {
    // Opera Game by Paul Morphy
    const operaGamePgn = `[Event "A Night at the Opera"]
[Site "Paris FRA"]
[Date "1858.??.??"]
[White "Morphy, Paul"]
[Black "Duke Karl / Count Isouard"]
[Result "1-0"]
[ECO "C41"]

1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7 8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+ Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7 14. Rd1 Qe6 15. Bxd7+ Nxd7 16. Qb8+ Nxb8 17. Rd8# 1-0`;

    this.loadPgn(operaGamePgn);
  }

  loadPgn(pgnText) {
    const parsed = Chess.parsePgn(pgnText);
    this.parsedMoves = parsed.moves;
    this.analysisResults = null;

    // Set Players
    document.getElementById('white-name').textContent = parsed.headers.White || 'White Player';
    document.getElementById('black-name').textContent = parsed.headers.Black || 'Black Player';
    document.getElementById('game-title').textContent = `${parsed.headers.White || 'White'} vs ${parsed.headers.Black || 'Black'}`;
    document.getElementById('game-date').textContent = parsed.headers.Date || 'Recent Game';
    document.getElementById('game-eco').textContent = parsed.headers.ECO ? `ECO ${parsed.headers.ECO}` : 'Standard Game';

    // Reset UI
    this.resetAccuracyMeters();
    this.renderMoveList();
    this.goToMove(-1);

    // Auto trigger review
    this.runGameReview();
  }

  async fetchChessComGames(username) {
    const fetchBtn = document.getElementById('fetch-btn');
    fetchBtn.innerHTML = `<span>Fetching...</span>`;

    try {
      // Get user archives
      const archivesRes = await fetch(`https://api.chess.com/pub/player/${username}/games/archives`);
      if (!archivesRes.ok) throw new Error('Player not found or profile is private.');
      
      const archivesData = await archivesRes.json();
      const archives = archivesData.archives;
      if (!archives || archives.length === 0) throw new Error('No game archives found.');

      // Fetch last month's games
      const latestArchive = archives[archives.length - 1];
      const gamesRes = await fetch(latestArchive);
      const gamesData = await gamesRes.json();

      const games = gamesData.games.slice(-15).reverse(); // Last 15 games
      this.displayGamesModal(username, games);
    } catch (err) {
      alert(`Error fetching games: ${err.message}`);
    } finally {
      fetchBtn.innerHTML = `<span>Fetch Games</span>`;
    }
  }

  displayGamesModal(username, games) {
    const listEl = document.getElementById('games-list');
    listEl.innerHTML = '';

    games.forEach((game) => {
      const item = document.createElement('div');
      item.className = 'game-item';
      
      const white = game.white.username;
      const black = game.black.username;
      const timeClass = game.time_class || 'blitz';
      const date = new Date(game.end_time * 1000).toLocaleDateString();

      item.innerHTML = `
        <div class="game-item-players">
          <div class="game-item-player">⚪ ${white} (${game.white.rating})</div>
          <div class="game-item-player">⚫ ${black} (${game.black.rating})</div>
        </div>
        <div class="game-item-meta">
          <span style="text-transform: capitalize; font-weight: 700;">${timeClass}</span>
          <span>${date}</span>
        </div>
      `;

      item.addEventListener('click', () => {
        if (game.pgn) {
          this.loadPgn(game.pgn);
          document.getElementById('games-modal').classList.add('hidden');
        }
      });

      listEl.appendChild(item);
    });

    document.getElementById('games-modal-title').textContent = `Recent Games for "${username}"`;
    document.getElementById('games-modal').classList.remove('hidden');
  }

  async runGameReview() {
    if (this.parsedMoves.length === 0) return;

    const overlay = document.getElementById('analysis-overlay');
    const overlayText = document.getElementById('overlay-text');
    const progressFill = document.getElementById('analysis-progress-fill');
    const targetDepth = parseInt(document.getElementById('depth-select').value, 10);

    overlay.classList.remove('hidden');
    progressFill.style.width = '0%';

    const evalResults = [];
    const total = this.parsedMoves.length;

    for (let i = 0; i < total; i++) {
      const move = this.parsedMoves[i];
      overlayText.textContent = `Analyzing Move ${i + 1} of ${total}...`;

      // Run Stockfish evaluation
      const evalRes = await this.engine.evaluatePosition(move.fenAfter, targetDepth);
      evalResults.push(evalRes);

      const percent = Math.round(((i + 1) / total) * 100);
      progressFill.style.width = `${percent}%`;
    }

    // Run Review Engine Classifications & Accuracies
    this.analysisResults = GameReviewEngine.analyzeGame(this.parsedMoves, evalResults);

    overlay.classList.add('hidden');
    document.getElementById('review-status-badge').textContent = 'Review Complete';

    // Render Dashboard Results
    this.renderAccuracyMeters();
    this.renderClassificationsGrid();
    this.renderMoveList();
    this.renderEvalChart();
    this.goToMove(0);
  }

  resetAccuracyMeters() {
    document.getElementById('white-accuracy-text').textContent = '--%';
    document.getElementById('black-accuracy-text').textContent = '--%';
    document.getElementById('white-meter-val').textContent = '--%';
    document.getElementById('black-meter-val').textContent = '--%';
    document.getElementById('white-circle').style.setProperty('--acc', '0');
    document.getElementById('black-circle').style.setProperty('--acc', '0');
  }

  renderAccuracyMeters() {
    if (!this.analysisResults) return;

    const wAcc = this.analysisResults.whiteAccuracy;
    const bAcc = this.analysisResults.blackAccuracy;

    document.getElementById('white-accuracy-text').textContent = `${wAcc}%`;
    document.getElementById('black-accuracy-text').textContent = `${bAcc}%`;

    document.getElementById('white-meter-val').textContent = `${wAcc}%`;
    document.getElementById('black-meter-val').textContent = `${bAcc}%`;

    document.getElementById('white-circle').style.setProperty('--acc', `${wAcc}`);
    document.getElementById('black-circle').style.setProperty('--acc', `${bAcc}`);
  }

  renderClassificationsGrid() {
    if (!this.analysisResults) return;

    const gridEl = document.getElementById('class-grid');
    gridEl.innerHTML = '';

    const categories = [
      { name: 'Brilliant', key: 'brilliant', icon: '‼️', color: 'var(--color-brilliant)' },
      { name: 'Great', key: 'great', icon: '🎯', color: 'var(--color-great)' },
      { name: 'Best', key: 'best', icon: '⭐', color: 'var(--color-best)' },
      { name: 'Excellent', key: 'excellent', icon: '👍', color: 'var(--color-excellent)' },
      { name: 'Book', key: 'book', icon: '📖', color: 'var(--color-book)' },
      { name: 'Inaccuracy', key: 'inaccuracy', icon: '❓', color: 'var(--color-inaccuracy)' },
      { name: 'Mistake', key: 'mistake', icon: '❓❓', color: 'var(--color-mistake)' },
      { name: 'Blunder', key: 'blunder', icon: '❌', color: 'var(--color-blunder)' },
      { name: 'Miss', key: 'miss', icon: '⚠️', color: 'var(--color-miss)' }
    ];

    const counts = {};
    categories.forEach(c => counts[c.key] = 0);

    this.analysisResults.classifiedMoves.forEach(m => {
      if (counts[m.classification.key] !== undefined) {
        counts[m.classification.key]++;
      }
    });

    categories.forEach(cat => {
      const item = document.createElement('div');
      item.className = 'class-item';
      item.innerHTML = `
        <div class="class-pill">
          <span style="color: ${cat.color};">${cat.icon || '•'}</span>
          <span>${cat.name}</span>
        </div>
        <span class="class-count">${counts[cat.key]}</span>
      `;
      gridEl.appendChild(item);
    });
  }

  renderMoveList() {
    const container = document.getElementById('movelist-container');
    container.innerHTML = '';

    for (let i = 0; i < this.parsedMoves.length; i += 2) {
      const moveNum = Math.floor(i / 2) + 1;
      const whiteMove = this.parsedMoves[i];
      const blackMove = this.parsedMoves[i + 1];

      const row = document.createElement('div');
      row.className = 'move-row';
      row.id = `move-row-${moveNum}`;

      const whiteAnalysis = this.analysisResults ? this.analysisResults.classifiedMoves[i] : null;
      const blackAnalysis = this.analysisResults && blackMove ? this.analysisResults.classifiedMoves[i + 1] : null;

      row.innerHTML = `
        <span class="move-num">${moveNum}.</span>
        <span class="move-cell" id="move-cell-${i}">
          ${whiteMove.san} ${whiteAnalysis ? `<small style="color:${whiteAnalysis.classification.color}">${whiteAnalysis.classification.icon}</small>` : ''}
        </span>
        <span class="move-cell" id="move-cell-${i+1}">
          ${blackMove ? `${blackMove.san} ${blackAnalysis ? `<small style="color:${blackAnalysis.classification.color}">${blackAnalysis.classification.icon}</small>` : ''}` : ''}
        </span>
      `;

      container.appendChild(row);

      // Event listeners
      document.getElementById(`move-cell-${i}`).addEventListener('click', () => this.goToMove(i));
      if (blackMove) {
        document.getElementById(`move-cell-${i+1}`).addEventListener('click', () => this.goToMove(i + 1));
      }
    }
  }

  renderEvalChart() {
    if (!this.analysisResults) return;

    const canvas = document.getElementById('eval-chart');
    const ctx = canvas.getContext('2d');
    
    // Set Canvas Dimensions
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;

    const moves = this.analysisResults.classifiedMoves;
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Draw Zero Center Line
    ctx.strokeStyle = '#3d3a37';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    // Plot Evaluation Curve
    ctx.strokeStyle = '#81b64c';
    ctx.lineWidth = 2;
    ctx.beginPath();

    const step = w / Math.max(1, moves.length - 1);

    moves.forEach((m, idx) => {
      const winProb = m.winProbWhite; // 0 to 100
      const y = h - (winProb / 100) * h;
      const x = idx * step;

      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.stroke();
  }

  goToMove(index) {
    if (index < -1) index = -1;
    if (index >= this.parsedMoves.length) index = this.parsedMoves.length - 1;

    this.currentMoveIndex = index;

    // Update FEN Position
    if (index === -1) {
      this.game.load('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    } else {
      this.game.load(this.parsedMoves[index].fenAfter);
    }

    this.renderBoard();
    this.updateEvalBar();
    this.updateCommentary();
    this.highlightActiveMoveCell();
  }

  renderBoard() {
    this.chessboardEl.innerHTML = '';
    const fen = this.game.fen();
    const fenBoard = fen.split(' ')[0];
    const rows = fenBoard.split('/');

    const lastMove = this.currentMoveIndex >= 0 ? this.parsedMoves[this.currentMoveIndex] : null;

    for (let r = 0; r < 8; r++) {
      const displayR = this.isFlipped ? 7 - r : r;
      let c = 0;

      for (let char of rows[displayR]) {
        if (/\d/.test(char)) {
          const emptyCount = parseInt(char, 10);
          for (let e = 0; e < emptyCount; e++) {
            const displayC = this.isFlipped ? 7 - c : c;
            this.createSquare(displayR, displayC, null, lastMove);
            c++;
          }
        } else {
          const displayC = this.isFlipped ? 7 - c : c;
          const piece = {
            color: char === char.toUpperCase() ? 'w' : 'b',
            type: char.toLowerCase()
          };
          this.createSquare(displayR, displayC, piece, lastMove);
          c++;
        }
      }
    }
  }

  createSquare(r, c, piece, lastMove) {
    const square = document.createElement('div');
    const isLight = (r + c) % 2 === 0;
    square.className = `square ${isLight ? 'light' : 'dark'}`;
    
    const sqName = String.fromCharCode(97 + c) + (8 - r);
    square.dataset.square = sqName;

    // Highlight last move
    if (lastMove && (lastMove.from === sqName || lastMove.to === sqName)) {
      square.classList.add('last-move');
    }

    // Board Coordinates
    if (c === (this.isFlipped ? 7 : 0)) {
      const rankSpan = document.createElement('span');
      rankSpan.className = 'coord coord-rank';
      rankSpan.textContent = 8 - r;
      square.appendChild(rankSpan);
    }
    if (r === (this.isFlipped ? 0 : 7)) {
      const fileSpan = document.createElement('span');
      fileSpan.className = 'coord coord-file';
      fileSpan.textContent = String.fromCharCode(97 + c);
      square.appendChild(fileSpan);
    }

    // Piece Image
    if (piece) {
      const pieceEl = document.createElement('div');
      pieceEl.className = 'piece';
      const key = `${piece.type}${piece.color}`;
      pieceEl.style.backgroundImage = `url(${this.pieceSvgMap[key]})`;
      square.appendChild(pieceEl);
    }

    // Move classification badge on target square
    if (lastMove && lastMove.to === sqName && this.analysisResults) {
      const analysis = this.analysisResults.classifiedMoves[this.currentMoveIndex];
      if (analysis && analysis.classification.icon) {
        const badge = document.createElement('div');
        badge.className = 'badge-on-square';
        badge.style.backgroundColor = analysis.classification.color;
        badge.textContent = analysis.classification.icon;
        square.appendChild(badge);
      }
    }

    this.chessboardEl.appendChild(square);
  }

  updateEvalBar() {
    if (!this.analysisResults || this.currentMoveIndex < 0) {
      this.evalBarFill.style.height = '50%';
      this.evalBarScore.textContent = '0.0';
      return;
    }

    const analysis = this.analysisResults.classifiedMoves[this.currentMoveIndex];
    const winProb = analysis.winProbWhite; // 0 to 100
    const cp = analysis.eval.cp;

    this.evalBarFill.style.height = `${winProb}%`;
    const cpFormatted = (cp / 100).toFixed(1);
    this.evalBarScore.textContent = cp >= 0 ? `+${cpFormatted}` : cpFormatted;
  }

  updateCommentary() {
    const badgeEl = document.getElementById('current-move-badge');
    const evalTag = document.getElementById('current-eval-tag');
    const commentaryText = document.getElementById('commentary-text');

    if (this.currentMoveIndex < 0) {
      badgeEl.innerHTML = `<span class="badge-icon" style="background:#777;">•</span><span class="badge-title">Starting Position</span>`;
      evalTag.textContent = 'Eval: 0.0';
      commentaryText.textContent = 'Game starting position.';
      return;
    }

    const move = this.parsedMoves[this.currentMoveIndex];
    const analysis = this.analysisResults ? this.analysisResults.classifiedMoves[this.currentMoveIndex] : null;

    if (analysis) {
      const cls = analysis.classification;
      badgeEl.innerHTML = `
        <span class="badge-icon" style="background-color:${cls.color};">${cls.icon || '•'}</span>
        <span class="badge-title">Move ${move.moveNum} (${move.san}) - ${cls.name}</span>
      `;
      evalTag.textContent = `Eval: ${(analysis.eval.cp / 100).toFixed(1)}`;
      commentaryText.textContent = cls.commentary;
    } else {
      badgeEl.innerHTML = `<span class="badge-title">Move ${move.moveNum} (${move.san})</span>`;
      evalTag.textContent = 'Eval: --';
      commentaryText.textContent = 'Run game review to see analysis.';
    }
  }

  highlightActiveMoveCell() {
    document.querySelectorAll('.move-cell').forEach(el => el.classList.remove('selected-row'));
    if (this.currentMoveIndex >= 0) {
      const activeCell = document.getElementById(`move-cell-${this.currentMoveIndex}`);
      if (activeCell) activeCell.classList.add('selected-row');
    }
  }

  toggleFlip() {
    this.isFlipped = !this.isFlipped;
    this.renderBoard();
  }

  togglePlay() {
    this.isPlaying = !this.isPlaying;
    const playBtn = document.getElementById('btn-play');

    if (this.isPlaying) {
      playBtn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`;
      this.playInterval = setInterval(() => {
        if (this.currentMoveIndex < this.parsedMoves.length - 1) {
          this.goToMove(this.currentMoveIndex + 1);
        } else {
          this.togglePlay();
        }
      }, 1000);
    } else {
      playBtn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
      clearInterval(this.playInterval);
    }
  }
}

// Instantiate App
window.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
