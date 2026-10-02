import React, { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Cpu,
  Terminal,
  Activity,
  Layers,
  Database,
  Server,
  Code2,
  BookOpen,
  ArrowRight,
  CheckCircle,
  Copy,
  Check,
  Flame,
  Bug,
  Lock,
  Workflow,
  Radio,
  FileText,
  Clock,
  Zap,
  Sliders,
  Sparkles
} from 'lucide-react';

export default function DeveloperDocs() {
  const [activeSection, setActiveSection] = useState('overview');
  const [copiedCodeId, setCopiedCodeId] = useState(null);

  const handleCopyCode = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const navItems = [
    { id: 'overview', label: 'Executive Overview', icon: Shield },
    { id: 'userflow', label: 'User Flow & Lifecycle', icon: Workflow },
    { id: 'pipeline', label: '5-Stage Pipeline Engine', icon: Layers },
    { id: 'architecture', label: 'Architecture & Tech Stack', icon: Code2 },
    { id: 'extensibility', label: 'Rules & OOP Engine', icon: Sliders },
    { id: 'setup', label: 'Developer Guide & Setup', icon: Terminal },
  ];

  return (
    <div className="space-y-8 animate-fadeIn text-gray-900">
      {/* Top Hero Banner (Elevated White Card with dark accents) */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 lg:p-10">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-mono font-semibold tracking-wide shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              SYSTEM ARCHITECTURE &amp; TECHNICAL MANUAL
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
              AdaptiveShield <span className="bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 bg-clip-text text-transparent">Developer Documentation</span>
            </h1>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              Complete technical specification for the AdaptiveShield Object-Oriented Intrusion Prevention System (IPS), 5-Stage Packet Inspection Lifecycle, and Real-time Telemetry Dashboard.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm text-center">
              <span className="block text-[11px] font-mono text-gray-500">ENGINE SPEC</span>
              <span className="text-sm font-bold font-mono text-blue-700">v5.2-RELEASE</span>
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm text-center">
              <span className="block text-[11px] font-mono text-gray-500">AVG LATENCY</span>
              <span className="text-sm font-bold font-mono text-emerald-700">&lt; 0.40ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Sidebar Navigation + Content Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-2">
          <div className="sticky top-20 bg-white border border-slate-200 rounded-3xl p-3.5 shadow-xl space-y-1">
            <div className="px-3 py-2 text-[11px] font-mono font-bold uppercase tracking-wider text-gray-400">
              Documentation Index
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/20'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ArrowRight className="w-3.5 h-3.5 text-white" />}
                </button>
              );
            })}

            <div className="pt-4 mt-4 border-t border-gray-100 px-3 pb-2">
              <div className="text-[11px] font-mono text-gray-400 mb-2">QUICK ACTIONS</div>
              <button
                onClick={() => alert("AdaptiveShield Object-Oriented System Blueprint is active in runtime.")}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-gray-700 text-xs font-mono transition-all duration-200"
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                Inspect Spec Schema
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9 space-y-8">
          {/* SECTION 1: OVERVIEW */}
          {activeSection === 'overview' && (
            <div className="p-6 lg:p-8 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Executive Product Overview</h2>
                  <p className="text-xs text-gray-500">Market-ready Adaptive Network Firewall &amp; Intrusion Prevention System</p>
                </div>
              </div>

              <p className="text-sm text-gray-700 leading-relaxed">
                <strong>AdaptiveShield</strong> is an enterprise software-defined network security appliance and Intrusion Prevention System (IPS). Built with an asynchronous, object-oriented pipeline, AdaptiveShield dynamically evaluates inbound network packets across 5 sequential verification stages—filtering unauthorized access, neutralizing volumetric DDoS floods, identifying zero-day exploit payloads, and quarantining hostile nodes autonomously.
              </p>

              {/* Key Pillars Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2 text-blue-700 text-sm font-semibold">
                    <Zap className="w-4 h-4 text-blue-600" /> Sub-Millisecond Execution
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Short-circuit pipeline architecture guarantees maximum throughput with average decision latency below 0.4ms per packet.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-700 text-sm font-semibold">
                    <Flame className="w-4 h-4 text-indigo-600" /> Autonomous Auto-Quarantine
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Stateful IP threat reputation scoring tracks repeated violations and writes dynamic ban rules without human intervention.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2 text-sky-700 text-sm font-semibold">
                    <Activity className="w-4 h-4 text-sky-600" /> Real-Time Telemetry
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Integrated Recharts time-series stream, live packet inspection terminal, and instant JSON/CSV security log export.
                  </p>
                </div>
              </div>

              {/* Threat Matrix Badges */}
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-400 mb-3">
                  Threat Vector Mitigation Matrix
                </h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Volumetric DDoS Flooding', level: 'CRITICAL', color: 'bg-rose-50 border-rose-200 text-rose-700' },
                    { label: 'SQL Injection (SQLi)', level: 'CRITICAL', color: 'bg-rose-50 border-rose-200 text-rose-700' },
                    { label: 'Cross-Site Scripting (XSS)', level: 'HIGH', color: 'bg-amber-50 border-amber-200 text-amber-700' },
                    { label: 'OS Command Injection (RCE)', level: 'CRITICAL', color: 'bg-rose-50 border-rose-200 text-rose-700' },
                    { label: 'Reconnaissance Port Scanning', level: 'MEDIUM', color: 'bg-sky-50 border-sky-200 text-sky-700' },
                    { label: 'SSH & RDP Credential Brute-Force', level: 'HIGH', color: 'bg-amber-50 border-amber-200 text-amber-700' },
                    { label: 'Insecure Cleartext Protocols (Telnet)', level: 'MEDIUM', color: 'bg-sky-50 border-sky-200 text-sky-700' },
                    { label: 'Directory Traversal (LFI/RFI)', level: 'HIGH', color: 'bg-amber-50 border-amber-200 text-amber-700' },
                  ].map((badge, idx) => (
                    <span
                      key={idx}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-mono font-medium ${badge.color}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                      <strong>{badge.label}</strong>
                      <span className="text-[10px] opacity-75">[{badge.level}]</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: USER FLOW */}
          {activeSection === 'userflow' && (
            <div className="p-6 lg:p-8 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600">
                  <Workflow className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Interactive User Flow &amp; Dashboard Lifecycle</h2>
                  <p className="text-xs text-gray-500">Step-by-step telemetry pipeline and operator interaction model</p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  {
                    step: '01',
                    title: 'Live Ingress Traffic Capture',
                    desc: 'Inbound network packets (HTTP, HTTPS, SSH, DNS, Telnet) arrive with source IP metadata, destination port, protocol, size, and payload buffer.',
                    tag: 'INGRESS'
                  },
                  {
                    step: '02',
                    title: '5-Stage Short-Circuit Evaluation',
                    desc: 'The packet traverses through IP Whitelist/Blacklist -> Port/Protocol Validation -> Sliding Rate Limiter -> Deep Payload Analyzer -> Dynamic Auto-Banning.',
                    tag: 'PIPELINE'
                  },
                  {
                    step: '03',
                    title: 'Decision & Telemetry Aggregation',
                    desc: 'A PipelineDecision object is created with risk scores, verdict reasons, and stage results. Real-time stats and Recharts time-series stream update smoothly.',
                    tag: 'TELEMETRY'
                  },
                  {
                    step: '04',
                    title: 'Interactive Attack & Defense Lab',
                    desc: 'Operators can test 6 distinct threat vectors (DDoS, Phishing, SQLi, MitM, Ransomware, XSS) with animated visual mechanics.',
                    tag: 'THREAT LAB'
                  },
                  {
                    step: '05',
                    title: 'Mitigation & Policy Enforcement',
                    desc: 'Dynamically add custom ACL definitions, toggle active rule states, and export tamper-evident audit logs in CSV/JSON.',
                    tag: 'MITIGATION'
                  }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-4 hover:border-blue-300 hover:bg-blue-50/40 transition-all duration-200 group"
                  >
                    <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-blue-100 border border-blue-200 text-blue-700 font-mono font-bold text-xs shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      {item.step}
                    </span>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-900">{item.title}</h3>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white border border-gray-200 text-blue-700 font-medium">
                          {item.tag}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 3: 5-STAGE PIPELINE */}
          {activeSection === 'pipeline' && (
            <div className="p-6 lg:p-8 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">5-Stage Security Pipeline Deep-Dive</h2>
                  <p className="text-xs text-gray-500">Detailed algorithmic behavior of each sequential security filter</p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  {
                    stage: 'Stage 1: IP Access List (ACL)',
                    badge: 'O(1) HASH MATCH',
                    desc: 'Checks source IP against active ACL table. Whitelist rules bypass downstream checks immediately. Blacklist rules drop the connection instantly with risk score 100.'
                  },
                  {
                    stage: 'Stage 2: Port & Protocol Guard',
                    badge: 'PROTOCOL INTEGRITY',
                    desc: 'Restricts ingress to authorized services. Blocks obsolete and vulnerable ports (e.g., Telnet 23, RDP 3389) by default.'
                  },
                  {
                    stage: 'Stage 3: Sliding-Window Rate Limiter',
                    badge: 'SLIDING QUEUE',
                    desc: 'Maintains per-IP sliding timestamp arrays over a 4-second rolling window. Blocks bursts exceeding 8 req/sec to prevent volumetric floods and resource starvation.'
                  },
                  {
                    stage: 'Stage 4: Deep Payload Threat Analyzer',
                    badge: 'DPI REGEX MATCHER',
                    desc: 'Inspects HTTP paths and payloads for malicious patterns, including SQL Injection, Cross-Site Scripting (XSS), Command Injection, and Path Traversal.'
                  },
                  {
                    stage: 'Stage 5: Dynamic Adaptive Auto-Blocking',
                    badge: 'REPUTATION INDEX',
                    desc: 'Accumulates threat penalty scores per remote IP. When risk breaches 120 points, the IP is automatically quarantined and all future packets are rejected.'
                  }
                ].map((stg, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                        {stg.stage}
                      </h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-blue-800 border border-blue-200 font-semibold">
                        {stg.badge}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{stg.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 4: ARCHITECTURE */}
          {activeSection === 'architecture' && (
            <div className="p-6 lg:p-8 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600">
                  <Code2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Code Architecture &amp; Tech Stack</h2>
                  <p className="text-xs text-gray-500">Component layout and reactive state management</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                  <span className="block text-[10px] font-mono text-gray-500">UI RUNTIME</span>
                  <span className="text-sm font-bold text-blue-700">React 19</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                  <span className="block text-[10px] font-mono text-gray-500">BUNDLER</span>
                  <span className="text-sm font-bold text-indigo-700">Vite 6</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                  <span className="block text-[10px] font-mono text-gray-500">STYLING</span>
                  <span className="text-sm font-bold text-sky-700">Tailwind CSS</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                  <span className="block text-[10px] font-mono text-gray-500">CHARTS</span>
                  <span className="text-sm font-bold text-blue-800">Recharts 3</span>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-400">
                  Directory Layout
                </h3>
                <pre className="p-4 rounded-2xl bg-slate-900 text-slate-200 text-xs font-mono overflow-x-auto leading-relaxed">
{`AdaptiveShield/
├── package.json               # Dependencies & scripts
├── vite.config.js             # Vite + Tailwind plugins
├── index.html                 # Dark theme shell with Antigravity canvas
└── src/
    ├── main.jsx               # React DOM root
    ├── index.css              # Antigravity Canvas, packet animations, scrollbars
    ├── App.jsx                # Main Application: Smooth Scrolling Layout & Pipeline
    └── components/
        ├── AntigravityCanvas.jsx   # Interactive HTML5 Particle Background
        ├── AttackVisualizerLab.jsx # 6 Interactive Cyber Attack Simulators
        └── DeveloperDocs.jsx       # Architecture & Extensibility Manual`}
                </pre>
              </div>
            </div>
          )}

          {/* SECTION 5: EXTENSIBILITY */}
          {activeSection === 'extensibility' && (
            <div className="p-6 lg:p-8 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600">
                  <Sliders className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Extensibility &amp; OOP Pipeline Design</h2>
                  <p className="text-xs text-gray-500">Writing custom security stages and runtime rules</p>
                </div>
              </div>

              <p className="text-sm text-gray-600 leading-relaxed">
                AdaptiveShield implements the <strong>Chain of Responsibility</strong> and <strong>Strategy</strong> OOP patterns. You can effortlessly plug in new stages.
              </p>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-gray-500">
                  <span>Example Custom Stage (Geo-Fence Filter)</span>
                  <button
                    onClick={() => handleCopyCode('customStage', `export class CustomGeoFenceStage {
  constructor(blockedCountries = ['XX', 'ZZ']) {
    this.name = 'Custom Stage: GeoFence Filter';
    this.blockedCountries = new Set(blockedCountries);
  }

  evaluate(packet, decision) {
    if (this.blockedCountries.has(packet.geo)) {
      decision.addResult(new PipelineStageResult(
        this.name,
        'BLOCK',
        \`Inbound connection from restricted jurisdiction: \${packet.geo}\`,
        90
      ));
      return true; // Short-circuit drop
    }
    decision.addResult(new PipelineStageResult(this.name, 'PASS', 'Geo location authorized', 0));
    return false;
  }
}`)}
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    {copiedCodeId === 'customStage' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedCodeId === 'customStage' ? 'Copied' : 'Copy Code'}
                  </button>
                </div>

                <pre className="p-4 rounded-2xl bg-slate-900 text-slate-200 text-xs font-mono overflow-x-auto leading-relaxed">
{`export class CustomGeoFenceStage {
  constructor(blockedCountries = ['XX', 'ZZ']) {
    this.name = 'Custom Stage: GeoFence Filter';
    this.blockedCountries = new Set(blockedCountries);
  }

  evaluate(packet, decision) {
    if (this.blockedCountries.has(packet.geo)) {
      decision.addResult(new PipelineStageResult(
        this.name,
        'BLOCK',
        \`Inbound connection from restricted jurisdiction: \${packet.geo}\`,
        90
      ));
      return true; // Short-circuit drop
    }
    decision.addResult(new PipelineStageResult(this.name, 'PASS', 'Geo location authorized', 0));
    return false;
  }
}`}
                </pre>
              </div>
            </div>
          )}

          {/* SECTION 6: LOCAL SETUP */}
          {activeSection === 'setup' && (
            <div className="p-6 lg:p-8 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600">
                  <Terminal className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Local Setup &amp; Quickstart Guide</h2>
                  <p className="text-xs text-gray-500">Terminal commands to run, test, and build AdaptiveShield</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-400 mb-2">
                    1. Navigate into Directory &amp; Install Dependencies
                  </h3>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800 flex items-center justify-between">
                    <code>cd AdaptiveShield &amp;&amp; npm install</code>
                    <button
                      onClick={() => handleCopyCode('installCmd', 'cd AdaptiveShield && npm install')}
                      className="text-gray-500 hover:text-blue-700"
                    >
                      {copiedCodeId === 'installCmd' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-400 mb-2">
                    2. Start Vite Development Server
                  </h3>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800 flex items-center justify-between">
                    <code>npm run dev</code>
                    <button
                      onClick={() => handleCopyCode('devCmd', 'npm run dev')}
                      className="text-gray-500 hover:text-blue-700"
                    >
                      {copiedCodeId === 'devCmd' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-400 mb-2">
                    3. Compile Production Bundle
                  </h3>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800 flex items-center justify-between">
                    <code>npm run build</code>
                    <button
                      onClick={() => handleCopyCode('buildCmd', 'npm run build')}
                      className="text-gray-500 hover:text-blue-700"
                    >
                      {copiedCodeId === 'buildCmd' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-gray-700 leading-relaxed">
                  <strong>Zero-Config Deployment:</strong> AdaptiveShield is completely self-contained with full browser reactivity, making it instantaneous to demo in client presentations, security labs, and interactive CTF training sessions.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
