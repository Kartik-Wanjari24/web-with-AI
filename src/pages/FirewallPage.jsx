import React, { useState } from 'react';
import {
  Shield, ShieldCheck, ShieldAlert, ShieldX,
  Flame, Database, Code, Share2, Lock, Target,
  Activity, Zap, BarChart3, CheckCircle, XCircle,
  Cpu, Globe, Clock, AlertTriangle, ChevronDown, ChevronRight
} from 'lucide-react';

const PROTECTIONS = [
  {
    id: 'ddos',
    attack: 'DDoS (Distributed Denial of Service)',
    icon: Flame,
    color: 'rose',
    severity: 'CRITICAL',
    defenseStatus: 'ACTIVE',
    mechanism: 'Sliding-Window Rate Limiting + IP Auto-Quarantine',
    stage: 'Stage 3 + Stage 5',
    howBlocked: [
      'Sliding-window rate limiter (4s window, max 8 req/s) detects burst anomalies and immediately rate-limits the offending IP.',
      'Adaptive Auto-Banning Stage accumulates reputation scores — IPs that repeatedly breach limits are permanently quarantined above 120 threat points.',
      'SYN cookie validation rejects half-open connection floods without exhausting server backlog queues.',
      'Anycast BGP scrubber absorbs volumetric traffic upstream before packets reach the origin server.',
    ],
    config: [
      { key: 'Rate Window', value: '4,000 ms sliding' },
      { key: 'Max Requests', value: '8 per window' },
      { key: 'Auto-Ban Threshold', value: '120 reputation points' },
      { key: 'Scrub Capacity', value: 'Anycast upstream' },
    ],
  },
  {
    id: 'sqli',
    attack: 'SQL Injection (SQLi)',
    icon: Database,
    color: 'purple',
    severity: 'CRITICAL',
    defenseStatus: 'ACTIVE',
    mechanism: 'Deep Payload Inspection (DPI) + Parameterized Query Enforcement',
    stage: 'Stage 4',
    howBlocked: [
      'Stage 4 regex engine (SIG-SQLI) scans the full HTTP path + body for UNION/SELECT/INSERT/DELETE/DROP keywords and boolean tautologies.',
      'Matches common patterns: `\' OR \'1\'=\'1\'`, `--` comment terminators, `UNION SELECT`, `information_schema` dumps.',
      'Custom REGEX rules from the ACL manager let operators add organization-specific SQL signatures at runtime without restart.',
      'Parameterized query enforcement at the application layer ensures raw SQL concatenation never reaches the database.',
    ],
    config: [
      { key: 'Built-in Signature', value: 'SIG-SQLI · Risk 95' },
      { key: 'Pattern Coverage', value: 'Tautology, UNION, DDL' },
      { key: 'Custom Rules', value: 'Operator-defined REGEX' },
      { key: 'Avg Detection Time', value: '< 0.4ms' },
    ],
  },
  {
    id: 'xss',
    attack: 'Cross-Site Scripting (XSS)',
    icon: Code,
    color: 'sky',
    severity: 'HIGH',
    defenseStatus: 'ACTIVE',
    mechanism: 'Payload DPI (SIG-XSS) + Content Security Policy (CSP) Header Enforcement',
    stage: 'Stage 4',
    howBlocked: [
      'Stage 4 regex (SIG-XSS) matches `<script>`, `javascript:`, `onload=`, `onerror=`, `eval(`, and `alert(` patterns in request payloads.',
      'Content Security Policy (CSP) response headers block inline script execution even when a payload bypasses the request filter.',
      'HTML entity encoding (`&lt;script&gt;`) prevents the browser from interpreting stored payloads as executable code.',
      '`HttpOnly` and `Secure` cookie flags prevent JavaScript from reading session tokens even if a script executes.',
    ],
    config: [
      { key: 'Built-in Signature', value: 'SIG-XSS · Risk 85' },
      { key: 'Pattern Coverage', value: '<script>, onload, eval' },
      { key: 'CSP Mode', value: 'script-src self only' },
      { key: 'Cookie Protection', value: 'HttpOnly + Secure' },
    ],
  },
  {
    id: 'bruteforce',
    attack: 'Brute Force Credential Attacks',
    icon: Target,
    color: 'amber',
    severity: 'HIGH',
    defenseStatus: 'ACTIVE',
    mechanism: 'Rate Limiting + Signature Detection + Progressive Back-off IP Ban',
    stage: 'Stage 3 + Stage 4 + Stage 5',
    howBlocked: [
      'Stage 3 rate limiter catches automated credential spraying (Hydra, Burp Intruder) — 8 req/4s threshold stops even optimized brute-force tools.',
      'Stage 4 (SIG-BRUTE) explicitly matches known brute-force patterns: admin:admin, root:root, password123, and Hydra/THC user-agents.',
      'Stage 5 accumulates reputation scores from failed auth probes — IP auto-bans prevent attackers from resetting between bursts.',
      'Account lockout policies enforce progressive delays: 5 failed attempts → 15min lock; 10 attempts → 1hr lock.',
    ],
    config: [
      { key: 'Rate Threshold', value: '8 req / 4s per IP' },
      { key: 'Built-in Signature', value: 'SIG-BRUTE · Risk 75' },
      { key: 'Auto-Ban', value: 'Cumulative 120 pts' },
      { key: 'Lockout Policy', value: 'Progressive delay' },
    ],
  },
  {
    id: 'mitm',
    attack: 'Man-in-the-Middle (MitM)',
    icon: Share2,
    color: 'blue',
    severity: 'HIGH',
    defenseStatus: 'MONITORED',
    mechanism: 'TLS 1.3 Enforcement + Protocol Blocking + Certificate Pinning',
    stage: 'Stage 1 + Stage 2',
    howBlocked: [
      'Stage 2 blocks cleartext protocols (Telnet port 23, HTTP port 80) — forcing all traffic through TLS 1.3 encrypted channels.',
      'HSTS (HTTP Strict Transport Security) prevents browsers from accepting downgraded HTTP connections, defeating SSL stripping attacks.',
      'Certificate pinning rejects forged or rogue CA certificates that attackers use to impersonate legitimate servers.',
      'IEEE 802.1X port authentication prevents unauthorized devices from joining the network and intercepting traffic.',
    ],
    config: [
      { key: 'Blocked Protocol', value: 'Telnet · Cleartext HTTP' },
      { key: 'Blocked Ports', value: '23, 80 (Stage 2 ACL)' },
      { key: 'TLS Version', value: '1.3 minimum enforced' },
      { key: 'Cert Pinning', value: 'HPKP / TrustKit' },
    ],
  },
];

