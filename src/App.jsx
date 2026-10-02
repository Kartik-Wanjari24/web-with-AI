import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Activity,
  Zap,
  Server,
  Terminal,
  AlertTriangle,
  Play,
  Pause,
  Download,
  Plus,
  Trash2,
  Filter,
  Search,
  RefreshCw,
  Sliders,
  Radio,
  Wifi,
  Lock,
  Eye,
  CheckCircle2,
  XCircle,
  Database,
  Cpu,
  Flame,
  Bug,
  Crosshair,
  FileCode,
  Info,
  BookOpen,
  Layers,
  Sparkles,
  BarChart3,
  User,
  Bot,
  ArrowRight,
  ShieldX,
  Cloud,
  Check,
  ChevronDown
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import AntigravityCanvas from './components/AntigravityCanvas';
import AttackVisualizerLab from './components/AttackVisualizerLab';
import DeveloperDocs from './components/DeveloperDocs';

/* ==========================================================================
   5-STAGE OOP RULE PIPELINE ENGINE IMPLEMENTATION
   ========================================================================== */

export class Packet {
  constructor({ id, timestamp, srcIp, dstPort, protocol, payload, length, method = 'GET', path = '/', geo = 'US' }) {
    this.id = id || Math.random().toString(36).substring(2, 9).toUpperCase();
    this.timestamp = timestamp || new Date().toISOString();
    this.srcIp = srcIp;
    this.dstPort = dstPort;
    this.protocol = protocol;
    this.payload = payload || '';
    this.length = length || Math.floor(Math.random() * 1200) + 64;
    this.method = method;
    this.path = path;
    this.geo = geo;
  }
}

export class PipelineStageResult {
  constructor(stageName, status, reason = '', riskScore = 0, matchedRule = null) {
    this.stageName = stageName;
    this.status = status; // 'PASS' | 'BLOCK' | 'FLAG'
    this.reason = reason;
    this.riskScore = riskScore;
    this.matchedRule = matchedRule;
  }
}

export class PipelineDecision {
  constructor(packet) {
    this.packet = packet;
    this.allowed = true;
    this.action = 'ALLOW'; // 'ALLOW' | 'BLOCK' | 'RATE_LIMITED' | 'AUTO_BANNED'
    this.finalRiskScore = 0;
    this.stageResults = [];
    this.verdictStage = null;
    this.verdictReason = 'Traffic cleared all inspection stages';
    this.timestamp = new Date();
  }

  addResult(result) {
    this.stageResults.push(result);
    this.finalRiskScore = Math.max(this.finalRiskScore, result.riskScore);

    if (result.status === 'BLOCK' && this.allowed) {
      this.allowed = false;
      this.action = 'BLOCK';
      this.verdictStage = result.stageName;
      this.verdictReason = result.reason;
    }
  }

  getThreatLevel() {
    if (this.finalRiskScore >= 90) return { label: 'CRITICAL', color: 'text-rose-700 bg-rose-50 border-rose-300' };
    if (this.finalRiskScore >= 70) return { label: 'HIGH', color: 'text-amber-700 bg-amber-50 border-amber-300' };
    if (this.finalRiskScore >= 35) return { label: 'MEDIUM', color: 'text-blue-700 bg-blue-50 border-blue-300' };
    return { label: 'LOW', color: 'text-emerald-700 bg-emerald-50 border-emerald-300' };
  }
}

// Stage 1: IP Access List
export class IPFilterStage {
  constructor(getRules) {
    this.name = 'Stage 1: IP Access List';
    this.getRules = getRules;
  }

  evaluate(packet, decision) {
    const rules = this.getRules().filter(r => r.enabled && r.type === 'IP');

    const whitelistMatch = rules.find(r => r.action === 'ALLOW' && (r.value === packet.srcIp || r.value === '*'));
    if (whitelistMatch) {
      decision.addResult(new PipelineStageResult(this.name, 'PASS', `Explicitly Whitelisted via Rule [${whitelistMatch.id}]`, 0, whitelistMatch));
      return false;
    }

    const blacklistMatch = rules.find(r => r.action === 'BLOCK' && r.value === packet.srcIp);
    if (blacklistMatch) {
      decision.addResult(new PipelineStageResult(this.name, 'BLOCK', `Blacklisted IP detected: ${packet.srcIp}`, 100, blacklistMatch));
      return true;
    }

    decision.addResult(new PipelineStageResult(this.name, 'PASS', 'IP not in explicit blacklists', 5));
    return false;
  }
}

// Stage 2: Port and Protocol Verification
export class PortProtocolStage {
  constructor(getRules) {
    this.name = 'Stage 2: Port & Protocol Guard';
    this.getRules = getRules;
  }

  evaluate(packet, decision) {
    const rules = this.getRules().filter(r => r.enabled && (r.type === 'PORT' || r.type === 'PROTOCOL'));

    const portMatch = rules.find(r => r.type === 'PORT' && r.action === 'BLOCK' && Number(r.value) === Number(packet.dstPort));
    if (portMatch) {
      decision.addResult(new PipelineStageResult(this.name, 'BLOCK', `Unauthorized Destination Port ${packet.dstPort} (${portMatch.label || 'Restricted'})`, 85, portMatch));
      return true;
    }

    const protoMatch = rules.find(r => r.type === 'PROTOCOL' && r.action === 'BLOCK' && r.value.toUpperCase() === packet.protocol.toUpperCase());
    if (protoMatch) {
      decision.addResult(new PipelineStageResult(this.name, 'BLOCK', `Disallowed Protocol: ${packet.protocol}`, 80, protoMatch));
      return true;
    }

    decision.addResult(new PipelineStageResult(this.name, 'PASS', `Port ${packet.dstPort}/${packet.protocol} conforms to network policy`, 10));
    return false;
  }
}

