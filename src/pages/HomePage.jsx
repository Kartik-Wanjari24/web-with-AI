import React, { useState, useEffect } from 'react';
import {
  Shield, ShieldCheck, ShieldAlert, Zap, Activity, Lock, Server,
  ArrowRight, ChevronRight, Cpu, Globe, BarChart3, EyeOff,
  AlertTriangle, CheckCircle, Flame, Database, Code, Share2,
  TrendingUp, Clock, Users, Bot
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import ExtensionInstallCenter from '../components/ExtensionInstallCenter';

const MINI_CHART_DATA = [
  { v: 12, b: 2 }, { v: 19, b: 5 }, { v: 25, b: 1 }, { v: 32, b: 8 },
  { v: 28, b: 3 }, { v: 38, b: 11 }, { v: 30, b: 4 }, { v: 42, b: 7 },
];

function AnimatedCounter({ end, duration = 2000, suffix = '' }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = end / (duration / 30);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 30);
    return () => clearInterval(timer);
  }, [end, duration]);
  return <>{count.toLocaleString()}{suffix}</>;
}

const FEATURES = [
  {
    icon: Shield,
    title: 'Zero-Trust Rule Engine',
    desc: '5-stage packet inspection pipeline that evaluates every connection regardless of source. No implicit trust.',
    color: 'blue',
  },
  {
    icon: Zap,
    title: 'Sub-Millisecond Decisions',
    desc: 'Short-circuit evaluation architecture delivers average decision latency under 0.4ms per packet inspected.',
    color: 'amber',
  },
  {
    icon: Activity,
    title: 'Real-Time Threat Telemetry',
    desc: 'Live packet stream, Recharts time-series dashboard, and instant JSON/CSV audit log export built-in.',
    color: 'emerald',
  },
  {
    icon: Bot,
    title: 'Adaptive Auto-Quarantine',
    desc: 'Cumulative IP reputation scoring automatically bans persistent attackers — no human intervention needed.',
    color: 'purple',
  },
  {
    icon: Globe,
    title: 'DDoS Volumetric Scrubbing',
    desc: 'Sliding-window rate limiter blocks IP floods and volumetric surges targeting bandwidth and CPU exhaustion.',
    color: 'rose',
  },
  {
    icon: Database,
    title: 'Deep Payload DPI',
    desc: 'Stage 4 regex engine detects SQLi, XSS, OS command injection, directory traversal, and custom threats.',
    color: 'sky',
  },
];

const QUICK_CARDS = [
  {
    id: 'firewall',
    icon: ShieldCheck,
    title: 'Firewall Protection',
    subtitle: 'How AdaptiveShield blocks each attack type',
    badge: '5 vectors covered',
    desc: 'Explore the active defense mechanisms — rate limiting, payload DPI, ACL rules — and their per-attack configuration.',
    color: 'blue',
    cta: 'See Defenses',
  },
  {
    id: 'knowledge',
    icon: ShieldAlert,
    title: 'Attack Encyclopedia',
    subtitle: 'Learn how attackers actually operate',
    badge: '6 attack classes',
    desc: 'Deep educational breakdowns: attacker methodology, step-by-step exploitation workflows, severity ratings, and real CVEs.',
    color: 'amber',
    cta: 'Explore Attacks',
  },
  {
    id: 'simulations',
    icon: Cpu,
    title: 'Live Simulations',
    subtitle: 'Interactive animated attack demos',
    badge: 'Real-time engine',
    desc: 'Watch DDoS floods, SQL injection, XSS exfiltration, and MitM attacks animate in real time. Toggle AdaptiveShield on/off.',
    color: 'emerald',
    cta: 'Watch Live',
  },
  {
    id: 'techstack',
    icon: Code,
    title: 'Tech Stack & Architecture',
    subtitle: 'How this platform was built',
    badge: 'Full breakdown',
    desc: 'React 19, Vite 6, Tailwind CSS v4, Recharts, Canvas API, C++17 WASM — every tool explained with its purpose.',
    color: 'purple',
    cta: 'View Stack',
  },
];

const STATS = [
  { label: 'Packets Inspected / sec', value: 50000, suffix: '+', icon: Activity, color: 'text-blue-400' },
  { label: 'Attack Vectors Covered', value: 8, suffix: '', icon: ShieldAlert, color: 'text-rose-400' },
  { label: 'Pipeline Stages', value: 5, suffix: '', icon: Cpu, color: 'text-emerald-400' },
  { label: 'Avg Decision Latency', value: null, display: '< 0.4ms', icon: Clock, color: 'text-amber-400' },
];

