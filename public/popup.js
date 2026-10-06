/**
 * AdaptiveShield — popup.js  (v2.0)
 *
 * New in v2.0:
 *  - Renders full plain-English explanations (what/why/action) per detection
 *  - Expandable event cards with detail panel
 *  - Version badge bumped to 2.0
 */

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000)   return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function levelEmoji(level) {
  return { CRITICAL: '🚨', HIGH: '⚠️', MEDIUM: '⚡', LOW: 'ℹ️' }[level] || '⚠️';
}

function explanationsHtml(explanations) {
  if (!explanations || explanations.length === 0) return '';
  return explanations.map((ex, i) => `
    <div class="explanation ${i > 0 ? 'explanation--extra hidden' : ''}">
      <p class="ex-what">🔍 ${esc(ex.what)}</p>
      <p class="ex-why">${esc(ex.why)}</p>
      <p class="ex-action">✅ ${esc(ex.action)}</p>
    </div>
  `).join('');
}

function renderEvents(events) {
  const list = document.getElementById('eventList');
  if (!events || events.length === 0) {
    list.innerHTML = '<div class="empty">No threats detected yet — browsing securely.</div>';
    return;
  }
  list.innerHTML = events.slice(0, 15).map((e, idx) => {
    const hasMore = (e.explanations?.length ?? 0) > 1;
    return `
    <div class="event-card" data-idx="${idx}">
      <div class="event-header">
        <span class="event-icon">${levelEmoji(e.threatLevel)}</span>
        <div class="event-meta">
          <span class="event-host">${esc(e.hostname)}</span>
          <span class="event-time">${timeAgo(e.timestamp)}</span>
        </div>
        <span class="event-badge badge-${esc(e.threatLevel)}">${esc(e.threatLevel)}</span>
      </div>
      <div class="event-detail">
        ${explanationsHtml(e.explanations || (e.reasons || []).map(r => ({ what: r, why: '', action: '' })))}
        ${hasMore ? `<button class="show-more-btn" data-idx="${idx}">+ ${e.explanations.length - 1} more reason${e.explanations.length > 2 ? 's' : ''}</button>` : ''}
      </div>
    </div>`;
  }).join('');

  // Wire up "show more" toggles
  list.querySelectorAll('.show-more-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const card  = btn.closest('.event-card');
      const extras = card.querySelectorAll('.explanation--extra');
      const open   = btn.dataset.open === '1';
      extras.forEach(el => el.classList.toggle('hidden', open));
      btn.textContent = open
        ? `+ ${extras.length} more reason${extras.length > 1 ? 's' : ''}`
        : '− Show less';
      btn.dataset.open = open ? '0' : '1';
    });
  });
}

function setCounters(scanned, flagged, crit) {
  document.getElementById('totalCount').textContent   = scanned;
  document.getElementById('flaggedCount').textContent = flagged;
  document.getElementById('critCount').textContent    = crit;
}

async function init() {
  const badge = document.getElementById('statusBadge');

  // 1. Ping service worker
  try {
    const pong = await chrome.runtime.sendMessage({ type: 'PING' });
    if (pong?.status === 'MONITORING') {
      badge.textContent = `● v${pong.version || '2.0'} · Monitoring`;
      badge.className   = 'badge active';
    } else {
      badge.textContent = '● Active';
      badge.className   = 'badge active';
    }
  } catch {
    badge.textContent = 'Offline';
    badge.className   = 'badge loading';
  }

  // 2. Load from storage directly (resilient to SW sleep)
  const stored       = await chrome.storage.local.get({ extensionEvents: [], scannedCount: 0 });
  const events       = stored.extensionEvents;
  const scannedCount = stored.scannedCount;
  const critCount    = events.filter(e => e.threatLevel === 'CRITICAL' || e.threatLevel === 'HIGH').length;

  setCounters(scannedCount, events.length, critCount);
  renderEvents(events);

  // 3. Live updates via storage.onChanged
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    const newEvents  = changes.extensionEvents?.newValue ?? events;
    const newScanned = changes.scannedCount?.newValue    ?? scannedCount;
    const newCrit    = newEvents.filter(e => e.threatLevel === 'CRITICAL' || e.threatLevel === 'HIGH').length;
    setCounters(newScanned, newEvents.length, newCrit);
    renderEvents(newEvents);
  });
}

// Clear button
document.getElementById('clearBtn').addEventListener('click', async () => {
  await chrome.storage.local.set({ extensionEvents: [], scannedCount: 0 });
  chrome.runtime.sendMessage({ type: 'CLEAR_EXTENSION_EVENTS' }).catch(() => {});
});

// Open dashboard
document.getElementById('openDashboard').addEventListener('click', () => {
  chrome.tabs.create({ url: 'http://localhost:5173' });
});

init();
