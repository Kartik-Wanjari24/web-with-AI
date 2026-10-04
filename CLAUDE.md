# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### React frontend (Vite)
```bash
npm run dev       # Start Vite dev server with hot reload
npm run build     # Production build (bundles JS + copies WASM artefacts)
npm run preview   # Preview the production build locally
```

### C++ pipeline — WebAssembly build (requires Emscripten SDK)
```bash
# One-time Emscripten toolchain setup (run from the emsdk directory)
source ./emsdk_env.sh          # Linux/macOS
emsdk_env.bat                  # Windows cmd

# Configure and compile (outputs src/wasm/pipeline.js + pipeline.wasm)
mkdir -p build && cd build
emcmake cmake ..
emmake make -j$(nproc)
cd ..
```

For an incremental rebuild after editing any `cpp/` file:
```bash
cd build && emmake make -j$(nproc)
```

No test framework is configured. No linter is configured.

## Architecture

AdaptiveShield is a browser-only SPA. The 5-stage packet inspection pipeline is written in **C++17** and compiled to **WebAssembly via Emscripten**. The React frontend loads the WASM binary at startup and calls into it synchronously for every packet decision.

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser                                                        │
│                                                                 │
│  React (App.jsx)  ──syncRules()──►  pipelineBridge.js          │
│       │                                    │                    │
│       │ ◄──PipelineDecision (plain JS)──   │                    │
│       │                                    │ EMBIND calls       │
│  [rules state]                    pipeline.wasm  (C++17)       │
│  [packets state]                  PipelineEngine               │
│  [stats state]                    └── IPFilterStage            │
│                                   └── PortProtocolStage        │
│                                   └── RateLimiterStage         │
│                                   └── PayloadThreatStage       │
│                                   └── AdaptiveAutoBlockStage   │
└─────────────────────────────────────────────────────────────────┘
```

### C++ source layout (`cpp/`)

| File | Purpose |
|---|---|
| `cpp/pipeline.hpp` | All class declarations: `Packet`, `Rule`, `PipelineStageResult`, `PipelineDecision`, the five stage classes, and `FirewallPipeline` |
| `cpp/pipeline.cpp` | Full implementations of all pipeline stages and the orchestrator |
| `cpp/wasm_bindings.cpp` | Emscripten EMBIND entry-point — registers `PipelineEngine`, `PacketInput`, `DecisionOutput`, `RuleInput`, and their vector types as JS-visible names |

### Build system (`CMakeLists.txt`)

`CMakeLists.txt` at the project root compiles `cpp/pipeline.cpp` + `cpp/wasm_bindings.cpp` with Emscripten flags:

- `MODULARIZE=1` + `EXPORT_ES6=1` — emits an ES-module factory `createPipelineModule()` instead of a global. Vite imports it as a static ES module.
- `EXPORT_NAME=createPipelineModule` — the factory name imported by `pipelineBridge.js`.
- `ALLOW_MEMORY_GROWTH=1` — accommodates the reputation score map growing at runtime.
- Output goes to `src/wasm/pipeline.js` + `src/wasm/pipeline.wasm` so Vite picks them up automatically.

### JS bridge (`src/wasm/pipelineBridge.js`)

Sits between the WASM module and React. Exposes four functions:

| Function | React usage |
|---|---|
| `initPipeline()` | Awaited once in a top-level `useEffect` on mount |
| `syncRules(rules)` | Called in a `useEffect` that watches the `rules` state array |
| `processPacket(packet)` | Called per-tick in the streaming interval; returns a plain JS object shaped like the old `PipelineDecision` (including `getThreatLevel()`) so `App.jsx` rendering code is unchanged |
| `resetDynamicState()` | Called when the user clears all rules, resetting rate-limiter windows and reputation scores inside the C++ engine |

### C++ pipeline class map

Mirrors the original JS class hierarchy exactly:

| C++ class | Stage | Role |
|---|---|---|
| `Packet` | — | Data model for one network packet |
| `PipelineStageResult` | — | Result from a single stage (PASS/BLOCK) |
| `PipelineDecision` | — | Accumulated result across all stages; owns `getThreatLevel()` |
| `FirewallPipeline` | orchestrator | Runs packet through all 5 stages; short-circuits on BLOCK |
| `IPFilterStage` | 1 | IP allowlist/blocklist matching |
| `PortProtocolStage` | 2 | Blocked port and protocol rules |
| `RateLimiterStage` | 3 | Sliding-window rate limiting (4 s window, max 8 reqs); owns `std::unordered_map` of IP → timestamp vectors |
| `PayloadThreatStage` | 4 | Compiled `std::regex` built-in signatures (SQLi, XSS, CMDI, path traversal, brute force) + custom REGEX rules from React |
| `AdaptiveAutoBlockStage` | 5 | Cumulative reputation scoring; auto-bans IPs exceeding score 120 |

### React app state (`src/App.jsx`)

The ref-closure pattern from the original JS architecture is preserved but repurposed:

- `rulesRef.current` is still kept in sync with `rules` state via `rulesRef.current = rules` before each render, but instead of the pipeline reading the ref directly, `syncRules(rulesRef.current)` is called inside a `useEffect` watching `rules` to push the updated list into the C++ engine via EMBIND.
- `pipeline` (`useMemo`) is replaced by calling `processPacket()` from `pipelineBridge.js` directly. The WASM engine instance is a module-level singleton inside the bridge, so no React state or ref holds a reference to it.
- `packets` holds the last 100 decision objects (most recent first). Shape is identical to before — the bridge's `processPacket()` reconstructs a JS object with `getThreatLevel()` so all rendering code remains unchanged.
- `stats.autoBans` is updated by polling `getAutoBanCount()` from the bridge after each packet, replacing the old `onAutoBan` callback.

### Tab structure

Five tabs rendered conditionally in `<main>` — unchanged from the original frontend:
- **overview** — Recharts `AreaChart` (allowed vs blocked over time) + `AttackVisualizerLab`
- **attacklab** — `AttackVisualizerLab` standalone
- **live** — Live packet table with filter/export (JSON/CSV via `Blob` + anchor click)
- **rules** — ACL rule management (toggle/delete/create modal); every mutation calls `syncRules()` to re-push to C++
- **docs** — `DeveloperDocs` static panel

### Components

- **`AntigravityCanvas`** (`src/components/AntigravityCanvas.jsx`) — Full-screen `<canvas>` background with mouse/touch particle effects. `requestAnimationFrame` loop, capped at 250 particles, `pointer-events: none`.
- **`AttackVisualizerLab`** (`src/components/AttackVisualizerLab.jsx`) — Self-contained educational simulation panel. Has its own local state and `ATTACK_CATALOG` export (attack scenario definitions). Does not interact with the C++ pipeline.
- **`DeveloperDocs`** (`src/components/DeveloperDocs.jsx`) — Static documentation panel, no state.

### Styling

Tailwind CSS v4 via `@tailwindcss/vite` plugin (configured in `vite.config.js`). No separate `tailwind.config.js` — v4 uses CSS-first config. Base styles in `src/index.css`.
