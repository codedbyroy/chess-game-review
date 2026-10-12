import { describe, it, expect, vi, beforeEach } from "vitest";
import { EngineService } from "../src/lib/engine-service";
import { MoveRecord } from "../src/lib/types";

// Mock Worker implementation for Node test environment
class MockWorker {
  public onmessage: ((e: MessageEvent) => void) | null = null;
  public onerror: ((e: ErrorEvent) => void) | null = null;
  public messagesSent: string[] = [];

  public postMessage(cmd: string) {
    this.messagesSent.push(cmd);

    // Simulate standard UCI responses asynchronously
    if (cmd === "uci") {
      setTimeout(() => {
        this.emit("id name Stockfish-Test");
        this.emit("uciok");
      }, 5);
    } else if (cmd === "isready") {
      setTimeout(() => {
        this.emit("readyok");
      }, 5);
    } else if (cmd.startsWith("go depth ")) {
      const depth = parseInt(cmd.replace("go depth ", ""), 10) || 5;
      setTimeout(() => {
        this.emit(`info depth ${depth} score cp 35 pv e2e4 e7e5`);
        this.emit("bestmove e2e4");
      }, 10);
    } else if (cmd === "stop") {
      setTimeout(() => {
        this.emit("bestmove e2e4");
      }, 5);
    }
  }

  public emit(line: string) {
    if (this.onmessage) {
      this.onmessage({ data: line } as MessageEvent);
    }
  }

  public terminate() {
    this.messagesSent.push("__TERMINATE__");
  }
}

describe("EngineService Unit Tests", () => {
  let mockWorker: MockWorker;
  let engine: EngineService;

  beforeEach(() => {
    mockWorker = new MockWorker();
    engine = new EngineService(mockWorker as unknown as Worker);
  });

  it("completes UCI handshake on initialization", async () => {
    await engine.ensureReady();
    expect(mockWorker.messagesSent).toContain("uci");
    expect(mockWorker.messagesSent).toContain("isready");
  });

  it("evaluates a position and caches the result", async () => {
    const fen = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
    const onProgress = vi.fn();

    const result = await engine.evaluatePosition({
      fen,
      depth: 5,
      onProgress,
    });

    expect(result.depth).toBe(5);
    expect(result.scoreCp).toBe(35);
    expect(result.bestMove).toBe("e2e4");
    expect(onProgress).toHaveBeenCalled();
    expect(engine.getCacheSize()).toBe(1);

    // Calling evaluatePosition again should hit cache without issuing new 'go depth' command
    const messagesCountBefore = mockWorker.messagesSent.length;
    const cachedResult = await engine.evaluatePosition({
      fen,
      depth: 5,
    });

    expect(cachedResult).toEqual(result);
    expect(mockWorker.messagesSent.length).toBe(messagesCountBefore);
  });

  it("clears cache properly with clearCache()", async () => {
    const fen = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
    await engine.evaluatePosition({ fen, depth: 5 });
    expect(engine.getCacheSize()).toBe(1);

    engine.clearCache();
    expect(engine.getCacheSize()).toBe(0);
  });

  it("evaluates an entire game sequentially and emits progress", async () => {
    const moves: MoveRecord[] = [
      {
        ply: 1,
        moveNumber: 1,
        turn: "w",
        san: "e4",
        from: "e2",
        to: "e4",
        piece: "p",
        fenBefore: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        fenAfter: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
      },
      {
        ply: 2,
        moveNumber: 1,
        turn: "b",
        san: "e5",
        from: "e7",
        to: "e5",
        piece: "p",
        fenBefore: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
        fenAfter: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
      },
    ];

    const progressReports: number[] = [];
    const report = await engine.analyzeEntireGame(moves, 5, (p) => {
      progressReports.push(p.percentage);
    });

    expect(report.moves.length).toBe(2);
    expect(progressReports).toEqual([50, 100]);
    expect(typeof report.whiteAccuracy).toBe("number");
    expect(typeof report.blackAccuracy).toBe("number");
  });

  it("cancels analysis cleanly when stop() is called", async () => {
    const moves: MoveRecord[] = [
      {
        ply: 1,
        moveNumber: 1,
        turn: "w",
        san: "e4",
        from: "e2",
        to: "e4",
        piece: "p",
        fenBefore: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        fenAfter: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
      },
    ];

    const promise = engine.analyzeEntireGame(moves, 10);
    engine.stop();

    await expect(promise).rejects.toThrow("Game analysis was cancelled.");
  });

  it("terminates worker upon terminate()", () => {
    engine.terminate();
    expect(mockWorker.messagesSent).toContain("__TERMINATE__");
  });
});
