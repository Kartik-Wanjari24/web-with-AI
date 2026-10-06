/**
 * useExtensionBridge — React hook  (refactored v1.1)
 *
 * Key fixes:
 *  - scannedCount is now read from chrome.storage.local directly and exposed
 *    as a first-class value (no more heuristic estimate).
 *  - chrome.storage.onChanged is used for real-time sync instead of relying
 *    solely on runtime message passing (more reliable when SW is sleeping).
 *  - onMessage listener is now registered unconditionally (not gated on
 *    isConnected) so detections that arrive before the first probe are caught.
 *  - Probe interval reduced to 5 s for snappier status badge updates.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// ---------------------------------------------------------------------------
// Chrome API guard
// ---------------------------------------------------------------------------
function getChromeRuntime() {
  try {
    return typeof chrome !== 'undefined' && chrome?.runtime?.id ? chrome : null;
  } catch {
    return null;
  }
}

function getChromeStorage() {
  try {
    return typeof chrome !== 'undefined' && chrome?.storage?.local ? chrome.storage : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Threat score map
// ---------------------------------------------------------------------------
const THREAT_SCORE_MAP = { CRITICAL: 95, HIGH: 75, MEDIUM: 50, LOW: 20 };

// ---------------------------------------------------------------------------
// Convert a raw extension event into a PipelineDecision-compatible object
// ---------------------------------------------------------------------------
function extensionEventToDecision(ev) {
  const riskScore = ev.riskScore ?? THREAT_SCORE_MAP[ev.threatLevel] ?? 20;
  return {
    id:             ev.id,
    timestamp:      new Date(ev.timestamp),
    source:         'chrome-extension',

    packet: {
      id:        ev.id,
      timestamp: ev.timestamp,
      srcIp:     ev.hostname,
      dstPort:   443,
      protocol:  ev.url?.startsWith('https') ? 'HTTPS' : 'HTTP',
      payload:   ev.url ?? '',
      length:    0,
      method:    'GET',
      path:      (() => { try { return new URL(ev.url).pathname; } catch { return '/'; } })(),
      geo:       'EXT',
    },

    allowed:        false,
    action:         'BLOCK',
    finalRiskScore: riskScore,
    verdictStage:   'Chrome Extension',
    verdictReason:  ev.reasons?.[0] ?? 'Suspicious URL detected by AdaptiveShield extension',

    stageResults: [{
      stageName:   'Chrome Extension Guard',
      status:      'BLOCK',
      reason:      ev.reasons?.join(' | ') ?? 'Flagged by extension heuristics',
      riskScore,
      matchedRule: null,
    }],

    getThreatLevel() {
      if (riskScore >= 90) return { label: 'CRITICAL', color: 'text-rose-700 bg-rose-50 border-rose-300' };
      if (riskScore >= 70) return { label: 'HIGH',     color: 'text-amber-700 bg-amber-50 border-amber-300' };
      if (riskScore >= 35) return { label: 'MEDIUM',   color: 'text-blue-700 bg-blue-50 border-blue-300' };
      return                      { label: 'LOW',      color: 'text-emerald-700 bg-emerald-50 border-emerald-300' };
    },
  };
}

// ---------------------------------------------------------------------------
// The hook
// ---------------------------------------------------------------------------
export function useExtensionBridge({ onNewDetection } = {}) {
  const [isConnected,     setIsConnected]     = useState(false);
  const [extensionEvents, setExtensionEvents] = useState([]);
  const [scannedCount,    setScannedCount]    = useState(0);
  const onNewDetectionRef = useRef(onNewDetection);
  onNewDetectionRef.current = onNewDetection;

  // ── 1. Probe service worker for connection status (every 5 s) ─────────────
  useEffect(() => {
    let cancelled = false;

    async function probe() {
      const cr = getChromeRuntime();
      if (!cr) { if (!cancelled) setIsConnected(false); return; }
      try {
        const resp = await cr.runtime.sendMessage({ type: 'PING' });
        if (!cancelled) setIsConnected(resp?.status === 'MONITORING');
      } catch {
        if (!cancelled) setIsConnected(false);
      }
    }

    probe();
    const id = setInterval(probe, 5000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  // ── 2. Load initial state directly from chrome.storage.local ─────────────
  //    Reading storage is more reliable than a message round-trip when the
  //    service worker may still be waking up.
  useEffect(() => {
    const cs = getChromeStorage();
    if (!cs) return;

    cs.local.get({ extensionEvents: [], scannedCount: 0 }).then(data => {
      setExtensionEvents(data.extensionEvents.map(extensionEventToDecision));
      setScannedCount(data.scannedCount);
    }).catch(() => {});
  }, [isConnected]); // re-run each time connection state changes

  // ── 3. Live sync via chrome.storage.onChanged ─────────────────────────────
  //    Fires whenever the SW writes new data — no polling required.
  useEffect(() => {
    const cs = getChromeStorage();
    if (!cs) return;

    function onStorageChanged(changes, area) {
      if (area !== 'local') return;

      if (changes.extensionEvents) {
        const newDecisions = (changes.extensionEvents.newValue ?? []).map(extensionEventToDecision);
        setExtensionEvents(newDecisions);
      }

      if (changes.scannedCount) {
        setScannedCount(changes.scannedCount.newValue ?? 0);
      }
    }

    cs.onChanged.addListener(onStorageChanged);
    return () => { try { cs.onChanged.removeListener(onStorageChanged); } catch { /* noop */ } };
  }, []);

  // ── 4. Real-time runtime message listener (for the popup channel) ─────────
  //    Registered unconditionally — doesn't wait for isConnected.
  useEffect(() => {
    const cr = getChromeRuntime();
    if (!cr) return;

    function onMessage(message) {
      if (message?.type !== 'EXTENSION_DETECTION') return;
      const decision = extensionEventToDecision(message.event);
      // Update local state immediately (storage.onChanged will confirm shortly)
      setExtensionEvents(prev => [decision, ...prev.slice(0, 199)]);
      setScannedCount(prev => prev + 1);
      if (onNewDetectionRef.current) onNewDetectionRef.current(decision);
    }

    cr.runtime.onMessage.addListener(onMessage);
    return () => { try { cr.runtime.onMessage.removeListener(onMessage); } catch { /* noop */ } };
  }, []); // mount-only, stable

  // ── 5. Clear helper ────────────────────────────────────────────────────────
  const clearEvents = useCallback(() => {
    const cr = getChromeRuntime();
    const cs = getChromeStorage();
    // Write directly to storage so onChanged fires and UI stays in sync
    if (cs) cs.local.set({ extensionEvents: [], scannedCount: 0 }).catch(() => {});
    // Also notify SW to reset its dedup map
    if (cr) cr.runtime.sendMessage({ type: 'CLEAR_EXTENSION_EVENTS' }).catch(() => {});
    setExtensionEvents([]);
    setScannedCount(0);
  }, []);

  return {
    isConnected,
    extensionEvents,
    scannedCount,
    clearEvents,
  };
}
