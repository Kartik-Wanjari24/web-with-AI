import React, { useState, useEffect, useRef, useMemo } from 'react';
import AntigravityCanvas from './components/AntigravityCanvas';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import FirewallPage from './pages/FirewallPage';
import KnowledgeBasePage from './pages/KnowledgeBasePage';
import SimulationsPage from './pages/SimulationsPage';
import TechStackPage from './pages/TechStackPage';

/* ==========================================================================
   5-STAGE OOP RULE PIPELINE ENGINE
   (Identical JS implementation — C++ WASM bridge in src/wasm/pipelineBridge.js
   mirrors every class below for the compiled WebAssembly build.)
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
    this.status = status;
    this.reason = reason;
    this.riskScore = riskScore;
    this.matchedRule = matchedRule;
  }
}

export class PipelineDecision {
  constructor(packet) {
    this.packet = packet;
    this.allowed = true;
    this.action = 'ALLOW';
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
    if (this.finalRiskScore >= 70) return { label: 'HIGH',     color: 'text-amber-700 bg-amber-50 border-amber-300' };
    if (this.finalRiskScore >= 35) return { label: 'MEDIUM',   color: 'text-blue-700 bg-blue-50 border-blue-300' };
    return                               { label: 'LOW',       color: 'text-emerald-700 bg-emerald-50 border-emerald-300' };
  }
}

export class IPFilterStage {
  constructor(getRules) { this.name = 'Stage 1: IP Access List'; this.getRules = getRules; }
  evaluate(packet, decision) {
    const rules = this.getRules().filter(r => r.enabled && r.type === 'IP');
    const wl = rules.find(r => r.action === 'ALLOW' && (r.value === packet.srcIp || r.value === '*'));
    if (wl) { decision.addResult(new PipelineStageResult(this.name, 'PASS', `Explicitly Whitelisted via Rule [${wl.id}]`, 0, wl)); return false; }
    const bl = rules.find(r => r.action === 'BLOCK' && r.value === packet.srcIp);
    if (bl) { decision.addResult(new PipelineStageResult(this.name, 'BLOCK', `Blacklisted IP detected: ${packet.srcIp}`, 100, bl)); return true; }
    decision.addResult(new PipelineStageResult(this.name, 'PASS', 'IP not in explicit blacklists', 5));
    return false;
  }
}

export class PortProtocolStage {
  constructor(getRules) { this.name = 'Stage 2: Port & Protocol Guard'; this.getRules = getRules; }
  evaluate(packet, decision) {
    const rules = this.getRules().filter(r => r.enabled && (r.type === 'PORT' || r.type === 'PROTOCOL'));
    const pm = rules.find(r => r.type === 'PORT' && r.action === 'BLOCK' && Number(r.value) === Number(packet.dstPort));
    if (pm) { decision.addResult(new PipelineStageResult(this.name, 'BLOCK', `Unauthorized Destination Port ${packet.dstPort} (${pm.label || 'Restricted'})`, 85, pm)); return true; }
    const proto = rules.find(r => r.type === 'PROTOCOL' && r.action === 'BLOCK' && r.value.toUpperCase() === packet.protocol.toUpperCase());
    if (proto) { decision.addResult(new PipelineStageResult(this.name, 'BLOCK', `Disallowed Protocol: ${packet.protocol}`, 80, proto)); return true; }
    decision.addResult(new PipelineStageResult(this.name, 'PASS', `Port ${packet.dstPort}/${packet.protocol} conforms to network policy`, 10));
    return false;
  }
}

export class RateLimiterStage {
  constructor(windowMs = 4000, maxRequests = 8) {
    this.name = 'Stage 3: Sliding-Window Rate Limiter';
    this.windowMs = windowMs; this.maxRequests = maxRequests; this.ipHistory = new Map();
  }
  evaluate(packet, decision) {
    const now = Date.now();
    const timestamps = (this.ipHistory.get(packet.srcIp) || []).filter(t => now - t < this.windowMs);
    timestamps.push(now);
    this.ipHistory.set(packet.srcIp, timestamps);
    if (timestamps.length > this.maxRequests) {
      const risk = Math.min(100, 50 + (timestamps.length - this.maxRequests) * 10);
      decision.action = 'RATE_LIMITED';
      decision.addResult(new PipelineStageResult(this.name, 'BLOCK', `Rate limit exceeded: ${timestamps.length} reqs / ${this.windowMs / 1000}s (Threshold: ${this.maxRequests})`, risk));
      return true;
    }
    decision.addResult(new PipelineStageResult(this.name, 'PASS', `Rate within limits: ${timestamps.length}/${this.maxRequests} in ${this.windowMs / 1000}s`, Math.floor((timestamps.length / this.maxRequests) * 20)));
    return false;
  }
  reset() { this.ipHistory.clear(); }
}

export class PayloadThreatStage {
  constructor(getRules) {
    this.name = 'Stage 4: Deep Payload Threat Analyzer';
    this.getRules = getRules;
    this.signatures = [
      { id: 'SIG-SQLI',  name: 'SQL Injection',               regex: /(\b(UNION(\s+ALL)?|SELECT|INSERT|DELETE|UPDATE|DROP|TABLE)\b|'(\s*OR\s*|\s*AND\s*)'1'='1'|--|;)/i, risk: 95 },
      { id: 'SIG-XSS',   name: 'Cross-Site Scripting (XSS)',  regex: /(<script[\s\S]*?>|javascript:|onload\s*=|onerror\s*=|alert\(|eval\()/i, risk: 85 },
      { id: 'SIG-CMDI',  name: 'OS Command Injection',        regex: /(;|&&|\|\|)\s*(cat\s+\/etc|rm\s+-rf|nc\s+-e|bash\s+-i|whoami|curl\s+http)/i, risk: 98 },
      { id: 'SIG-PATH',  name: 'Directory Traversal',         regex: /(\.\.\/|\.\.\\|\/etc\/passwd|win\.ini)/i, risk: 90 },
      { id: 'SIG-BRUTE', name: 'Auth Probe / Brute Pattern',  regex: /(admin:admin|root:root|password123|hydra|sqli)/i, risk: 75 },
    ];
  }
  evaluate(packet, decision) {
    const payload = `${packet.path || ''} ${packet.payload || ''}`;
    let sig = this.signatures.find(s => s.regex.test(payload));
    if (!sig) {
      for (const rule of this.getRules().filter(r => r.enabled && r.type === 'REGEX')) {
        try { if (new RegExp(rule.value, 'i').test(payload)) { sig = { id: rule.id, name: rule.label, risk: 95 }; break; } } catch (_) {}
      }
    }
    if (sig) { decision.addResult(new PipelineStageResult(this.name, 'BLOCK', `Malicious exploit signature matched: [${sig.name}]`, sig.risk, sig)); return true; }
    decision.addResult(new PipelineStageResult(this.name, 'PASS', 'Payload sanitized - 0 malicious signatures detected', 5));
    return false;
  }
}

export class AdaptiveAutoBlockStage {
  constructor(onAutoBan) {
    this.name = 'Stage 5: Adaptive IP Auto-Banning';
    this.onAutoBan = onAutoBan; this.reputationScores = new Map(); this.autoBannedIps = new Set();
  }
  evaluate(packet, decision) {
    if (this.autoBannedIps.has(packet.srcIp)) {
      decision.action = 'AUTO_BANNED';
      decision.addResult(new PipelineStageResult(this.name, 'BLOCK', `Dynamic Auto-Shield: IP ${packet.srcIp} is quarantined for persistent hostile violations`, 100));
      return true;
    }
    const newScore = (this.reputationScores.get(packet.srcIp) || 0) + decision.finalRiskScore;
    this.reputationScores.set(packet.srcIp, newScore);
    if (newScore >= 120 && !this.autoBannedIps.has(packet.srcIp)) {
      this.autoBannedIps.add(packet.srcIp);
      if (this.onAutoBan) this.onAutoBan(packet.srcIp, newScore);
      decision.action = 'AUTO_BANNED';
      decision.addResult(new PipelineStageResult(this.name, 'BLOCK', `Reputation ceiling breached (${newScore}/120). Autonomous Quarantine Activated.`, 100));
      return true;
    }
    decision.addResult(new PipelineStageResult(this.name, 'PASS', `Reputation intact. Accumulated IP Threat Index: ${newScore}/120`, Math.min(35, Math.floor(newScore / 4))));
    return false;
  }
  reset() { this.reputationScores.clear(); this.autoBannedIps.clear(); }
}

export class FirewallPipeline {
  constructor({ getRules, onAutoBan }) {
    this.stages = [
      new IPFilterStage(getRules),
      new PortProtocolStage(getRules),
      new RateLimiterStage(4000, 8),
      new PayloadThreatStage(getRules),
      new AdaptiveAutoBlockStage(onAutoBan),
    ];
  }
  process(packet) {
    const decision = new PipelineDecision(packet);
    for (const stage of this.stages) {
      if (stage.evaluate(packet, decision) && decision.action === 'BLOCK') break;
    }
    return decision;
  }
}

/* ==========================================================================
   DEFAULT RULES SEED DATA
   ========================================================================== */