// Stage 3: Sliding-Window Rate Limiting
export class RateLimiterStage {
  constructor(windowMs = 4000, maxRequests = 8) {
    this.name = 'Stage 3: Sliding-Window Rate Limiter';
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.ipHistory = new Map();
  }

  evaluate(packet, decision) {
    const now = Date.now();
    const timestamps = this.ipHistory.get(packet.srcIp) || [];

    const validTimestamps = timestamps.filter(t => now - t < this.windowMs);
    validTimestamps.push(now);
    this.ipHistory.set(packet.srcIp, validTimestamps);

    if (validTimestamps.length > this.maxRequests) {
      const risk = Math.min(100, 50 + (validTimestamps.length - this.maxRequests) * 10);
      decision.action = 'RATE_LIMITED';
      decision.addResult(new PipelineStageResult(
        this.name,
        'BLOCK',
        `Rate limit exceeded: ${validTimestamps.length} reqs / ${this.windowMs / 1000}s (Threshold: ${this.maxRequests})`,
        risk
      ));
      return true;
    }

    decision.addResult(new PipelineStageResult(
      this.name,
      'PASS',
      `Rate within limits: ${validTimestamps.length}/${this.maxRequests} in ${this.windowMs / 1000}s`,
      Math.floor((validTimestamps.length / this.maxRequests) * 20)
    ));
    return false;
  }

  reset() {
    this.ipHistory.clear();
  }
}

