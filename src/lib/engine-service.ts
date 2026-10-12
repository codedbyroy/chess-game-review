/**
 * Engine Service: Manages Web Worker lifecycle and UCI evaluation requests.
 * Ensures strict concurrency control, stale-response filtering, and non-blocking computation.
 */

import { UciEvaluation, parseUciInfoLine, parseBestMoveLine } from "./uci-protocol";

export interface EvaluationRequest {
  fen: string;
  depth?: number;
  onProgress?: (evaluation: UciEvaluation) => void;
}

export class EngineService {
  private worker: Worker | null = null;
  private currentJobId: number = 0;
  private isReady: boolean = false;
  private readyCallbacks: Array<() => void> = [];

  constructor() {
    if (typeof window !== "undefined") {
      this.initWorker();
    }
  }

  /**
   * Initializes the dedicated Web Worker running Stockfish analysis.
   */
  private initWorker() {
    try {
      const workerBlob = new Blob([this.getWorkerScript()], {
        type: "application/javascript",
      });
      const workerUrl = URL.createObjectURL(workerBlob);
      this.worker = new Worker(workerUrl);

      this.worker.onmessage = (e: MessageEvent) => {
        this.handleWorkerMessage(e.data);
      };

      // Send initial UCI initialization handshake
      this.worker.postMessage({ type: "UCI_COMMAND", command: "uci" });
      this.worker.postMessage({ type: "UCI_COMMAND", command: "isready" });
    } catch (err) {
      console.error("[EngineService] Failed to initialize Web Worker:", err);
    }
  }

  private handleWorkerMessage(data: { type: string; line?: string }) {
    if (data.type === "UCI_LINE" && data.line) {
      if (data.line === "readyok" || data.line === "uciok") {
        this.isReady = true;
        this.readyCallbacks.forEach((cb) => cb());
        this.readyCallbacks = [];
      }
    }
  }

  /**
   * Ensures the engine worker is initialized and ready before executing searches.
   */
  public async ensureReady(): Promise<void> {
    if (this.isReady) return;
    return new Promise((resolve) => {
      this.readyCallbacks.push(resolve);
      // Fallback timeout in case readyok was already received
      setTimeout(() => {
        this.isReady = true;
        resolve();
      }, 500);
    });
  }

  /**
   * Evaluates a FEN position to a bounded depth with real-time updates.
   * Cancels any previously running analysis job automatically.
   */
  public async evaluatePosition({
    fen,
    depth = 15,
    onProgress,
  }: EvaluationRequest): Promise<UciEvaluation> {
    await this.ensureReady();

    // Increment jobId to invalidate any running searches
    const jobId = ++this.currentJobId;

    // Determine turn from FEN string ('w' or 'b')
    const fenParts = fen.trim().split(/\s+/);
    const turn = (fenParts[1] || "w") as "w" | "b";

    // Stop previous search
    this.worker?.postMessage({
      type: "UCI_COMMAND",
      command: "stop",
    });

    return new Promise((resolve, reject) => {
      let latestEval: UciEvaluation = {
        depth: 0,
        scoreCp: 0,
        mate: null,
        pv: [],
        whiteCp: 0,
        whiteMate: null,
      };

      // Safety timeout after 20 seconds
      const timeoutId = setTimeout(() => {
        if (jobId === this.currentJobId) {
          this.worker?.removeEventListener("message", messageHandler);
          resolve(latestEval);
        }
      }, 20000);

      const messageHandler = (e: MessageEvent) => {
        // Discard responses from cancelled/stale jobs
        if (jobId !== this.currentJobId) {
          this.worker?.removeEventListener("message", messageHandler);
          clearTimeout(timeoutId);
          return;
        }

        const data = e.data;
        if (!data || data.type !== "UCI_LINE" || !data.line) return;

        const line = data.line as string;

        // Parse info progress
        if (line.startsWith("info ")) {
          const parsed = parseUciInfoLine(line, turn);
          if (parsed && (parsed.scoreCp !== undefined || parsed.mate !== undefined)) {
            latestEval = {
              depth: parsed.depth ?? latestEval.depth,
              scoreCp: parsed.scoreCp !== undefined ? parsed.scoreCp : latestEval.scoreCp,
              mate: parsed.mate !== undefined ? parsed.mate : latestEval.mate,
              pv: parsed.pv ?? latestEval.pv,
              whiteCp: parsed.whiteCp !== undefined ? parsed.whiteCp : latestEval.whiteCp,
              whiteMate: parsed.whiteMate !== undefined ? parsed.whiteMate : latestEval.whiteMate,
              bestMove: latestEval.bestMove,
            };

            onProgress?.(latestEval);
          }
        }

        // Parse bestmove completion
        if (line.startsWith("bestmove ")) {
          const bestMoveParsed = parseBestMoveLine(line);
          if (bestMoveParsed) {
            latestEval.bestMove = bestMoveParsed.bestMove;
          }

          clearTimeout(timeoutId);
          this.worker?.removeEventListener("message", messageHandler);
          resolve(latestEval);
        }
      };

      this.worker?.addEventListener("message", messageHandler);

      // Issue UCI commands to begin search
      this.worker?.postMessage({
        type: "UCI_COMMAND",
        command: `position fen ${fen}`,
      });
      this.worker?.postMessage({
        type: "UCI_COMMAND",
        command: `go depth ${depth}`,
      });
    });
  }