export const INITIAL_RULES = [
  { id: 'R-101', type: 'IP',       value: '192.168.1.100', action: 'ALLOW', label: 'Internal Gateway Node',           priority: 'High',     enabled: true },
  { id: 'R-102', type: 'IP',       value: '198.51.100.4',  action: 'BLOCK', label: 'Known C2 Botnet Node',            priority: 'Critical', enabled: true },
  { id: 'R-103', type: 'PORT',     value: '23',            action: 'BLOCK', label: 'Telnet Insecure Port',            priority: 'High',     enabled: true },
  { id: 'R-104', type: 'PORT',     value: '3389',          action: 'BLOCK', label: 'Exposed RDP Port',                priority: 'Medium',   enabled: true },
  { id: 'R-105', type: 'PROTOCOL', value: 'TELNET',        action: 'BLOCK', label: 'Legacy Cleartext Protocol',       priority: 'High',     enabled: true },
  { id: 'R-106', type: 'REGEX',    value: '(select.+from.+information_schema|benchmark\\()', action: 'BLOCK', label: 'Blind SQLi Extraction Signature', priority: 'Critical', enabled: true },
];

/* ==========================================================================
   PACKET GENERATOR (shared across pages via prop)
   ========================================================================== */
const SAMPLE_IPS   = ['192.168.1.100','10.0.0.45','172.16.0.22','198.51.100.4','45.33.32.156','185.220.101.5','103.21.244.0','91.108.4.1'];
const PROTOCOLS    = ['HTTPS','HTTP','SSH','DNS','Telnet','TCP'];
const PORTS        = [443, 80, 22, 53, 23, 3306, 8080, 3389];
const SAFE_PAYLOADS= [
  'GET /api/v1/health HTTP/1.1 Host: cloud.corp',
  'POST /v2/auth/token Accept: application/json',
  'GET /dashboard/telemetry?range=1h HTTP/2.0',
  'DNS QUERY standard A record cluster.internal',
  'GET /assets/cyber-shield.svg HTTP/1.1',
];