// Stage 4: Deep Payload Threat Analyzer
export class PayloadThreatStage {
  constructor(getRules) {
    this.name = 'Stage 4: Deep Payload Threat Analyzer';
    this.getRules = getRules;
    this.signatures = [
      { id: 'SIG-SQLI', name: 'SQL Injection', regex: /(\b(UNION(\s+ALL)?|SELECT|INSERT|DELETE|UPDATE|DROP|TABLE)\b|'(\s*OR\s*|\s*AND\s*)'1'='1'|--|;)/i, risk: 95 },
      { id: 'SIG-XSS', name: 'Cross-Site Scripting (XSS)', regex: /(<script[\s\S]*?>|javascript:|onload\s*=|onerror\s*=|alert\(|eval\()/i, risk: 85 },
      { id: 'SIG-CMDI', name: 'OS Command Injection', regex: /(;|\&\&|\|\|)\s*(cat\s+\/etc|rm\s+-rf|nc\s+-e|bash\s+-i|whoami|curl\s+http)/i, risk: 98 },
      { id: 'SIG-PATH', name: 'Directory Traversal', regex: /(\.\.\/|\.\.\\|\/etc\/passwd|win\.ini)/i, risk: 90 },
      { id: 'SIG-BRUTE', name: 'Auth Probe / Brute Pattern', regex: /(admin:admin|root:root|password123|hydra|sqli)/i, risk: 75 }
    ];
  }

  evaluate(packet, decision) {
    const payload = `${packet.path || ''} ${packet.payload || ''}`;
    let matchedSig = null;

    for (const sig of this.signatures) {
      if (sig.regex.test(payload)) {
        matchedSig = sig;
        break;
      }
    }

    const customSigRules = this.getRules().filter(r => r.enabled && r.type === 'REGEX');
    for (const rule of customSigRules) {
      try {
        const regex = new RegExp(rule.value, 'i');
        if (regex.test(payload)) {
          matchedSig = { id: rule.id, name: rule.label, risk: 95 };
          break;
        }
      } catch (e) {
        console.error('Invalid regex rule', rule.value);
      }
    }

    if (matchedSig) {
      decision.addResult(new PipelineStageResult(
        this.name,
        'BLOCK',
        `Malicious exploit signature matched: [${matchedSig.name}]`,
        matchedSig.risk,
        matchedSig
      ));
      return true;
    }

    decision.addResult(new PipelineStageResult(
      this.name,
      'PASS',
      'Payload sanitized - 0 malicious signatures detected',
      5
    ));
    return false;
  }
}

// Stage 5: Adaptive Auto-Block
export class AdaptiveAutoBlockStage {
  constructor(onAutoBan) {
    this.name = 'Stage 5: Adaptive IP Auto-Banning';
    this.onAutoBan = onAutoBan;
    this.reputationScores = new Map();
    this.autoBannedIps = new Set();
  }

  evaluate(packet, decision) {
    if (this.autoBannedIps.has(packet.srcIp)) {
      decision.action = 'AUTO_BANNED';
      decision.addResult(new PipelineStageResult(
        this.name,
        'BLOCK',
        `Dynamic Auto-Shield: IP ${packet.srcIp} is quarantined for persistent hostile violations`,
        100
      ));
      return true;
    }

    const currentScore = this.reputationScores.get(packet.srcIp) || 0;
    const addedRisk = decision.finalRiskScore;
    const newScore = currentScore + addedRisk;
    this.reputationScores.set(packet.srcIp, newScore);

    if (newScore >= 120 && !this.autoBannedIps.has(packet.srcIp)) {
      this.autoBannedIps.add(packet.srcIp);
      if (this.onAutoBan) {
        this.onAutoBan(packet.srcIp, newScore);
      }
      decision.action = 'AUTO_BANNED';
      decision.addResult(new PipelineStageResult(
        this.name,
        'BLOCK',
        `Reputation ceiling breached (${newScore}/120). Autonomous Quarantine Activated.`,
        100
      ));
      return true;
    }

    decision.addResult(new PipelineStageResult(
      this.name,
      'PASS',
      `Reputation intact. Accumulated IP Threat Index: ${newScore}/120`,
      Math.min(35, Math.floor(newScore / 4))
    ));
    return false;
  }

  clearBan(ip) {
    this.autoBannedIps.delete(ip);
    this.reputationScores.delete(ip);
  }

  reset() {
    this.reputationScores.clear();
    this.autoBannedIps.clear();
  }
}

// Master Pipeline Orchestrator
export class FirewallPipeline {
  constructor({ getRules, onAutoBan }) {
    this.stages = [
      new IPFilterStage(getRules),
      new PortProtocolStage(getRules),
      new RateLimiterStage(4000, 8),
      new PayloadThreatStage(getRules),
      new AdaptiveAutoBlockStage(onAutoBan)
    ];
  }

  process(packet) {
    const decision = new PipelineDecision(packet);
    for (const stage of this.stages) {
      const shouldHalt = stage.evaluate(packet, decision);
      if (shouldHalt && decision.action === 'BLOCK') {
        break;
      }
    }
    return decision;
  }
}

/* ==========================================================================
   DEFAULT RULES SEED DATA
   ========================================================================== */
const INITIAL_RULES = [
  { id: 'R-101', type: 'IP', value: '192.168.1.100', action: 'ALLOW', label: 'Internal Gateway Node', priority: 'High', enabled: true },
  { id: 'R-102', type: 'IP', value: '198.51.100.4', action: 'BLOCK', label: 'Known C2 Botnet Node', priority: 'Critical', enabled: true },
  { id: 'R-103', type: 'PORT', value: '23', action: 'BLOCK', label: 'Telnet Insecure Port', priority: 'High', enabled: true },
  { id: 'R-104', type: 'PORT', value: '3389', action: 'BLOCK', label: 'Exposed RDP Port', priority: 'Medium', enabled: true },
  { id: 'R-105', type: 'PROTOCOL', value: 'TELNET', action: 'BLOCK', label: 'Legacy Cleartext Protocol', priority: 'High', enabled: true },
  { id: 'R-106', type: 'REGEX', value: '(select.+from.+information_schema|benchmark\\()', action: 'BLOCK', label: 'Blind SQLi Extraction Signature', priority: 'Critical', enabled: true }
];

/* ==========================================================================
   MAIN ADAPTIVESHIELD REACT APPLICATION
   ========================================================================== */
export default function App() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'attacklab' | 'live' | 'rules' | 'docs'

  // Pipeline Rules State
  const [rules, setRules] = useState(INITIAL_RULES);
  const [ruleSearch, setRuleSearch] = useState('');
  const [newRuleModalOpen, setNewRuleModalOpen] = useState(false);
  const [newRule, setNewRule] = useState({
    type: 'IP',
    value: '',
    action: 'BLOCK',
    label: '',
    priority: 'High',
    enabled: true
  });

  // Traffic Stream State
  const [packets, setPackets] = useState([]);
  const [isStreaming, setIsStreaming] = useState(true);
  const [streamSpeed, setStreamSpeed] = useState(800);
  const [packetFilter, setPacketFilter] = useState('ALL');
  const [selectedDecision, setSelectedDecision] = useState(null);

  // Active Simulation Pulse state
  const [shieldBarrierHit, setShieldBarrierHit] = useState(false);
  const [dataAccessPulse, setDataAccessPulse] = useState(false);

  // Stats Counters
  const [stats, setStats] = useState({
    total: 0,
    allowed: 0,
    blocked: 0,
    threatsDetected: 0,
    autoBans: 0
  });

  // Time-series Chart State
  const [trafficChartData, setTrafficChartData] = useState([
    { time: '00:00', allowed: 12, blocked: 2, threatScore: 15 },
    { time: '00:05', allowed: 19, blocked: 4, threatScore: 22 },
    { time: '00:10', allowed: 25, blocked: 1, threatScore: 8 },
    { time: '00:15', allowed: 32, blocked: 7, threatScore: 45 },
    { time: '00:20', allowed: 28, blocked: 3, threatScore: 18 },
    { time: '00:25', allowed: 35, blocked: 9, threatScore: 60 },
  ]);

  // System Health Metrics
  const [systemLoad, setSystemLoad] = useState(24);
  const [engineLatency, setEngineLatency] = useState(0.38);

  // Live Alerts Feed
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'AdaptiveShield 5-Stage Core active with Antigravity Canvas Engine.', type: 'info', time: 'Just now' }
  ]);

  const rulesRef = useRef(rules);
  rulesRef.current = rules;

  const handleAutoBan = (ip, score) => {
    setStats(prev => ({ ...prev, autoBans: prev.autoBans + 1 }));
    setNotifications(prev => [
      {
        id: Date.now(),
        text: `🚨 Dynamic IPS Auto-Ban: IP [${ip}] quarantined! Accum. Threat Index: ${score}`,
        type: 'alert',
        time: new Date().toLocaleTimeString()
      },
      ...prev.slice(0, 8)
    ]);
  };

  const pipeline = useMemo(() => {
    return new FirewallPipeline({
      getRules: () => rulesRef.current,
      onAutoBan: handleAutoBan
    });
  }, []);

