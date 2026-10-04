import React, { useState } from 'react';
import {
  Code2, Cpu, Zap, Globe, Database, Layers, Server, Activity,
  Shield, ShieldCheck, Terminal, FileCode, Package, Palette,
  BarChart3, Layout, Box, ArrowRight, CheckCircle, Sparkles,
  Flame, Braces, Monitor, Workflow, ChevronDown, ChevronRight
} from 'lucide-react';

const TECH_STACK = [
  {
    category: 'UI Framework',
    tech: 'React 19',
    icon: Code2,
    color: 'blue',
    version: '19.1.0',
    what: 'A declarative JavaScript library for building component-based user interfaces. React manages the virtual DOM and re-renders components efficiently when state changes.',
    why: 'Chosen for its hooks-based state model (useState, useEffect, useMemo, useRef), which maps perfectly to the pipeline\'s reactive packet stream, live stats, and rule management panels.',
    where: 'Powers the entire AdaptiveShield frontend — all 5 pages, the live packet table, real-time stat counters, the rule manager, attack simulations, and the chart dashboard.',
    badge: 'Core Runtime',
  },
  {
    category: 'Build Tooling',
    tech: 'Vite 6',
    icon: Zap,
    color: 'amber',
    version: '6.3.0',
    what: 'A next-generation front-end build tool using native ES modules in development for sub-100ms HMR (Hot Module Replacement) and Rollup for optimized production bundles.',
    why: 'Dramatically faster dev server startup than Webpack. The `@tailwindcss/vite` plugin integrates Tailwind v4 without any config files. Also handles WASM file copying for the C++ pipeline binary.',
    where: 'Handles `npm run dev`, `npm run build`, and `npm run preview`. Vite\'s static file serving picks up `src/wasm/pipeline.wasm` automatically from the `src/wasm/` directory.',
    badge: 'Build Tool',
  },
  {
    category: 'Styling Engine',
    tech: 'Tailwind CSS v4',
    icon: Palette,
    color: 'sky',
    version: '4.1.0',
    what: 'A utility-first CSS framework. Tailwind v4 uses a new CSS-first configuration model — no `tailwind.config.js` file needed. Styles are co-located directly in JSX className strings.',
    why: 'Allows rapid, consistent design iteration without switching files. The dark cybersecurity aesthetic (slate-900, slate-950 backgrounds, blue/rose accent palette) is trivially composable from utilities.',
    where: 'Used across every component and page. The particle background, glassmorphic nav, card gradients, badge colors, and responsive grid layouts are all Tailwind utility classes.',
    badge: 'Styling',
  },
  {
    category: 'Data Visualization',
    tech: 'Recharts 3',
    icon: BarChart3,
    color: 'indigo',
    version: '3.7.0',
    what: 'A composable, React-native charting library built on D3. Uses SVG rendering with declarative JSX components: `<AreaChart>`, `<BarChart>`, `<Area>`, `<Bar>`, etc.',
    why: 'Recharts integrates seamlessly with React state — passing `data={trafficChartData}` re-renders the chart reactively whenever the packet processing loop updates state every 4 seconds.',
    where: 'On the Home page (mini area chart preview) and the Simulations page (allowed-vs-blocked area chart + threat score bar chart). Both update live from the packet processing loop.',
    badge: 'Charts',
  },
  {
    category: 'Icon Library',
    tech: 'Lucide React',
    icon: Sparkles,
    color: 'purple',
    version: '1.16.0',
    what: 'A tree-shakeable SVG icon library with 1,400+ pixel-perfect icons exported as React components. Each icon is individually importable to minimize bundle size.',
    why: 'Consistent, clean iconography without needing a custom icon font. Every icon in AdaptiveShield — shield, flame, database, terminal — is from Lucide, keeping the visual language unified.',
    where: 'Used in every page header, nav link, attack card, stat tile, rule row, and feature section. Also used inside animation control buttons in AttackVisualizerLab.',
    badge: 'Icons',
  },
  {
    category: 'Rendering',
    tech: 'Canvas API',
    icon: Monitor,
    color: 'rose',
    version: 'Browser Native',
    what: 'The HTML5 `<canvas>` 2D rendering context, available natively in all modern browsers. Provides low-level pixel-by-pixel drawing, particle physics, and 60fps animation loops via `requestAnimationFrame`.',
    why: 'No dependency overhead — the interactive particle background runs purely on browser-native APIs. Canvas is the only technology capable of rendering 250 simultaneous physics particles at 60fps without DOM re-render cost.',
    where: 'Exclusively in `src/components/AntigravityCanvas.jsx`. The entire full-screen particle background — spawning, physics simulation, inter-particle connection lines, and fade effects — runs on a fixed canvas.',
    badge: 'Visual FX',
  },
  {
    category: 'Security Engine',
    tech: 'C++17 + WebAssembly',
    icon: Cpu,
    color: 'emerald',
    version: 'Emscripten 3.x',
    what: 'The 5-stage firewall pipeline is implemented in C++17 and compiled to WebAssembly (.wasm) binary via Emscripten. JS interfaces with C++ classes via Emscripten EMBIND.',
    why: 'C++ delivers near-native execution speed for packet evaluation — critical when processing thousands of packets/second. WASM runs in a sandboxed browser thread with no server needed.',
    where: 'The compiled binary lands in `src/wasm/pipeline.wasm`. `src/wasm/pipelineBridge.js` wraps the WASM module, exposing `initPipeline()`, `processPacket()`, `syncRules()`, and `resetDynamicState()` to React.',
    badge: 'WASM Engine',
  },
  {
    category: 'Package Management',
    tech: 'npm / Node.js',
    icon: Package,
    color: 'emerald',
    version: 'Node 20+',
    what: 'Node.js provides the JavaScript runtime for tooling. npm manages all package dependencies defined in `package.json` — React, Vite, Tailwind, Recharts, and Lucide.',
    why: 'The standard ecosystem for modern JavaScript tooling. Node 20 supports ES modules natively, matching the project\'s `"type": "module"` package.json setting.',
    where: 'Used solely for development tool execution: `npm install` (dependency resolution), `npm run dev` (Vite dev server), `npm run build` (production bundle). Runtime has zero Node dependency — it\'s pure browser.',
    badge: 'Tooling',
  },
];