const colorMap = {
  rose:   { border: 'border-rose-500/30',   bg: 'bg-rose-500/6',    icon: 'bg-rose-600/15 text-rose-400',   badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',   header: 'from-rose-950/50',   bar: 'bg-rose-500' },
  purple: { border: 'border-purple-500/30', bg: 'bg-purple-500/6',  icon: 'bg-purple-600/15 text-purple-400', badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30', header: 'from-purple-950/50', bar: 'bg-purple-500' },
  sky:    { border: 'border-sky-500/30',    bg: 'bg-sky-500/6',     icon: 'bg-sky-600/15 text-sky-400',    badge: 'bg-sky-500/15 text-sky-300 border-sky-500/30',    header: 'from-sky-950/50',    bar: 'bg-sky-500' },
  amber:  { border: 'border-amber-500/30',  bg: 'bg-amber-500/6',   icon: 'bg-amber-600/15 text-amber-400',  badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',  header: 'from-amber-950/50',  bar: 'bg-amber-500' },
  blue:   { border: 'border-blue-500/30',   bg: 'bg-blue-500/6',    icon: 'bg-blue-600/15 text-blue-400',   badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30',   header: 'from-blue-950/50',   bar: 'bg-blue-500' },
};

const SEVERITY_COLORS = {
  CRITICAL: 'bg-rose-500/15 text-rose-400 border-rose-500/40',
  HIGH:     'bg-amber-500/15 text-amber-400 border-amber-500/40',
};

const STATUS_COLORS = {
  ACTIVE:    'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
  MONITORED: 'bg-blue-500/15 text-blue-400 border-blue-500/40',
};

function ProtectionCard({ protection }) {
  const [open, setOpen] = useState(false);
  const c = colorMap[protection.color];
  const Icon = protection.icon;

  return (
    <div className={`rounded-3xl border ${c.border} ${c.bg} overflow-hidden`}>
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full text-left p-5 sm:p-6 flex items-start gap-4 group cursor-pointer bg-gradient-to-r ${c.header} to-transparent`}
      >
        <div className={`w-12 h-12 rounded-2xl ${c.icon} flex items-center justify-center shrink-0`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-white">{protection.attack}</h3>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${SEVERITY_COLORS[protection.severity]}`}>
              {protection.severity}
            </span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[protection.defenseStatus]}`}>
              {protection.defenseStatus === 'ACTIVE'
                ? <><span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1" />ACTIVE</>
                : <><span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 mr-1" />MONITORED</>
              }
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono">{protection.mechanism}</p>
          <p className="text-[10px] text-slate-600 font-mono">{protection.stage}</p>
        </div>
        <div className="shrink-0 mt-1 text-slate-600 group-hover:text-slate-300">
          {open ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </div>
      </button>

      {/* Expanded */}
      {open && (
        <div className="px-5 sm:px-6 pb-6 space-y-5 border-t border-slate-800/60">
          {/* How it's blocked */}
          <div className="mt-5 space-y-2">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              How AdaptiveShield Blocks It
            </h4>
            <div className="space-y-2.5">
              {protection.howBlocked.map((point, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-300 leading-relaxed">{point}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Config table */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              Defense Configuration
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {protection.config.map(({ key, value }) => (
                <div key={key} className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[11px] font-mono text-slate-500">{key}</span>
                  <span className="text-[11px] font-mono font-bold text-white">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FirewallPage() {
  const activeCount = PROTECTIONS.filter(p => p.defenseStatus === 'ACTIVE').length;
  const monitoredCount = PROTECTIONS.filter(p => p.defenseStatus === 'MONITORED').length;

  return (
    <div className="px-4 sm:px-6 lg:px-12 py-12 max-w-[1400px] mx-auto space-y-12">
      {/* Page Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-600/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold tracking-widest">
          <ShieldCheck className="w-3.5 h-3.5" />
          FIREWALL PROTECTION MATRIX
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
          How AdaptiveShield{' '}
          <span className="bg-gradient-to-r from-emerald-400 via-blue-300 to-sky-400 bg-clip-text text-transparent">
            Blocks Every Attack
          </span>
        </h1>
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
          AdaptiveShield's 5-stage pipeline provides active defense against every major attack vector.
          Each card below shows the exact rule sets, pipeline stages, and technical mechanisms used to block or monitor that threat.
        </p>
      </div>

      {/* Status overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
        {[
          { label: 'Attack Vectors', value: PROTECTIONS.length, icon: ShieldAlert, color: 'text-blue-400' },
          { label: 'Actively Blocked', value: activeCount, icon: ShieldCheck, color: 'text-emerald-400' },
          { label: 'Under Monitoring', value: monitoredCount, icon: Activity, color: 'text-amber-400' },
          { label: 'Pipeline Stages', value: 5, icon: Cpu, color: 'text-purple-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
            <Icon className={`w-5 h-5 mx-auto mb-1.5 ${color}`} />
            <div className={`text-2xl font-bold font-mono ${color}`}>{value}</div>
            <div className="text-[10px] text-slate-500 font-mono">{label}</div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 justify-center text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-emerald-400 font-bold">ACTIVE</span>
          <span className="text-slate-500">— Automatically blocked by pipeline rule</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-400" />
          <span className="text-blue-400 font-bold">MONITORED</span>
          <span className="text-slate-500">— Detected and logged; requires network-layer mitigation</span>
        </div>
      </div>

      {/* Protection Cards */}
      <div className="space-y-4">
        {PROTECTIONS.map(p => (
          <ProtectionCard key={p.id} protection={p} />
        ))}
      </div>

      {/* Pipeline Map */}
      <div className="rounded-3xl bg-blue-950/20 border border-blue-500/20 p-6 sm:p-8 space-y-4">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-bold text-white">Attack → Pipeline Stage Mapping</h3>
          <p className="text-xs text-slate-400">Which stage stops which attack</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left py-2.5 px-3 text-slate-500 font-bold uppercase tracking-wider">Attack Vector</th>
                <th className="py-2.5 px-3 text-blue-400 font-bold text-center">S1: IP ACL</th>
                <th className="py-2.5 px-3 text-indigo-400 font-bold text-center">S2: Port</th>
                <th className="py-2.5 px-3 text-amber-400 font-bold text-center">S3: Rate</th>
                <th className="py-2.5 px-3 text-rose-400 font-bold text-center">S4: Payload</th>
                <th className="py-2.5 px-3 text-purple-400 font-bold text-center">S5: AutoBan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {[
                { name: 'DDoS Flood',      s: [false, false, true,  false, true ] },
                { name: 'SQL Injection',   s: [false, false, false, true,  false] },
                { name: 'XSS',             s: [false, false, false, true,  false] },
                { name: 'Brute Force',     s: [false, false, true,  true,  true ] },
                { name: 'MitM',            s: [true,  true,  false, false, false] },
              ].map(({ name, s }) => (
                <tr key={name} className="hover:bg-slate-800/20">
                  <td className="py-2.5 px-3 text-slate-300 font-semibold">{name}</td>
                  {s.map((active, i) => (
                    <td key={i} className="py-2.5 px-3 text-center">
                      {active
                        ? <CheckCircle className="w-4 h-4 text-emerald-400 mx-auto" />
                        : <span className="w-4 h-0.5 bg-slate-800 rounded inline-block" />
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
