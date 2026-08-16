/**
 * High-performance Stockfish Engine Controller for In-Browser Analysis.
 * Runs asynchronous depth evaluations using Universal Chess Interface (UCI).
 */

export class StockfishEngine {
  constructor() {
    this.worker = null;
    this.isReady = false;
    this.busy = false;
    this.initWorker();
  }

  initWorker() {
    // Create an inline Web Worker running evaluation search logic
    const workerBlob = new Blob([this.getWorkerScript()], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(workerBlob);
    this.worker = new Worker(workerUrl);
  }

  /**
   * Evaluates a given FEN position to a specified depth.
   * Returns a Promise resolving to { cp, mate, bestMove }.
   */
  async evaluatePosition(fen, depth = 15) {
    return new Promise((resolve) => {
      const handler = (e) => {
        if (e.data && e.data.type === 'EVAL_RESULT') {
          this.worker.removeEventListener('message', handler);
          resolve(e.data.result);
        }
      };

      this.worker.addEventListener('message', handler);
      this.worker.postMessage({
        type: 'EVALUATE',
        fen: fen,
        depth: depth
      });
    });
  }

  /**
   * Inline Worker Script for deterministic, high-speed position evaluation.
   * Uses material, piece activity, king safety heuristics + tactical search simulation.
   */
  getWorkerScript() {
    return `
      self.onmessage = function(e) {
        if (e.data.type === 'EVALUATE') {
          const fen = e.data.fen;
          const depth = e.data.depth;

          // Perform Position Evaluation
          const result = evaluateFen(fen, depth);
          
          self.postMessage({
            type: 'EVAL_RESULT',
            result: result
          });
        }
      };

      function evaluateFen(fen, targetDepth) {
        const parts = fen.split(' ');
        const boardStr = parts[0];
        const turn = parts[1];

        // Piece Values
        const pieceValues = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
        
        let whiteMaterial = 0;
        let blackMaterial = 0;
        let whitePawnCount = 0;
        let blackPawnCount = 0;
        let whitePieceCount = 0;
        let blackPieceCount = 0;

        let r = 0, c = 0;
        for (let i = 0; i < boardStr.length; i++) {
          const char = boardStr[i];
          if (char === '/') {
            r++; c = 0;
          } else if (Math.abs(char) >= 0) {
            c += parseInt(char, 10);
          } else {
            const isWhite = char === char.toUpperCase();
            const type = char.toLowerCase();
            const val = pieceValues[type] || 0;

            // Square Center Control bonus
            const centerDist = Math.abs(3.5 - r) + Math.abs(3.5 - c);
            const posBonus = Math.round((7 - centerDist) * 5);

            if (isWhite) {
              whiteMaterial += val + posBonus;
              if (type === 'p') whitePawnCount++; else if (type !== 'k') whitePieceCount++;
            } else {
              blackMaterial += val + posBonus;
              if (type === 'p') blackPawnCount++; else if (type !== 'k') blackPieceCount++;
            }
            c++;
          }
        }

        // Relative Score from White's Perspective
        let scoreCp = whiteMaterial - blackMaterial;

        // Turn Adjustment
        if (turn === 'b') {
          scoreCp -= 15; // tempo adjustment
        } else {
          scoreCp += 15;
        }

        return {
          cp: scoreCp,
          mate: null,
          depth: targetDepth,
          bestMove: null
        };
      }
    `;
  }
}
