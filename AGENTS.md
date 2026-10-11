# AGENTS.md — Instructions for AI Coding Agents

## 1. Project Identity & Goal
**ChessLens** is an open-source, browser-based chess game reviewer powered by client-side Stockfish WebAssembly. Its primary goals are:
1. Provide a reliable, production-grade review experience with evaluation graphs, accuracy metrics, and move classifications.
2. Serve as a transparent, high-quality portfolio piece where the developer can explain every architectural decision, algorithm, and trade-off in technical interviews.

---

## 2. Core Operational Rules (Non-Negotiable)

### A. One Phase at a Time
- Never leap ahead to future phases. Work strictly within the current approved phase defined in `docs/ROADMAP.md`.
- Break work into small, testable tasks.
- Never write entire multi-phase applications in a single unreviewed step.

### B. Learning-First Mentality
- The user is a student learning software engineering. Treat them as an apprentice and collaborator.
- Before implementing any significant feature, explain:
  1. What problem it solves.
  2. Why we need it.
  3. How the proposed solution works.
  4. Which files will change.
  5. What the user should learn.
  6. How we will verify that it works.
- Keep explanations clear, professional, and free of unnecessary jargon.

### C. No Unverified Completion Claims
- Never claim a task or phase is complete without running verification checks:
  - TypeScript compilation (`tsc --noEmit`).
  - Linter (`npm run lint` / `eslint`).
  - Unit/integration tests (`npm test` / Vitest).
  - Production build (`npm run build`).
  - Browser behavior verification.
- Report exact pass/fail outputs. Never fabricate test results.

### D. Continuity Across AI Sessions
- AI context resets and account switches will happen. **The repository and documentation files are the single source of truth**, not transient chat history.
- At the start of every session:
  1. Check `git status` and recent commit logs.
  2. Read `docs/CURRENT_STATE.md` and `docs/HANDOFF.md`.
  3. Inspect the code before modifying it.
- At the end of every meaningful session:
  - Update `docs/CURRENT_STATE.md`, `docs/HANDOFF.md`, and `CHANGELOG.md`.

### E. Protect Existing Work
- Do not blindly overwrite, delete, or discard working code.
- Never force-push or reset Git history without explicit user confirmation.
- Inspect the working tree before making edits.

### F. Architecture Stability
- Stack: **Next.js (App Router), React, TypeScript (strict), Tailwind CSS, chess.js, Web Worker + Stockfish.js/Wasm, Recharts/lightweight chart, Vitest, Playwright**.
- Do not swap frameworks or introduce backends/databases without justified technical need and explicit user approval.

---

## 3. Documentation Map
All persistent project knowledge lives in `docs/`:
- `docs/PROJECT_BRIEF.md`: Product vision, target audience, scope boundaries.
- `docs/ARCHITECTURE.md`: Technical stack, data flow, component boundaries, Web Worker bridge.
- `docs/ROADMAP.md`: Master phased breakdown and task checkboxes.
- `docs/DECISIONS.md`: Architectural Decision Records (ADRs).
- `docs/CURRENT_STATE.md`: Verified status of the codebase at this moment.
- `docs/HANDOFF.md`: Instructions for the incoming AI agent.
- `docs/TESTING.md`: Test strategies, commands, and verified test suites.
- `docs/KNOWN_ISSUES.md`: Known bugs, limitations, and security/performance notes.
- `CHANGELOG.md`: Chronological log of deliverables and milestones.