const colorMap = {
  blue:    { bg: 'bg-blue-600/10',   border: 'border-blue-500/30',   text: 'text-blue-400',   icon: 'bg-blue-600/20 text-blue-400',   btn: 'bg-blue-600 hover:bg-blue-500 text-white' },
  amber:   { bg: 'bg-amber-600/10',  border: 'border-amber-500/30',  text: 'text-amber-400',  icon: 'bg-amber-600/20 text-amber-400',  btn: 'bg-amber-600 hover:bg-amber-500 text-white' },
  emerald: { bg: 'bg-emerald-600/10',border: 'border-emerald-500/30',text: 'text-emerald-400',icon: 'bg-emerald-600/20 text-emerald-400', btn: 'bg-emerald-600 hover:bg-emerald-500 text-white' },
  purple:  { bg: 'bg-purple-600/10', border: 'border-purple-500/30', text: 'text-purple-400', icon: 'bg-purple-600/20 text-purple-400', btn: 'bg-purple-600 hover:bg-purple-500 text-white' },
  rose:    { bg: 'bg-rose-600/10',   border: 'border-rose-500/30',   text: 'text-rose-400',   icon: 'bg-rose-600/20 text-rose-400',   btn: 'bg-rose-600 hover:bg-rose-500 text-white' },
  sky:     { bg: 'bg-sky-600/10',    border: 'border-sky-500/30',    text: 'text-sky-400',    icon: 'bg-sky-600/20 text-sky-400',    btn: 'bg-sky-600 hover:bg-sky-500 text-white' },
};

