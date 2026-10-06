/**
 * ExtensionStatusBadge — shows live extension connection state in the Navbar.
 *
 * Props:
 *   isConnected    {boolean}  — whether the extension SW is reachable
 *   eventCount     {number}   — number of flagged detection events
 *   scannedCount   {number}   — total URLs scanned this session (from storage)
 */

import React from 'react';
import { Radio, ShieldOff } from 'lucide-react';

export default function ExtensionStatusBadge({ isConnected, eventCount = 0, scannedCount = 0 }) {
  if (isConnected) {
    return (
      <div
        className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl
                   bg-emerald-950/60 border border-emerald-700/50 text-emerald-400
                   text-[10px] font-mono font-semibold select-none"
        title={`AdaptiveShield Extension active — ${scannedCount} URLs scanned, ${eventCount} flagged`}
      >
        <Radio className="w-3 h-3 animate-pulse" />
        EXT · {scannedCount} scanned · {eventCount} flagged
      </div>
    );
  }

  return (
    <div
      className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl
                 bg-slate-900/60 border border-slate-700/50 text-slate-500
                 text-[10px] font-mono font-semibold select-none cursor-help"
      title="Chrome Extension not detected — install AdaptiveShield Extension and load this page inside Chrome"
    >
      <ShieldOff className="w-3 h-3" />
      EXT · offline
    </div>
  );
}
