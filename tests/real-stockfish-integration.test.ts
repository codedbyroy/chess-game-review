import { describe, it, expect } from "vitest";
import { EngineService } from "../src/lib/engine-service";
import { parsePgn, SAMPLE_OPERA_GAME } from "../src/lib/pgn-parser";
import path from "path";

describe("Real Stockfish Integration Test", () => {
  it("executes authentic Stockfish analysis and produces realistic metrics", async () => {
    // Setup worker environment mock for Node
    const g = global as unknown as Record<string, unknown>;
    g.self = global;
    g.location = { href: "http://localhost/" };
    g.importScripts = () => {};

    let messageListeners: Array<(line: string) => void> = [];
    g.postMessage = (line: unknown) => {
      if (typeof line === "string") {
        messageListeners.forEach((fn) => fn(line));
      }
    };

    const sfPath = path.resolve(__dirname, "../public/stockfish.js");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require(sfPath);

    const customWorker = {
      postMessage: (cmd: string) => {
        if (typeof g.onmessage === "function") {
          (g.onmessage as (e: { data: string }) => void)({ data: cmd });
        }
      },
      onmessage: null as ((e: MessageEvent) => void) | null,
      addEventListener: (_evt: string, fn: (line: string) => void) => {
        messageListeners.push(fn);
      },
      removeEventListener: (_evt: string, fn: (line: string) => void) => {
        messageListeners = messageListeners.filter((l) => l !== fn);
      },
      terminate: () => {
        messageListeners = [];
      },
    };

    messageListeners.push((line: string) => {
      if (customWorker.onmessage) {
        customWorker.onmessage({ data: line } as MessageEvent);
      }
    });

    const engine = new EngineService(customWorker as unknown as Worker);
    await engine.ensureReady();

    const parsed = parsePgn(SAMPLE_OPERA_GAME);
    expect(parsed.moves.length).toBeGreaterThan(10);

    // Analyze opening 8 plies of Opera Game at depth 8
    const samplePlies = parsed.moves.slice(0, 8);
    const report = await engine.analyzeEntireGame(samplePlies, 8);

    expect(report.moves.length).toBe(8);

    // Verify accuracies are mathematically grounded percentages
    expect(report.whiteAccuracy).toBeGreaterThan(60);
    expect(report.whiteAccuracy).toBeLessThanOrEqual(100);
    expect(report.blackAccuracy).toBeGreaterThan(50);
    expect(report.blackAccuracy).toBeLessThanOrEqual(100);

    // Verify Brilliant moves are not inflated (White should have 0 brilliant in early opening, not 17!)
    expect(report.classificationCounts.white.brilliant).toBe(0);
    expect(report.classificationCounts.black.brilliant).toBe(0);

    // Verify best moves are populated and not fallback mock e2e4 everywhere
    const uniqueBestMoves = new Set(
      report.moves.map((m) => m.bestMoveUci).filter(Boolean)
    );
    expect(uniqueBestMoves.size).toBeGreaterThan(1);

    engine.terminate();
  }, 15000);
});