export default function HomePage({ stats, packets, trafficChartData, onNavigate, extConnected, extScannedCount, extEventCount }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const liveBlocked = packets?.filter(p => !p.allowed).length || 0;
  const liveCritical = packets?.filter(p => p.finalRiskScore >= 90).length || 0;

  return (
    <div className="relative">
      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[85vh] flex items-center justify-center px-4 sm:px-6 lg:px-12 py-20 overflow-hidden">
        {/* Background grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(rgba(56,189,248,1) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-600/10 border border-blue-500/30 text-blue-300 text-xs font-mono font-semibold tracking-widest">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping inline-block" />
            AUTONOMOUS INTRUSION PREVENTION SYSTEM · IPS v5.2
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05]">
            <span className="text-white">Intelligent </span>
            <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
              Network Firewall
            </span>
            <br />
            <span className="text-slate-300 text-3xl sm:text-4xl lg:text-5xl font-bold">
              That Thinks Before It Blocks
            </span>
          </h1>

          {/* Tagline */}
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-400 leading-relaxed">
            AdaptiveShield is a 5-stage object-oriented packet inspection engine that evaluates
            every inbound connection in under 0.4ms — autonomously blocking DDoS floods, SQL injection,
            XSS payloads, and command injection before they reach your infrastructure.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('knowledge')}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-600/25 transition-all duration-200 cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4" />
              Explore Attacks
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('simulations')}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 text-white font-bold text-sm transition-all duration-200 cursor-pointer"
            >
              <Activity className="w-4 h-4 text-emerald-400" />
              Watch Live Simulation
            </button>
          </div>

          {/* Live mini-stats strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto pt-4">
            {[
              { label: 'Total Packets', value: stats?.total || 0, color: 'text-blue-400', icon: Activity },
              { label: 'Threats Blocked', value: stats?.blocked || 0, color: 'text-rose-400', icon: ShieldAlert },
              { label: 'Threats Detected', value: stats?.threatsDetected || 0, color: 'text-amber-400', icon: AlertTriangle },
              { label: 'Auto-Bans Issued', value: stats?.autoBans || 0, color: 'text-purple-400', icon: Lock },
            ].map(({ label, value, color, icon: Icon }) => (
              <div
                key={label}
                className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur text-center"
              >
                <Icon className={`w-4 h-4 mx-auto mb-1 ${color}`} />
                <div className={`text-xl font-bold font-mono ${color}`}>{value.toLocaleString()}</div>
                <div className="text-[10px] text-slate-500 font-mono">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS BANNER ──────────────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-12 py-12 border-y border-slate-800/60 bg-slate-950/60 backdrop-blur">
        <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS.map(({ label, value, display, suffix, icon: Icon, color }) => (
            <div key={label} className="text-center space-y-1">
              <Icon className={`w-6 h-6 mx-auto mb-2 ${color}`} />
              <div className={`text-3xl sm:text-4xl font-extrabold font-mono ${color}`}>
                {display ?? <AnimatedCounter end={value} suffix={suffix} />}
              </div>
              <div className="text-xs text-slate-500 font-mono uppercase tracking-wider">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── LIVE MINI CHART ───────────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-12 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 lg:p-8 backdrop-blur">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-600/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  LIVE TRAFFIC TELEMETRY
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">Real-Time Traffic Overview</h2>
                <p className="text-sm text-slate-400">Allowed vs. blocked packet stream — updated every 4 seconds</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded bg-blue-500 inline-block" /> Allowed</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded bg-rose-500 inline-block" /> Blocked</span>
              </div>
            </div>
            <div className="h-40 sm:h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trafficChartData || MINI_CHART_DATA}>
                  <defs>
                    <linearGradient id="gradAllowed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradBlocked" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Tooltip
                    contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, fontSize: 11 }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Area type="monotone" dataKey="allowed" stroke="#3b82f6" strokeWidth={2} fill="url(#gradAllowed)" />
                  <Area type="monotone" dataKey="blocked" stroke="#f43f5e" strokeWidth={2} fill="url(#gradBlocked)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      {/* ── EXTENSION INSTALL CENTER ─────────────────────────────────────────── */}
      <ExtensionInstallCenter
        isConnected={extConnected}
        scannedCount={extScannedCount}
        flaggedCount={extEventCount}
      />

      {/* ── FEATURES GRID ────────────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-12 py-16 bg-slate-950/40">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/10 border border-blue-500/30 text-blue-400 text-xs font-mono font-semibold">
              <Zap className="w-3.5 h-3.5" />
              CORE CAPABILITIES
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Built for{' '}
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Enterprise-Grade Defense
              </span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
              Every feature in AdaptiveShield is purpose-built to counter a specific attack vector,
              with measurable performance guarantees.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc, color }) => {
              const c = colorMap[color];
              return (
                <div
                  key={title}
                  className={`p-6 rounded-3xl border ${c.border} ${c.bg} backdrop-blur group hover:scale-[1.02] transition-all duration-200`}
                >
                  <div className={`w-11 h-11 rounded-2xl ${c.icon} flex items-center justify-center mb-4`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── QUICK-START CARDS ────────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-12 py-20">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Where Would You Like to{' '}
              <span className="bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent">Start?</span>
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
              Each section is independently explorable — dive into the one most relevant to you.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {QUICK_CARDS.map(({ id, icon: Icon, title, subtitle, badge, desc, color, cta }) => {
              const c = colorMap[color];
              return (
                <div
                  key={id}
                  className={`p-6 sm:p-7 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-slate-600 hover:bg-slate-800/80 transition-all duration-200 group cursor-pointer flex flex-col gap-4`}
                  onClick={() => onNavigate(id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className={`w-12 h-12 rounded-2xl ${c.icon} flex items-center justify-center shrink-0`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full border ${c.border} ${c.text} ${c.bg}`}>
                      {badge}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base sm:text-lg font-bold text-white">{title}</h3>
                    <p className="text-xs text-slate-500 font-mono">{subtitle}</p>
                    <p className="text-sm text-slate-400 leading-relaxed pt-1">{desc}</p>
                  </div>
                  <button
                    className={`self-start flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold ${c.btn} transition-all duration-200 mt-auto cursor-pointer`}
                    onClick={e => { e.stopPropagation(); onNavigate(id); }}
                  >
                    {cta}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── PIPELINE PREVIEW ─────────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-12 py-16 bg-slate-950/60 border-t border-slate-800/60">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/10 border border-blue-500/30 text-blue-400 text-xs font-mono font-semibold">
              <Cpu className="w-3.5 h-3.5" />
              PIPELINE ARCHITECTURE
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">5-Stage Packet Inspection Flow</h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto">
              Packets are evaluated left-to-right. Any stage can short-circuit the chain and immediately drop the connection.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch gap-0">
            {[
              { stage: '01', name: 'IP Access List', icon: Globe, color: 'border-blue-500/50 text-blue-400', desc: 'Whitelist / Blacklist match' },
              { stage: '02', name: 'Port & Protocol', icon: Lock, color: 'border-indigo-500/50 text-indigo-400', desc: 'Unauthorized port guard' },
              { stage: '03', name: 'Rate Limiter', icon: TrendingUp, color: 'border-amber-500/50 text-amber-400', desc: '4s sliding window · 8 req/s' },
              { stage: '04', name: 'Payload DPI', icon: EyeOff, color: 'border-rose-500/50 text-rose-400', desc: 'SQLi / XSS / CMDI regex' },
              { stage: '05', name: 'Auto-Quarantine', icon: Bot, color: 'border-purple-500/50 text-purple-400', desc: 'Reputation score ≥ 120 → ban' },
            ].map(({ stage, name, icon: Icon, color, desc }, i, arr) => (
              <React.Fragment key={stage}>
                <div className={`flex-1 p-4 rounded-2xl bg-slate-900/80 border ${color} flex flex-col items-center text-center gap-2`}>
                  <span className="text-[10px] font-mono font-bold text-slate-500">STAGE {stage}</span>
                  <Icon className={`w-6 h-6 ${color.split(' ')[1]}`} />
                  <div className="text-xs font-bold text-white">{name}</div>
                  <div className="text-[10px] text-slate-500">{desc}</div>
                </div>
                {i < arr.length - 1 && (
                  <div className="flex items-center justify-center px-1 sm:px-2 py-2 sm:py-0">
                    <ArrowRight className="w-4 h-4 text-slate-600 rotate-90 sm:rotate-0" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="text-center">
            <button
              onClick={() => onNavigate('simulations')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-600/20 transition-all duration-200 cursor-pointer"
            >
              <Activity className="w-4 h-4" />
              Open Live Firewall Console
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
