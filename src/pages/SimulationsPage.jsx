import React, { useState } from 'react';
import {
  Activity, Shield, ShieldCheck, ShieldAlert, ShieldX, Filter,
  Plus, Trash2, ToggleLeft, ToggleRight, Download, Play, Pause,
  RotateCcw, ChevronDown, Layers, Cpu, Clock, Crosshair,
  CheckCircle, XCircle, AlertTriangle, Sliders, X
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import AttackVisualizerLab from '../components/AttackVisualizerLab';

/* ── helpers ── */
function threatBadge(score) {
  if (score >= 90) return { label: 'CRITICAL', cls: 'bg-rose-500/20 text-rose-400 border border-rose-500/40' };
  if (score >= 70) return { label: 'HIGH',     cls: 'bg-amber-500/20 text-amber-400 border border-amber-500/40' };
  if (score >= 35) return { label: 'MEDIUM',   cls: 'bg-blue-500/20 text-blue-400 border border-blue-500/40' };
  return                  { label: 'LOW',       cls: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' };
}

const TAB_ICONS = {
  overview:    Activity,
  attacklab:   Crosshair,
  live:        Layers,
  rules:       Sliders,
};

function exportBlob(data, filename, type) {
  const blob = new Blob([data], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

/* ── AddRule Modal ── */
function AddRuleModal({ onAdd, onClose }) {
  const [form, setForm] = useState({ type: 'IP', value: '', action: 'BLOCK', label: '', priority: 'Medium' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const valid = form.value.trim().length > 0 && form.label.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white">Add ACL Rule</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-3">
          {[
            { label: 'Rule Type', key: 'type', options: ['IP','PORT','PROTOCOL','REGEX'] },
            { label: 'Action', key: 'action', options: ['BLOCK','ALLOW'] },
            { label: 'Priority', key: 'priority', options: ['Critical','High','Medium','Low'] },
          ].map(({ label, key, options }) => (
            <div key={key} className="space-y-1">
              <label className="text-xs font-mono text-slate-400">{label}</label>
              <select
                value={form[key]}
                onChange={e => set(key, e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          ))}

          {[
            { label: 'Value (IP / Port / Protocol / Regex)', key: 'value', placeholder: 'e.g. 192.168.1.200 or 8080 or SQL pattern' },
            { label: 'Rule Label', key: 'label', placeholder: 'e.g. Block suspicious IP' },
          ].map(({ label, key, placeholder }) => (
            <div key={key} className="space-y-1">
              <label className="text-xs font-mono text-slate-400">{label}</label>
              <input
                type="text"
                value={form[key]}
                onChange={e => set(key, e.target.value)}
                placeholder={placeholder}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => { if (valid) { onAdd({ ...form, enabled: true }); onClose(); } }}
            disabled={!valid}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-default text-white text-sm font-bold transition-all cursor-pointer"
          >
            Add Rule
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Firewall Overview Tab ── */
function OverviewTab({ stats, trafficChartData, packets, isStreaming, setIsStreaming, streamSpeed, setStreamSpeed }) {
  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Inspected', value: stats.total, color: 'text-blue-400', icon: Activity },
          { label: 'Allowed', value: stats.allowed, color: 'text-emerald-400', icon: CheckCircle },
          { label: 'Blocked', value: stats.blocked, color: 'text-rose-400', icon: XCircle },
          { label: 'Threats Detected', value: stats.threatsDetected, color: 'text-amber-400', icon: AlertTriangle },
          { label: 'Auto-Bans', value: stats.autoBans, color: 'text-purple-400', icon: ShieldAlert },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center gap-2 mb-2 text-slate-500">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-[10px] font-mono uppercase">{label}</span>
            </div>
            <div className={`text-2xl sm:text-3xl font-bold font-mono ${color}`}>{value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* Stream controls */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <span className="text-xs font-mono text-slate-400 font-semibold shrink-0">STREAM:</span>
        <button
          onClick={() => setIsStreaming(s => !s)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            isStreaming ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40' : 'bg-rose-600/20 text-rose-400 border border-rose-500/40'
          }`}
        >
          {isStreaming ? <><Play className="w-3.5 h-3.5" /> STREAMING</> : <><Pause className="w-3.5 h-3.5" /> PAUSED</>}
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-mono">Speed:</span>
          {[['Slow', 1500], ['Normal', 800], ['Fast', 300], ['Turbo', 80]].map(([label, ms]) => (
            <button
              key={label}
              onClick={() => setStreamSpeed(ms)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                streamSpeed === ms ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800">
          <h3 className="text-sm font-bold text-white mb-4">Allowed vs. Blocked Traffic</h3>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficChartData}>
                <defs>
                  <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gB" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#475569' }} />
                <YAxis tick={{ fontSize: 9, fill: '#475569' }} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, fontSize: 11 }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Area type="monotone" dataKey="allowed" stroke="#3b82f6" strokeWidth={2} fill="url(#gA)" />
                <Area type="monotone" dataKey="blocked" stroke="#f43f5e" strokeWidth={2} fill="url(#gB)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800">
          <h3 className="text-sm font-bold text-white mb-4">Threat Score Over Time</h3>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trafficChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#475569' }} />
                <YAxis tick={{ fontSize: 9, fill: '#475569' }} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, fontSize: 11 }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Bar dataKey="threatScore" fill="#f59e0b" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Live Packet Tab ── */
function LivePacketTab({ packets }) {
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');

  const displayed = packets.filter(p => {
    const matchSearch = !search || p.packet.srcIp.includes(search) || p.packet.protocol.toLowerCase().includes(search.toLowerCase());
    const matchAction = filterAction === 'ALL' || (filterAction === 'ALLOW' ? p.allowed : !p.allowed);
    return matchSearch && matchAction;
  });

  const exportJson = () => exportBlob(
    JSON.stringify(packets.map(p => ({
      ts: p.timestamp, src: p.packet.srcIp, port: p.packet.dstPort,
      proto: p.packet.protocol, action: p.action, risk: p.finalRiskScore, reason: p.verdictReason,
    })), null, 2),
    `shield-log-${Date.now()}.json`, 'application/json'
  );

  const exportCsv = () => exportBlob(
    ['Timestamp,Source IP,Port,Protocol,Action,Risk Score,Reason',
     ...packets.map(p => `${p.timestamp},${p.packet.srcIp},${p.packet.dstPort},${p.packet.protocol},${p.action},${p.finalRiskScore},"${p.verdictReason}"`)
    ].join('\n'),
    `shield-log-${Date.now()}.csv`, 'text/csv'
  );

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Filter by IP or protocol..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono"
        />
        {['ALL','ALLOW','BLOCK'].map(f => (
          <button
            key={f}
            onClick={() => setFilterAction(f)}
            className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
              filterAction === f ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-700 hover:text-white'
            }`}
          >
            {f}
          </button>
        ))}
        <div className="flex gap-2 ml-auto">
          <button onClick={exportJson} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer border border-slate-700">
            <Download className="w-3.5 h-3.5" /> JSON
          </button>
          <button onClick={exportCsv} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer border border-slate-700">
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto scrollbar-none">
          <table className="w-full text-xs font-mono">
            <thead className="sticky top-0 bg-slate-950 border-b border-slate-800">
              <tr>
                {['Source IP','Port','Protocol','Action','Risk','Verdict Stage','Reason'].map(h => (
                  <th key={h} className="text-left px-3 py-2.5 text-[10px] text-slate-500 uppercase font-bold tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.slice(0, 80).map((d, i) => {
                const { label, cls } = threatBadge(d.finalRiskScore);
                return (
                  <tr key={i} className="border-b border-slate-800/60 hover:bg-slate-800/30 animate-packet-slide">
                    <td className="px-3 py-2 text-slate-300">{d.packet.srcIp}</td>
                    <td className="px-3 py-2 text-slate-400">{d.packet.dstPort}</td>
                    <td className="px-3 py-2 text-slate-400">{d.packet.protocol}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${d.allowed ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
                        {d.action}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${cls}`}>{label}</span>
                    </td>
                    <td className="px-3 py-2 text-slate-500">{d.verdictStage || 'All Stages'}</td>
                    <td className="px-3 py-2 text-slate-500 max-w-[200px] truncate">{d.verdictReason}</td>
                  </tr>
                );
              })}
              {displayed.length === 0 && (
                <tr><td colSpan={7} className="text-center py-10 text-slate-600">No packets match your filter</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="text-xs text-slate-600 font-mono text-right">Showing {Math.min(displayed.length, 80)} of {displayed.length} packets</div>
    </div>
  );
}

/* ── Rules Tab ── */
function RulesTab({ rules, ruleHandlers }) {
  const [showModal, setShowModal] = useState(false);
  const TYPE_COLORS = {
    IP: 'blue', PORT: 'amber', PROTOCOL: 'emerald', REGEX: 'purple',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-white">ACL Policy Manager</h3>
          <p className="text-xs text-slate-500">{rules.filter(r => r.enabled).length} active rules · {rules.length} total</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" />
          Add Rule
        </button>
      </div>

      <div className="space-y-2">
        {rules.map(rule => {
          const color = TYPE_COLORS[rule.type] || 'blue';
          return (
            <div
              key={rule.id}
              className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                rule.enabled ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-950/60 border-slate-900 opacity-50'
              }`}
            >
              <button
                onClick={() => ruleHandlers.toggle(rule.id)}
                className="shrink-0 cursor-pointer"
                title={rule.enabled ? 'Disable rule' : 'Enable rule'}
              >
                {rule.enabled
                  ? <ToggleRight className="w-6 h-6 text-blue-400" />
                  : <ToggleLeft className="w-6 h-6 text-slate-600" />
                }
              </button>

              <div className="flex-1 min-w-0 flex flex-wrap items-center gap-2">
                <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-${color}-600/15 text-${color}-400 border border-${color}-500/30`}>
                  {rule.type}
                </span>
                <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${rule.action === 'BLOCK' ? 'bg-rose-600/15 text-rose-400 border border-rose-500/30' : 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/30'}`}>
                  {rule.action}
                </span>
                <span className="text-xs font-semibold text-white truncate">{rule.label}</span>
                <span className="text-xs text-slate-500 font-mono">{rule.value}</span>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <span className="text-[9px] font-mono text-slate-600 hidden sm:block">{rule.id}</span>
                <button
                  onClick={() => ruleHandlers.delete(rule.id)}
                  className="p-1.5 rounded-lg hover:bg-rose-900/40 text-slate-600 hover:text-rose-400 transition-all cursor-pointer"
                  title="Delete rule"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <AddRuleModal
          onAdd={ruleHandlers.add}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

/* ── Main SimulationsPage ── */
export default function SimulationsPage({
  stats, packets, trafficChartData, isStreaming, setIsStreaming,
  streamSpeed, setStreamSpeed, rules, ruleHandlers, processIncomingPacket,
}) {
  const [activeTab, setActiveTab] = useState('overview');

  const TABS = [
    { id: 'overview',  label: 'Firewall Console' },
    { id: 'attacklab', label: 'Attack Simulations' },
    { id: 'live',      label: 'Live Packets' },
    { id: 'rules',     label: 'ACL Rules' },
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-12 py-12 max-w-[1700px] mx-auto space-y-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/10 border border-blue-500/30 text-blue-400 text-xs font-mono font-semibold mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
            ADAPTIVE FIREWALL · LIVE ENGINE
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Interactive Firewall Console</h1>
          <p className="text-slate-400 text-sm mt-1">Real-time packet inspection, animated attack simulations, and rule management — all in one place.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 font-bold">5/5 STAGES OPERATIONAL</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex overflow-x-auto scrollbar-none gap-1 bg-slate-900/80 border border-slate-800 p-1 rounded-2xl w-full sm:w-fit">
        {TABS.map(({ id, label }) => {
          const Icon = TAB_ICONS[id];
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                activeTab === id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab
          stats={stats}
          trafficChartData={trafficChartData}
          packets={packets}
          isStreaming={isStreaming}
          setIsStreaming={setIsStreaming}
          streamSpeed={streamSpeed}
          setStreamSpeed={setStreamSpeed}
        />
      )}
      {activeTab === 'attacklab' && <AttackVisualizerLab />}
      {activeTab === 'live'     && <LivePacketTab packets={packets} />}
      {activeTab === 'rules'    && <RulesTab rules={rules} ruleHandlers={ruleHandlers} />}
    </div>
  );
}