const colorMap = {
  blue:    { border: 'border-blue-500/30',   bg: 'bg-blue-500/8',    icon: 'bg-blue-600/15 text-blue-400',    badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30',    dot: 'bg-blue-400' },
  amber:   { border: 'border-amber-500/30',  bg: 'bg-amber-500/8',   icon: 'bg-amber-600/15 text-amber-400',   badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',   dot: 'bg-amber-400' },
  sky:     { border: 'border-sky-500/30',    bg: 'bg-sky-500/8',     icon: 'bg-sky-600/15 text-sky-400',     badge: 'bg-sky-500/15 text-sky-300 border-sky-500/30',     dot: 'bg-sky-400' },
  indigo:  { border: 'border-indigo-500/30', bg: 'bg-indigo-500/8',  icon: 'bg-indigo-600/15 text-indigo-400', badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30', dot: 'bg-indigo-400' },
  purple:  { border: 'border-purple-500/30', bg: 'bg-purple-500/8',  icon: 'bg-purple-600/15 text-purple-400', badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30', dot: 'bg-purple-400' },
  rose:    { border: 'border-rose-500/30',   bg: 'bg-rose-500/8',    icon: 'bg-rose-600/15 text-rose-400',    badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',    dot: 'bg-rose-400' },
  emerald: { border: 'border-emerald-500/30',bg: 'bg-emerald-500/8', icon: 'bg-emerald-600/15 text-emerald-400', badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', dot: 'bg-emerald-400' },
};

function TechCard({ tech }) {
  const [open, setOpen] = useState(false);
  const c = colorMap[tech.color];
  const Icon = tech.icon;

  return (
    <div className={`rounded-3xl border ${c.border} ${c.bg} overflow-hidden transition-all duration-200`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full text-left p-5 sm:p-6 flex items-start gap-4 group cursor-pointer"
      >
        <div className={`w-12 h-12 rounded-2xl ${c.icon} flex items-center justify-center shrink-0`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-white">{tech.tech}</h3>
            <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${c.badge}`}>
              {tech.badge}
            </span>
            <span className="text-[10px] font-mono text-slate-600">v{tech.version}</span>
          </div>
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">{tech.category}</p>
          <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all">
            {tech.what}
          </p>
        </div>
        <div className="shrink-0 mt-1 text-slate-600 group-hover:text-slate-400 transition-colors">
          {open ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </div>
      </button>

      {open && (
        <div className="px-5 sm:px-6 pb-6 space-y-4 border-t border-slate-800/50">
          {[
            { label: 'What it is', icon: Box, text: tech.what },
            { label: 'Why we chose it', icon: CheckCircle, text: tech.why },
            { label: 'Where it\'s used in AdaptiveShield', icon: ArrowRight, text: tech.where },
          ].map(({ label, icon: SIcon, text }) => (
            <div key={label} className="mt-4 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                <SIcon className={`w-3.5 h-3.5 ${c.icon.split(' ')[1]}`} />
                {label}
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const ARCH_DIAGRAM = `AdaptiveShield/
├── index.html                    ← Dark theme HTML shell
├── package.json                  ← npm dependencies
├── vite.config.js                ← Vite + Tailwind v4 plugin
├── CMakeLists.txt                ← Emscripten build config (WASM)
│
├── cpp/                          ← C++17 WASM Engine
│   ├── pipeline.hpp              ← All class declarations
│   ├── pipeline.cpp              ← 5-stage implementation
│   └── wasm_bindings.cpp         ← Emscripten EMBIND exports
│
└── src/
    ├── main.jsx                  ← React DOM mount
    ├── index.css                 ← Tailwind + keyframe animations
    ├── App.jsx                   ← Root: pipeline state owner + router
    │
    ├── pages/                    ← Full-page route components
    │   ├── HomePage.jsx          ← Hero, stats, chart preview, quick cards
    │   ├── KnowledgeBasePage.jsx ← Attack encyclopedia + accordion cards
    │   ├── SimulationsPage.jsx   ← Firewall console, live table, rules, attack lab
    │   └── TechStackPage.jsx     ← Tech stack cards + architecture diagram
    │
    ├── components/               ← Shared UI components
    │   ├── Navbar.jsx            ← Sticky header with 5-page nav
    │   ├── AntigravityCanvas.jsx ← Canvas 2D particle background
    │   ├── AttackVisualizerLab.jsx ← 6 interactive attack animations
    │   └── DeveloperDocs.jsx     ← Technical documentation panel
    │
    └── wasm/                     ← Compiled WASM output
        ├── pipeline.js           ← Emscripten ES module factory
        ├── pipeline.wasm         ← Compiled C++ binary
        └── pipelineBridge.js     ← JS ↔ WASM interface layer`;

export default function TechStackPage() {
  const [filter, setFilter] = useState('All');
  const categories = ['All', ...Array.from(new Set(TECH_STACK.map(t => t.category)))];

  const filtered = filter === 'All' ? TECH_STACK : TECH_STACK.filter(t => t.category === filter);

  return (
    <div className="px-4 sm:px-6 lg:px-12 py-12 max-w-[1400px] mx-auto space-y-14">

      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-600/10 border border-purple-500/30 text-purple-400 text-xs font-mono font-semibold tracking-widest">
          <Braces className="w-3.5 h-3.5" />
          ABOUT THIS PROJECT · TECH STACK
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
          How AdaptiveShield{' '}
          <span className="bg-gradient-to-r from-purple-400 via-blue-300 to-sky-400 bg-clip-text text-transparent">
            Was Built
          </span>
        </h1>
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
          Every technology used in AdaptiveShield — from the React UI to the C++17 WebAssembly security engine —
          is documented here in full: what it is, why it was chosen, and exactly which part of the platform it powers.
        </p>
      </div>

      {/* Quick overview badges */}
      <div className="flex flex-wrap gap-3 justify-center">
        {TECH_STACK.map(t => {
          const c = colorMap[t.color];
          const Icon = t.icon;
          return (
            <div key={t.tech} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${c.border} ${c.bg}`}>
              <Icon className={`w-4 h-4 ${c.icon.split(' ')[1]}`} />
              <span className="text-xs font-semibold text-slate-300">{t.tech}</span>
            </div>
          );
        })}
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 justify-center">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
              filter === cat
                ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/20'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Tech Cards */}
      <div className="space-y-4">
        {filtered.map(tech => (
          <TechCard key={tech.tech} tech={tech} />
        ))}
      </div>

      {/* Architecture Diagram */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600/15 text-blue-400 flex items-center justify-center">
            <Workflow className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Full Project Architecture</h2>
            <p className="text-xs text-slate-500">Complete directory tree with file purpose annotations</p>
          </div>
        </div>
        <pre className="p-5 rounded-3xl bg-slate-950 border border-slate-800 text-slate-300 text-xs font-mono overflow-x-auto leading-relaxed">
          {ARCH_DIAGRAM}
        </pre>
      </div>

      {/* How to run */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 sm:p-8 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600/15 text-emerald-400 flex items-center justify-center">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Running AdaptiveShield Locally</h2>
            <p className="text-xs text-slate-500">Install dependencies and start the Vite development server</p>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { step: '1', label: 'Clone or download the repository', cmd: 'git clone https://github.com/your-org/AdaptiveShield' },
            { step: '2', label: 'Install npm dependencies', cmd: 'npm install' },
            { step: '3', label: 'Start the development server (hot reload)', cmd: 'npm run dev' },
            { step: '4', label: 'Build production bundle', cmd: 'npm run build' },
            { step: '5', label: '(Optional) Preview production build', cmd: 'npm run preview' },
          ].map(({ step, label, cmd }) => (
            <div key={step} className="flex items-center gap-4 p-3.5 rounded-2xl bg-slate-950 border border-slate-800 font-mono">
              <span className="w-6 h-6 rounded-lg bg-blue-600/20 text-blue-400 text-[10px] font-bold flex items-center justify-center shrink-0">{step}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-slate-500 mb-0.5">{label}</div>
                <code className="text-sm text-emerald-300">{cmd}</code>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-500/20 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="text-sm text-slate-300 leading-relaxed">
            <strong className="text-blue-300">Zero-Config Browser App:</strong> AdaptiveShield is fully self-contained — no server, no database, no cloud account. The JS pipeline runs instantly in any browser. The C++ WASM build is optional and requires Emscripten SDK.
          </div>
        </div>
      </div>

      {/* C++ WASM section */}
      <div className="rounded-3xl bg-emerald-950/20 border border-emerald-500/20 p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600/15 text-emerald-400 flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">C++ WebAssembly Build (Optional)</h2>
            <p className="text-xs text-slate-400">Compile the native security engine for maximum throughput</p>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { step: '1', label: 'Install and activate Emscripten SDK', cmd: 'source ./emsdk_env.sh   # Linux/macOS' },
            { step: '2', label: 'Create build directory and configure', cmd: 'mkdir -p build && cd build && emcmake cmake ..' },
            { step: '3', label: 'Compile to WASM (parallel)', cmd: 'emmake make -j$(nproc)' },
            { step: '4', label: 'Artifacts land in src/wasm/', cmd: '# pipeline.js + pipeline.wasm → picked up by Vite automatically' },
          ].map(({ step, label, cmd }) => (
            <div key={step} className="flex items-start gap-4 p-3.5 rounded-2xl bg-slate-950 border border-slate-800 font-mono">
              <span className="w-6 h-6 rounded-lg bg-emerald-600/20 text-emerald-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{step}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-slate-500 mb-0.5">{label}</div>
                <code className="text-xs sm:text-sm text-emerald-300 break-all">{cmd}</code>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