export function generatePacket(override = {}) {
  const isBenign = Math.random() > 0.35;
  const protocol = override.protocol || PROTOCOLS[Math.floor(Math.random() * PROTOCOLS.length)];
  const dstPort  = override.dstPort  || (protocol === 'SSH' ? 22 : protocol === 'Telnet' ? 23 : protocol === 'DNS' ? 53 : PORTS[Math.floor(Math.random() * PORTS.length)]);
  const srcIp    = override.srcIp    || SAMPLE_IPS[Math.floor(Math.random() * SAMPLE_IPS.length)];
  const payload  = override.payload  || (isBenign ? SAFE_PAYLOADS[Math.floor(Math.random() * SAFE_PAYLOADS.length)] : 'GET /index.php?id=1 UNION SELECT 1,username,password FROM users --');
  return new Packet({ srcIp, dstPort, protocol, payload, method: override.method || (Math.random() > 0.5 ? 'GET' : 'POST'), path: override.path || '/api/gateway', ...override });
}

/* ==========================================================================
   ROOT APP — layout shell + pipeline state owner
   ========================================================================== */
export default function App() {
  const [activePage, setActivePage] = useState('home');

  // ── Pipeline rules ──────────────────────────────────────────────────────
  const [rules, setRules] = useState(INITIAL_RULES);

  // ── Traffic stream ───────────────────────────────────────────────────────
  const [packets, setPackets]       = useState([]);
  const [isStreaming, setIsStreaming]= useState(true);
  const [streamSpeed, setStreamSpeed]= useState(800);

  // ── Stats ────────────────────────────────────────────────────────────────
  const [stats, setStats] = useState({ total: 0, allowed: 0, blocked: 0, threatsDetected: 0, autoBans: 0 });

  // ── Chart data ───────────────────────────────────────────────────────────
  const [trafficChartData, setTrafficChartData] = useState([
    { time: '00:00', allowed: 12, blocked: 2, threatScore: 15 },
    { time: '00:05', allowed: 19, blocked: 4, threatScore: 22 },
    { time: '00:10', allowed: 25, blocked: 1, threatScore: 8  },
    { time: '00:15', allowed: 32, blocked: 7, threatScore: 45 },
    { time: '00:20', allowed: 28, blocked: 3, threatScore: 18 },
    { time: '00:25', allowed: 35, blocked: 9, threatScore: 60 },
  ]);

  // ── Ref closure so pipeline never stale-closes over rules ────────────────
  const rulesRef = useRef(rules);
  rulesRef.current = rules;

  const pipeline = useMemo(() => new FirewallPipeline({
    getRules: () => rulesRef.current,
    onAutoBan: () => setStats(prev => ({ ...prev, autoBans: prev.autoBans + 1 })),
  }), []);

  // ── Packet processing ────────────────────────────────────────────────────
  const processIncomingPacket = (packet) => {
    const decision = pipeline.process(packet);
    setStats(prev => ({
      total:          prev.total + 1,
      allowed:        decision.allowed ? prev.allowed + 1 : prev.allowed,
      blocked:        !decision.allowed ? prev.blocked + 1 : prev.blocked,
      threatsDetected:decision.finalRiskScore > 50 ? prev.threatsDetected + 1 : prev.threatsDetected,
      autoBans:       prev.autoBans,
    }));
    setPackets(prev => [decision, ...prev.slice(0, 99)]);
    return decision;
  };

  // ── Auto-stream interval ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isStreaming) return;
    const id = setInterval(() => processIncomingPacket(generatePacket()), streamSpeed);
    return () => clearInterval(id);
  }, [isStreaming, streamSpeed]);

  // ── Chart updater ─────────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      setTrafficChartData(prev => {
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`;
        const recent  = packets.slice(0, 15);
        const allowed = recent.filter(p => p.allowed).length;
        const blocked = recent.filter(p => !p.allowed).length;
        const avgRisk = recent.length > 0 ? Math.floor(recent.reduce((a, p) => a + p.finalRiskScore, 0) / recent.length) : 10;
        return [...prev.slice(1), { time: timeStr, allowed: allowed + Math.floor(Math.random() * 4) + 2, blocked: blocked + Math.floor(Math.random() * 3), threatScore: avgRisk }];
      });
    }, 4000);
    return () => clearInterval(id);
  }, [packets]);

  // ── Rule management helpers (passed down to SimulationsPage) ──────────────
  const ruleHandlers = {
    toggle: (id) => setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r)),
    delete: (id) => setRules(prev => prev.filter(r => r.id !== id)),
    add:    (rule) => setRules(prev => [{ id: `R-${Math.floor(100 + Math.random() * 900)}`, ...rule }, ...prev]),
  };

  // ── Shared props bundle ───────────────────────────────────────────────────
  const pipelineProps = {
    rules, stats, packets, isStreaming, setIsStreaming, streamSpeed, setStreamSpeed,
    trafficChartData, processIncomingPacket, ruleHandlers,
  };

  return (
    <div className="relative min-h-screen text-slate-100 flex flex-col font-['Inter',sans-serif] selection:bg-blue-600 selection:text-white">
      <AntigravityCanvas />
      <Navbar activePage={activePage} onNavigate={setActivePage} />

      <main className="relative z-10 flex-1">
        {activePage === 'home'        && <HomePage       {...pipelineProps} onNavigate={setActivePage} />}
        {activePage === 'firewall'    && <FirewallPage />}
        {activePage === 'knowledge'   && <KnowledgeBasePage />}
        {activePage === 'simulations' && <SimulationsPage {...pipelineProps} />}
        {activePage === 'techstack'   && <TechStackPage />}
      </main>

      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950/90 px-4 sm:px-6 lg:px-12 py-5 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-3 font-mono">
        <div className="flex items-center gap-2">
          <span className="text-slate-200 font-medium">AdaptiveShield Autonomous Network Firewall</span>
        </div>
        <div>
          Engine Status: <strong className="text-emerald-400 font-semibold">5/5 PIPELINE STAGES OPERATIONAL</strong>
        </div>
      </footer>
    </div>
  );
}