  const generatePacket = (override = {}) => {
    const protocols = ['HTTPS', 'HTTP', 'SSH', 'DNS', 'Telnet', 'TCP'];
    const sampleIps = [
      '192.168.1.100',
      '10.0.0.45',
      '172.16.0.22',
      '198.51.100.4',
      '45.33.32.156',
      '185.220.101.5',
      '103.21.244.0',
      '91.108.4.1'
    ];
    const ports = [443, 80, 22, 53, 23, 3306, 8080, 3389];
    const safePayloads = [
      'GET /api/v1/health HTTP/1.1 Host: cloud.corp',
      'POST /v2/auth/token Accept: application/json',
      'GET /dashboard/telemetry?range=1h HTTP/2.0',
      'DNS QUERY standard A record cluster.internal',
      'GET /assets/cyber-shield.svg HTTP/1.1'
    ];

    const isBenign = Math.random() > 0.35;
    const protocol = override.protocol || protocols[Math.floor(Math.random() * protocols.length)];
    const dstPort = override.dstPort || (protocol === 'SSH' ? 22 : protocol === 'Telnet' ? 23 : protocol === 'DNS' ? 53 : ports[Math.floor(Math.random() * ports.length)]);
    const srcIp = override.srcIp || sampleIps[Math.floor(Math.random() * sampleIps.length)];
    const payload = override.payload || (isBenign ? safePayloads[Math.floor(Math.random() * safePayloads.length)] : 'GET /index.php?id=1 UNION SELECT 1,username,password FROM users --');

    return new Packet({
      srcIp,
      dstPort,
      protocol,
      payload,
      method: override.method || (Math.random() > 0.5 ? 'GET' : 'POST'),
      path: override.path || '/api/gateway',
      ...override
    });
  };

  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      const newPacket = generatePacket();
      processIncomingPacket(newPacket);
    }, streamSpeed);

    return () => clearInterval(interval);
  }, [isStreaming, streamSpeed]);

  const processIncomingPacket = (packet) => {
    const startTime = performance.now();
    const decision = pipeline.process(packet);
    const latency = ((performance.now() - startTime) + Math.random() * 0.12).toFixed(2);
    setEngineLatency(latency);

    if (decision.allowed) {
      setDataAccessPulse(true);
      setTimeout(() => setDataAccessPulse(false), 500);
    } else {
      setShieldBarrierHit(true);
      setTimeout(() => setShieldBarrierHit(false), 500);
    }

    setStats(prev => ({
      total: prev.total + 1,
      allowed: decision.allowed ? prev.allowed + 1 : prev.allowed,
      blocked: !decision.allowed ? prev.blocked + 1 : prev.blocked,
      threatsDetected: decision.finalRiskScore > 50 ? prev.threatsDetected + 1 : prev.threatsDetected,
      autoBans: prev.autoBans
    }));

    setPackets(prev => [decision, ...prev.slice(0, 99)]);

    setSystemLoad(prev => {
      const jitter = Math.floor(Math.random() * 5) - 2;
      return Math.min(95, Math.max(15, prev + jitter));
    });
  };

  useEffect(() => {
    const graphInterval = setInterval(() => {
      setTrafficChartData(prev => {
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

        const recentPackets = packets.slice(0, 15);
        const allowedCount = recentPackets.filter(p => p.allowed).length;
        const blockedCount = recentPackets.filter(p => !p.allowed).length;
        const avgRisk = recentPackets.length > 0 ? Math.floor(recentPackets.reduce((acc, p) => acc + p.finalRiskScore, 0) / recentPackets.length) : 10;

        const nextPoint = {
          time: timeStr,
          allowed: allowedCount + Math.floor(Math.random() * 4) + 2,
          blocked: blockedCount + Math.floor(Math.random() * 3),
          threatScore: avgRisk
        };

        return [...prev.slice(1), nextPoint];
      });
    }, 4000);

    return () => clearInterval(graphInterval);
  }, [packets]);

  const toggleRule = (id) => {
    setRules(prev =>
      prev.map(r => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const deleteRule = (id) => {
    setRules(prev => prev.filter(r => r.id !== id));
  };

  const handleAddRule = (e) => {
    e.preventDefault();
    if (!newRule.value) return;
    const ruleObj = {
      id: `R-${Math.floor(100 + Math.random() * 900)}`,
      ...newRule
    };
    setRules(prev => [ruleObj, ...prev]);
    setNewRule({
      type: 'IP',
      value: '',
      action: 'BLOCK',
      label: '',
      priority: 'High',
      enabled: true
    });
    setNewRuleModalOpen(false);
  };

  const exportLogsAsJSON = () => {
    const exportData = packets.map(p => ({
      id: p.packet.id,
      timestamp: p.packet.timestamp,
      srcIp: p.packet.srcIp,
      dstPort: p.packet.dstPort,
      protocol: p.packet.protocol,
      action: p.action,
      allowed: p.allowed,
      riskScore: p.finalRiskScore,
      threatLevel: p.getThreatLevel().label,
      verdictReason: p.verdictReason,
      verdictStage: p.verdictStage,
      payload: p.packet.payload
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AdaptiveShield_AuditLog_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportLogsAsCSV = () => {
    const headers = ['ID', 'Timestamp', 'Source IP', 'Port', 'Protocol', 'Action', 'Allowed', 'Risk Score', 'Threat Level', 'Verdict Reason'];
    const rows = packets.map(p => [
      p.packet.id,
      p.packet.timestamp,
      p.packet.srcIp,
      p.packet.dstPort,
      p.packet.protocol,
      p.action,
      p.allowed ? 'YES' : 'NO',
      p.finalRiskScore,
      p.getThreatLevel().label,
      `"${p.verdictReason.replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AdaptiveShield_AuditLog_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredPackets = packets.filter(p => {
    if (packetFilter === 'ALLOWED') return p.allowed;
    if (packetFilter === 'BLOCKED') return !p.allowed;
    if (packetFilter === 'THREAT') return p.finalRiskScore >= 50;
    return true;
  });

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen text-slate-100 flex flex-col font-['Inter',sans-serif] selection:bg-blue-600 selection:text-white">
      {/* 1. ANTIGRAVITY INTERACTIVE PARTICLE CANVAS BACKGROUND */}
      <AntigravityCanvas />

      {/* 2. TOP NAVIGATION HEADER */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50 px-4 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-2xl">
        <div className="flex items-center gap-3.5">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-sky-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 ring-1 ring-blue-400/40">
            <Shield className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-blue-400 ring-2 ring-[#050811] animate-ping"></span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-sky-200 to-blue-400 bg-clip-text text-transparent">
                AdaptiveShield
              </h1>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-blue-950/90 border border-blue-500/40 text-blue-300 font-semibold tracking-wider">
                IPS 5.2
              </span>
            </div>
            <p className="text-xs text-slate-400">Autonomous 5-Stage Network Defense &amp; Attack Simulation Lab</p>
          </div>
        </div>

        {/* Global Navigation Controls */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-950/50 border border-blue-500/40 text-blue-300">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            <span>ANTIGRAVITY PARTICLES: ON</span>
          </div>

          {/* Navigation Tab Switcher */}
          <nav className="flex bg-slate-900/90 border border-slate-800 p-1 rounded-2xl shadow-inner">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                activeTab === 'overview'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              Defense Overview
            </button>
            <button
              onClick={() => setActiveTab('attacklab')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                activeTab === 'attacklab'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5" />
              Attack Simulation Lab
            </button>
            <button
              onClick={() => setActiveTab('live')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                activeTab === 'live'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              Live Console
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                activeTab === 'rules'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Rules ({rules.length})
            </button>
            <button
              onClick={() => setActiveTab('docs')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                activeTab === 'docs'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Developer Docs
            </button>
          </nav>
        </div>
      </header>

      {/* 3. MAIN SMOOTH SCROLLING BODY */}
      <main className="relative z-10 flex-1 p-4 lg:p-8 max-w-[1700px] w-full mx-auto space-y-12">

        {/* HERO SECTION */}
        <section className="text-center py-6 sm:py-10 space-y-4 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-600/10 border border-blue-500/30 text-blue-400 text-xs font-mono font-semibold tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            ENTERPRISE NETWORK FIREWALL &amp; ADAPTIVE IPS
          </div>
          <h1 className="text-3xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Autonomous Cyber Defense <br />
            <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
              Engineered for Modern Threats
            </span>
          </h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Protect high-availability infrastructure with sub-millisecond 5-stage packet inspection, volumetric DDoS scrubbing, and interactive attack simulations.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={() => setActiveTab('attacklab')}
              className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
            >
              <Crosshair className="w-4 h-4" /> Open Attack Simulation Lab
            </button>
            <button
              onClick={() => setActiveTab('live')}
              className="px-6 py-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-sm transition-all flex items-center gap-2"
            >
              <Terminal className="w-4 h-4 text-blue-400" /> Inspect Live Packet Log
            </button>
          </div>
        </section>

        {/* TELEMETRY STATS ROW (ELEVATED CRISP WHITE CARDS) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-5 rounded-3xl bg-white text-gray-900 border border-slate-200 shadow-xl flex items-center justify-between hover:scale-[1.02] transition-all duration-200">
            <div>
              <p className="text-[11px] font-mono text-gray-500 uppercase tracking-wider">Total Packets</p>
              <h3 className="text-2xl font-bold font-mono text-gray-900 mt-1">{stats.total.toLocaleString()}</h3>
              <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1 font-mono">
                <Wifi className="w-3 h-3 text-blue-600" /> Ingress Stream
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600">
              <Activity className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white text-gray-900 border border-slate-200 shadow-xl flex items-center justify-between hover:scale-[1.02] transition-all duration-200">
            <div>
              <p className="text-[11px] font-mono text-gray-500 uppercase tracking-wider">Allowed Traffic</p>
              <h3 className="text-2xl font-bold font-mono text-blue-700 mt-1">{stats.allowed.toLocaleString()}</h3>
              <p className="text-[11px] text-blue-800 mt-0.5 flex items-center gap-1 font-medium font-mono">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {stats.total > 0 ? ((stats.allowed / stats.total) * 100).toFixed(1) : 100}% Pass Rate
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white text-gray-900 border border-slate-200 shadow-xl flex items-center justify-between hover:scale-[1.02] transition-all duration-200">
            <div>
              <p className="text-[11px] font-mono text-gray-500 uppercase tracking-wider">Blocked Attacks</p>
              <h3 className="text-2xl font-bold font-mono text-rose-600 mt-1">{stats.blocked.toLocaleString()}</h3>
              <p className="text-[11px] text-rose-700 mt-0.5 flex items-center gap-1 font-medium font-mono">
                <XCircle className="w-3 h-3" /> Drops &amp; Filters
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white text-gray-900 border border-slate-200 shadow-xl flex items-center justify-between hover:scale-[1.02] transition-all duration-200">
            <div>
              <p className="text-[11px] font-mono text-gray-500 uppercase tracking-wider">Active ACL Rules</p>
              <h3 className="text-2xl font-bold font-mono text-blue-700 mt-1">{rules.filter(r => r.enabled).length} / {rules.length}</h3>
              <p className="text-[11px] text-blue-800 mt-0.5 flex items-center gap-1 font-medium font-mono">
                <Lock className="w-3 h-3" /> Enforced Policies
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600">
              <Sliders className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white text-gray-900 border border-slate-200 shadow-xl flex items-center justify-between hover:scale-[1.02] transition-all duration-200">
            <div>
              <p className="text-[11px] font-mono text-gray-500 uppercase tracking-wider">Dynamic Auto-Bans</p>
              <h3 className="text-2xl font-bold font-mono text-indigo-700 mt-1">{stats.autoBans}</h3>
              <p className="text-[11px] text-indigo-800 mt-0.5 flex items-center gap-1 font-medium font-mono">
                <Flame className="w-3 h-3 text-rose-500" /> Reputation Blocks
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600">
              <Zap className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* TAB VIEW 1: ATTACK SIMULATION LAB */}
        {activeTab === 'attacklab' && (
          <section id="attack-lab-section">
            <AttackVisualizerLab />
          </section>
        )}

        {/* TAB VIEW 2: DEFENSE OVERVIEW & RECHARTS GRAPH */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Real-time Recharts Graph */}
            <div className="p-6 rounded-3xl bg-white text-gray-900 border border-slate-200 shadow-2xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    Live Ingress Throughput &amp; Bandwidth Distribution (Recharts)
                  </h2>
                  <p className="text-xs text-gray-500">Continuous real-time throughput: Sanitized Client Packets vs Blocked Hostile Attacks</p>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="flex items-center gap-1 text-blue-700 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span> Allowed Requests
                  </span>
                  <span className="flex items-center gap-1 text-rose-600 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block"></span> Blocked Threats
                  </span>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trafficChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAllowedAntigravity" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0066ff" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#0066ff" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorBlockedAntigravity" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#e11d48" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#e11d48" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#93c5fd',
                        borderRadius: '1rem',
                        fontSize: '12px',
                        color: '#0f172a',
                        boxShadow: '0 10px 25px -5px rgba(0, 102, 255, 0.2)'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="allowed"
                      stroke="#0066ff"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorAllowedAntigravity)"
                      name="Allowed Requests"
                    />
                    <Area
                      type="monotone"
                      dataKey="blocked"
                      stroke="#e11d48"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorBlockedAntigravity)"
                      name="Blocked Attacks"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Embedded Attack Lab Preview */}
            <AttackVisualizerLab />
          </div>
        )}

        {/* TAB VIEW 3: LIVE TERMINAL CONSOLE */}
        {activeTab === 'live' && (
          <div className="space-y-4">
            <div className="p-6 rounded-3xl bg-white text-gray-900 border border-slate-200 shadow-2xl space-y-4">
              {/* Terminal Controls Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-mono">
                    <Terminal className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold text-gray-800">Live Ingress Capture Terminal</span>
                    <span className="text-gray-500">({filteredPackets.length} captured)</span>
                  </div>

                  <button
                    onClick={() => setIsStreaming(!isStreaming)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                      isStreaming
                        ? 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                    }`}
                  >
                    {isStreaming ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-blue-600" />}
                    {isStreaming ? 'Pause Ingress' : 'Resume Ingress'}
                  </button>

                  {/* Speed Switcher */}
                  <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-mono">
                    <span className="px-2 text-gray-500 text-[10px]">SPEED:</span>
                    {[
                      { label: '1x', val: 1200 },
                      { label: '2x', val: 800 },
                      { label: '4x', val: 300 },
                      { label: 'Turbo', val: 100 }
                    ].map(s => (
                      <button
                        key={s.label}
                        onClick={() => setStreamSpeed(s.val)}
                        className={`px-2 py-0.5 rounded-lg transition-all duration-200 ${
                          streamSpeed === s.val
                            ? 'bg-blue-600 text-white font-bold shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filters & Log Exporters */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-mono">
                    {['ALL', 'ALLOWED', 'BLOCKED', 'THREAT'].map(f => (
                      <button
                        key={f}
                        onClick={() => setPacketFilter(f)}
                        className={`px-2.5 py-1 rounded-lg transition-all duration-200 ${
                          packetFilter === f
                            ? 'bg-white text-blue-800 border border-blue-300 font-bold shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={exportLogsAsJSON}
                      title="Export Security Logs as JSON"
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs text-slate-700 font-mono transition-all duration-200"
                    >
                      <Download className="w-3.5 h-3.5 text-blue-600" />
                      JSON
                    </button>
                    <button
                      onClick={exportLogsAsCSV}
                      title="Export Security Logs as CSV"
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs text-slate-700 font-mono transition-all duration-200"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-600" />
                      CSV
                    </button>
                  </div>
                </div>
              </div>

              {/* Terminal Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 max-h-[520px] overflow-y-auto">
                <table className="w-full text-left text-xs font-mono border-collapse">
                  <thead className="bg-slate-100 text-gray-600 sticky top-0 z-10 border-b border-slate-200">
                    <tr>
                      <th className="p-3">STATUS</th>
                      <th className="p-3">TIMESTAMP</th>
                      <th className="p-3">SOURCE IP</th>
                      <th className="p-3">DEST PORT</th>
                      <th className="p-3">PROTO</th>
                      <th className="p-3">RISK &amp; SEVERITY</th>
                      <th className="p-3">VERDICT / RULE TRIGGER</th>
                      <th className="p-3 text-right">INSPECT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-gray-800 bg-white">
                    {filteredPackets.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="p-8 text-center text-gray-400 italic">
                          No packets matching filter. Incoming network traffic will stream automatically.
                        </td>
                      </tr>
                    ) : (
                      filteredPackets.map((item) => {
                        const threatLevel = item.getThreatLevel();
                        return (
                          <tr
                            key={item.packet.id}
                            className="hover:bg-blue-50/80 transition-colors duration-150 group cursor-pointer animate-packet-slide"
                            onClick={() => setSelectedDecision(item)}
                          >
                            <td className="p-3 whitespace-nowrap">
                              {item.allowed ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-300 text-emerald-700 text-[11px] font-semibold">
                                  <CheckCircle2 className="w-3 h-3" /> ALLOW
                                </span>
                              ) : item.action === 'RATE_LIMITED' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-50 border border-amber-300 text-amber-700 text-[11px] font-semibold">
                                  <AlertTriangle className="w-3 h-3" /> RATE LIMIT
                                </span>
                              ) : item.action === 'AUTO_BANNED' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-300 text-indigo-700 text-[11px] font-semibold">
                                  <Flame className="w-3 h-3" /> AUTO BAN
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-rose-50 border border-rose-300 text-rose-700 text-[11px] font-semibold">
                                  <XCircle className="w-3 h-3" /> BLOCK
                                </span>
                              )}
                            </td>

                            <td className="p-3 text-gray-500 whitespace-nowrap">
                              {new Date(item.packet.timestamp).toLocaleTimeString()}
                            </td>

                            <td className="p-3 whitespace-nowrap font-bold text-blue-700">
                              {item.packet.srcIp}
                            </td>

                            <td className="p-3 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800">
                                :{item.packet.dstPort}
                              </span>
                            </td>

                            <td className="p-3 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded font-semibold ${
                                item.packet.protocol === 'HTTPS' ? 'text-blue-800 bg-blue-100' :
                                item.packet.protocol === 'SSH' ? 'text-purple-800 bg-purple-100' :
                                item.packet.protocol === 'Telnet' ? 'text-rose-800 bg-rose-100' : 'text-gray-800 bg-slate-100'
                              }`}>
                                {item.packet.protocol}
                              </span>
                            </td>

                            <td className="p-3 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${threatLevel.color}`}>
                                {threatLevel.label} ({item.finalRiskScore}%)
                              </span>
                            </td>

                            <td className="p-3 text-gray-700 truncate max-w-xs">
                              <span className={!item.allowed ? 'text-rose-700 font-medium' : 'text-gray-600'}>
                                {item.verdictReason}
                              </span>
                            </td>

                            <td className="p-3 text-right whitespace-nowrap">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedDecision(item);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-300 text-blue-800 hover:bg-blue-100 transition-all text-[11px] font-mono flex items-center gap-1 ml-auto"
                              >
                                <Eye className="w-3 h-3 text-blue-600" /> Audit
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB VIEW 4: FIREWALL RULES MANAGEMENT */}
        {activeTab === 'rules' && (
          <div className="space-y-4">
            <div className="p-6 rounded-3xl bg-white text-gray-900 border border-slate-200 shadow-2xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-blue-600" />
                    Firewall Access Control List (ACL) &amp; Custom Rules
                  </h2>
                  <p className="text-xs text-gray-500">Configure deterministic firewall rules for IP, Ports, Protocols, and Signature regexes.</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search rules..."
                      value={ruleSearch}
                      onChange={(e) => setRuleSearch(e.target.value)}
                      className="pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 font-mono w-48 sm:w-64"
                    />
                  </div>

                  <button
                    onClick={() => setNewRuleModalOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all duration-200"
                  >
                    <Plus className="w-4 h-4" /> Create Rule
                  </button>
                </div>
              </div>

              {/* Rules Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50">
                <table className="w-full text-left text-xs font-mono border-collapse">
                  <thead className="bg-slate-100 text-gray-600 border-b border-slate-200">
                    <tr>
                      <th className="p-3">RULE ID</th>
                      <th className="p-3">TYPE</th>
                      <th className="p-3">MATCH VALUE</th>
                      <th className="p-3">ACTION</th>
                      <th className="p-3">RULE DESCRIPTION</th>
                      <th className="p-3">PRIORITY</th>
                      <th className="p-3">STATUS</th>
                      <th className="p-3 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-gray-800 bg-white">
                    {rules
                      .filter(r =>
                        r.value.toLowerCase().includes(ruleSearch.toLowerCase()) ||
                        r.label.toLowerCase().includes(ruleSearch.toLowerCase()) ||
                        r.type.toLowerCase().includes(ruleSearch.toLowerCase())
                      )
                      .map((rule) => (
                        <tr key={rule.id} className="hover:bg-blue-50/60 transition-colors">
                          <td className="p-3 font-bold text-blue-700 whitespace-nowrap">{rule.id}</td>
                          <td className="p-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800 text-[11px]">
                              {rule.type}
                            </span>
                          </td>
                          <td className="p-3 font-semibold text-gray-900">{rule.value}</td>
                          <td className="p-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              rule.action === 'ALLOW'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                                : 'bg-rose-50 text-rose-700 border border-rose-300'
                            }`}>
                              {rule.action}
                            </span>
                          </td>
                          <td className="p-3 text-gray-600">{rule.label}</td>
                          <td className="p-3 whitespace-nowrap">
                            <span className={`text-[11px] font-semibold ${
                              rule.priority === 'Critical' ? 'text-rose-600' :
                              rule.priority === 'High' ? 'text-amber-600' : 'text-gray-500'
                            }`}>
                              {rule.priority}
                            </span>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <button
                              onClick={() => toggleRule(rule.id)}
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-200 border ${
                                rule.enabled
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                  : 'bg-slate-100 text-gray-400 border-gray-200'
                              }`}
                            >
                              {rule.enabled ? 'Active' : 'Disabled'}
                            </button>
                          </td>
                          <td className="p-3 text-right whitespace-nowrap">
                            <button
                              onClick={() => deleteRule(rule.id)}
                              className="p-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 transition-all duration-200"
                              title="Delete Rule"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB VIEW 5: DEVELOPER DOCS */}
        {activeTab === 'docs' && (
          <section id="docs-section">
            <DeveloperDocs />
          </section>
        )}
      </main>

      {/* DECISION BREAKDOWN MODAL */}
      {selectedDecision && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-gray-900 border border-slate-200 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col font-['Inter',sans-serif]">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-slate-50 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-2xl ${
                  selectedDecision.allowed
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                    : 'bg-rose-50 text-rose-700 border border-rose-300'
                }`}>
                  {selectedDecision.allowed ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    Packet Inspection Decision: [{selectedDecision.packet.id}]
                  </h3>
                  <p className="text-xs text-gray-500">Deep Packet Inspection &amp; 5-Stage Audit Log</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDecision(null)}
                className="text-gray-400 hover:text-gray-700 p-1.5 rounded-xl hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs font-mono">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-gray-500 block text-[10px]">SOURCE IP</span>
                  <span className="text-blue-700 font-bold">{selectedDecision.packet.srcIp}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px]">DEST PORT</span>
                  <span className="text-gray-800 font-bold">Port {selectedDecision.packet.dstPort}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px]">PROTOCOL</span>
                  <span className="text-purple-700 font-bold">{selectedDecision.packet.protocol}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px]">RISK SCORE</span>
                  <span className={`font-bold ${
                    selectedDecision.finalRiskScore >= 80 ? 'text-rose-600' : 'text-emerald-600'
                  }`}>
                    {selectedDecision.finalRiskScore}%
                  </span>
                </div>
              </div>

              <div>
                <span className="text-gray-700 font-semibold block mb-1">RAW PAYLOAD BUFFER:</span>
                <div className="p-3.5 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 overflow-x-auto break-all font-mono text-[11px] leading-relaxed">
                  {selectedDecision.packet.payload || '<EMPTY PAYLOAD>'}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-gray-700 font-semibold block">5-STAGE PIPELINE EVALUATION TRACE:</span>
                <div className="space-y-2">
                  {selectedDecision.stageResults.map((stg, i) => (
                    <div
                      key={i}
                      className={`p-3.5 rounded-2xl border ${
                        stg.status === 'BLOCK'
                          ? 'bg-rose-50 border-rose-200 text-rose-800'
                          : 'bg-slate-50 border-slate-200 text-gray-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-gray-900">{stg.stageName}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          stg.status === 'BLOCK'
                            ? 'bg-rose-100 text-rose-700 border border-rose-300'
                            : 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                        }`}>
                          {stg.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-600">{stg.reason}</p>
                      {stg.matchedRule && (
                        <div className="mt-1.5 text-[10px] text-blue-800 bg-white p-1.5 rounded-lg border border-blue-200">
                          Matched Rule ID: <strong>{stg.matchedRule.id || stg.matchedRule.name}</strong> ({stg.matchedRule.label || stg.matchedRule.name})
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedDecision(null)}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all duration-200"
              >
                Close Audit Trace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD NEW RULE MODAL */}
      {newRuleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAddRule}
            className="bg-white text-gray-900 border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 font-['Inter',sans-serif]"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" /> Create Firewall Rule
              </h3>
              <button
                type="button"
                onClick={() => setNewRuleModalOpen(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-700 mb-1 font-medium">Rule Type</label>
                <select
                  value={newRule.type}
                  onChange={(e) => setNewRule({ ...newRule, type: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-gray-900 font-mono focus:border-blue-500 focus:outline-none"
                >
                  <option value="IP">IP Address</option>
                  <option value="PORT">Destination Port</option>
                  <option value="PROTOCOL">Protocol</option>
                  <option value="REGEX">Payload Regex Signature</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 mb-1 font-medium">Match Value / Target</label>
                <input
                  type="text"
                  required
                  placeholder={newRule.type === 'IP' ? '192.168.1.50' : newRule.type === 'PORT' ? '8080' : 'Pattern'}
                  value={newRule.value}
                  onChange={(e) => setNewRule({ ...newRule, value: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-gray-900 font-mono focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 mb-1 font-medium">Action</label>
                  <select
                    value={newRule.action}
                    onChange={(e) => setNewRule({ ...newRule, action: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-gray-900 font-mono focus:border-blue-500 focus:outline-none"
                  >
                    <option value="BLOCK">BLOCK (Drop)</option>
                    <option value="ALLOW">ALLOW (Whitelist)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 mb-1 font-medium">Priority</label>
                  <select
                    value={newRule.priority}
                    onChange={(e) => setNewRule({ ...newRule, priority: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-gray-900 font-mono focus:border-blue-500 focus:outline-none"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 mb-1 font-medium">Description / Rule Label</label>
                <input
                  type="text"
                  placeholder="e.g. Block unauthorized ingress node"
                  value={newRule.label}
                  onChange={(e) => setNewRule({ ...newRule, label: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-gray-900 font-mono focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setNewRuleModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-gray-700 text-xs font-semibold transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all duration-200"
              >
                Save &amp; Enforce Rule
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. GLOBAL FOOTER */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950/90 px-4 lg:px-8 py-6 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-4 font-mono">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-500" />
          <span className="text-slate-200 font-medium">AdaptiveShield Autonomous Network Firewall &amp; IPS</span>
        </div>
        <div>
          <span>Engine Status: <strong className="text-emerald-400 font-semibold">ALL 5 PIPELINE STAGES OPERATIONAL</strong></span>
        </div>
      </footer>
    </div>
  );
}