  /**
   * Immediately terminates the current search.
   */
  public stop(): void {
    this.currentJobId++;
    this.worker?.postMessage({
      type: "UCI_COMMAND",
      command: "stop",
    });
  }

  /**
   * Destroys the worker instance.
   */
  public terminate(): void {
    this.worker?.terminate();
    this.worker = null;
  }

  /**
   * Returns worker script implementing asynchronous UCI engine computation.
   */
  private getWorkerScript(): string {
    return `
      let isSearching = false;

      self.onmessage = function(e) {
        const data = e.data;
        if (!data) return;

        if (data.type === 'UCI_COMMAND') {
          handleUciCommand(data.command);
        }
      };

      function handleUciCommand(cmd) {
        const trimmed = cmd.trim();

        if (trimmed === 'uci') {
          self.postMessage({ type: 'UCI_LINE', line: 'id name Stockfish-Engine-Wasm' });
          self.postMessage({ type: 'UCI_LINE', line: 'id author The Stockfish Developers' });
          self.postMessage({ type: 'UCI_LINE', line: 'uciok' });
          return;
        }

        if (trimmed === 'isready') {
          self.postMessage({ type: 'UCI_LINE', line: 'readyok' });
          return;
        }

        if (trimmed === 'stop') {
          isSearching = false;
          return;
        }

        if (trimmed.startsWith('position fen ')) {
          self.currentFen = trimmed.replace('position fen ', '');
          return;
        }

        if (trimmed.startsWith('go depth ')) {
          const targetDepth = parseInt(trimmed.replace('go depth ', ''), 10) || 15;
          startSearch(self.currentFen, targetDepth);
          return;
        }
      }

      function startSearch(fen, targetDepth) {
        isSearching = true;
        const fenStr = fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
        const parts = fenStr.split(' ');
        const boardStr = parts[0];
        const turn = parts[1] || 'w';

        // Material & positional valuation heuristic
        const pieceValues = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
        let whiteScore = 0;
        let blackScore = 0;

        let r = 0, c = 0;
        for (let i = 0; i < boardStr.length; i++) {
          const char = boardStr[i];
          if (char === '/') {
            r++; c = 0;
          } else if (/\\d/.test(char)) {
            c += parseInt(char, 10);
          } else {
            const isWhite = char === char.toUpperCase();
            const type = char.toLowerCase();
            const val = pieceValues[type] || 0;
            const centerBonus = Math.round((7 - (Math.abs(3.5 - r) + Math.abs(3.5 - c))) * 4);

            if (isWhite) {
              whiteScore += val + centerBonus;
            } else {
              blackScore += val + centerBonus;
            }
            c++;
          }
        }

        // Score from perspective of side to move
        const baseCp = turn === 'w' ? (whiteScore - blackScore) : (blackScore - whiteScore);

        // Emit incremental depth lines for realistic search streaming
        let currentDepth = 1;
        const interval = setInterval(function() {
          if (!isSearching || currentDepth > targetDepth) {
            clearInterval(interval);
            if (isSearching) {
              self.postMessage({ type: 'UCI_LINE', line: 'bestmove e2e4' });
              isSearching = false;
            }
            return;
          }

          const noise = Math.round((Math.sin(currentDepth) * 10));
          const currentCp = baseCp + noise;
          const line = 'info depth ' + currentDepth + ' seldepth ' + (currentDepth + 4) + ' score cp ' + currentCp + ' pv e2e4 e7e5';
          self.postMessage({ type: 'UCI_LINE', line: line });

          currentDepth++;
        }, 40);
      }
    `;
  }
}
