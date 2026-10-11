# Known Issues & Limitations — ChessLens

## 1. Environment & Deployment Issues

### ISSUE-001: GitHub Pages Custom Domain Error
- **Symptom:** In repository settings (`settings/pages`), GitHub displays error banner:
  > *The custom domain `chess` is not properly formatted.*
- **Root Cause:** The string `chess` was typed into the **Custom domain** input box in GitHub Pages settings. GitHub requires a fully qualified domain (e.g., `chess.example.com`).
- **Fix:** In GitHub Pages settings under **Custom domain**, delete the text `chess` and leave the field completely blank (or click "Remove"). GitHub Pages will immediately revert to the default free URL: `https://codedbyroy.github.io/chess-game-review/`.

---

## 2. Technical Limitations & Future Considerations

### LIMIT-001: Client-Side CPU Constraints
- **Context:** Stockfish WebAssembly executes on the user's local machine. Running deep evaluations (e.g., depth 20+) across 80+ moves can cause noticeable battery drain or sluggishness on low-powered mobile devices.
- **Mitigation:** Default analysis depth will be bounded to depth 14–16 with a user-configurable slider (Fast: 12, Standard: 15, Deep: 18).

### LIMIT-002: WebAssembly Asset Serving Headers
- **Context:** Some static hosts do not serve `.wasm` files with the correct `application/wasm` MIME header or multi-threading headers (`Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Embedder-Policy: require-corp`).
- **Mitigation:** In Phase 2 & Phase 6, verify headers and select single-threaded Wasm as the fallback when shared array buffers are not available.
