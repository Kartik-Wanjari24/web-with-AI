/**
 * pipelineBridge.js
 *
 * Lazy-loads the Emscripten-compiled WASM module (pipeline.js / pipeline.wasm)
 * and exposes an API that mirrors the old pure-JS FirewallPipeline interface so
 * App.jsx requires minimal changes.
 *
 * Usage in App.jsx (replaces `new FirewallPipeline(...)`):
 *
 *   import { initPipeline, processPacket, syncRules } from './wasm/pipelineBridge.js';
 *
 *   // Once, at startup:
 *   await initPipeline();
 *
 *   // After every rules state change:
 *   syncRules(rules);
 *
 *   // Per packet (replaces pipeline.process(packet)):
 *   const decision = processPacket(packet);
 */

// The ES-module factory emitted by Emscripten (EXPORT_ES6=1, MODULARIZE=1).
// Vite resolves this as a static import; the .wasm file is fetched at runtime.
import createPipelineModule from './pipeline.js';

let _module = null;   // resolved Emscripten module instance
let _engine = null;   // PipelineEngine C++ object

/** Initialise and instantiate the WASM engine. Call once before processPacket. */
export async function initPipeline() {
    if (_engine) return; // already initialised
    _module = await createPipelineModule();
    _engine = new _module.PipelineEngine();
}

/**
 * Push the current `rules` React state into the C++ engine.
 * Call this inside a useEffect that watches `rules`.
 *
 * @param {Array<{id,type,value,action,label,priority,enabled}>} rules
 */
export function syncRules(rules) {
    if (!_engine) throw new Error('Pipeline not initialised — await initPipeline() first.');

    const jsVec = new _module.VectorRuleInput();
    for (const r of rules) {
        const ri = _module.RuleInput ? new _module.RuleInput() : {};
        ri.id       = r.id;
        ri.type     = r.type;
        ri.value    = r.value;
        ri.action   = r.action;
        ri.label    = r.label    ?? '';
        ri.priority = r.priority ?? 'High';
        ri.enabled  = r.enabled  ?? true;
        jsVec.push_back(ri);
    }
    _engine.setRules(jsVec);
    jsVec.delete();
}

/**
 * Process one packet through the C++ 5-stage pipeline.
 *
 * Returns a plain JS object shaped like the old PipelineDecision so that the
 * rest of App.jsx (stats, table rendering, audit modal) works unchanged.
 *
 * @param   {object} packet  — plain Packet-like object from generatePacket()
 * @returns {object}          — decision object compatible with PipelineDecision
 */
export function processPacket(packet) {
    if (!_engine) throw new Error('Pipeline not initialised — await initPipeline() first.');

    // Build EMBIND value object
    const pi = {
        id:        packet.id        ?? '',
        timestamp: packet.timestamp ?? new Date().toISOString(),
        srcIp:     packet.srcIp     ?? '0.0.0.0',
        dstPort:   packet.dstPort   ?? 443,
        protocol:  packet.protocol  ?? 'HTTPS',
        payload:   packet.payload   ?? '',
        length:    packet.length    ?? 512,
        method:    packet.method    ?? 'GET',
        path:      packet.path      ?? '/',
        geo:       packet.geo       ?? 'US',
    };

    const raw = _engine.processPacket(pi);   // DecisionOutput (C++ → JS copy)

    // Collect stage results out of the EMBIND vector
    const stageResults = [];
    const len = raw.stageResults.size();
    for (let i = 0; i < len; i++) {
        const sr = raw.stageResults.get(i);
        stageResults.push({
            stageName:     sr.stageName,
            status:        sr.status,
            reason:        sr.reason,
            riskScore:     sr.riskScore,
            matchedRuleId: sr.matchedRuleId,
        });
    }

    // Expose getThreatLevel() as a method so audit-modal code stays the same
    const finalRiskScore = raw.finalRiskScore;
    const decision = {
        packet,                      // keep original packet reference
        allowed:        raw.allowed,
        action:         raw.action,
        finalRiskScore,
        verdictStage:   raw.verdictStage,
        verdictReason:  raw.verdictReason,
        stageResults,
        timestamp:      new Date(),
        getThreatLevel() {
            if (finalRiskScore >= 90) return { label: 'CRITICAL', color: 'text-rose-700 bg-rose-50 border-rose-300' };
            if (finalRiskScore >= 70) return { label: 'HIGH',     color: 'text-amber-700 bg-amber-50 border-amber-300' };
            if (finalRiskScore >= 35) return { label: 'MEDIUM',   color: 'text-blue-700 bg-blue-50 border-blue-300' };
            return                          { label: 'LOW',       color: 'text-emerald-700 bg-emerald-50 border-emerald-300' };
        },
    };

    return decision;
}

/**
 * Read the auto-ban counter accumulated inside the C++ engine since last reset.
 * Replaces the onAutoBan callback counter in App.jsx's handleAutoBan.
 */
export function getAutoBanCount() {
    return _engine ? _engine.getAutoBanCount() : 0;
}

/** Reset rate-limiter windows and reputation scores (e.g. when user clears rules). */
export function resetDynamicState() {
    if (_engine) _engine.resetDynamicState();
}
