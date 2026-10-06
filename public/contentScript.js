/**
 * AdaptiveShield — contentScript.js  (v2.1)
 *
 * Renders a full "Why This Website Was Flagged" breakdown including
 * the new `detail` field from the v2.1 explanation objects.
 */

(function () {
  'use strict';

  if (document.getElementById('as-alert-root')) return;

  let currentRoot = null;

  function esc(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function levelEmoji(level) {
    return { CRITICAL: '🚨', HIGH: '⚠️', MEDIUM: '⚡' }[level] || '⚠️';
  }

  function buildExplanationHtml(explanations) {
    if (!explanations || explanations.length === 0) return '';

    return `
      <div class="as-flagged-title">Why This Website Was Flagged Red</div>
      ${explanations.slice(0, 4).map((ex, i) => `
        <div class="as-reason-item${i > 0 ? ' as-reason-extra' : ''}">
          <p class="as-reason-title">🔍 ${esc(ex.what)}</p>
          <p class="as-reason-why"><strong>Risk:</strong> ${esc(ex.why)}</p>
          ${ex.detail ? `<p class="as-reason-detail">${esc(ex.detail)}</p>` : ''}
          <p class="as-reason-action">✅ <strong>What to do:</strong> ${esc(ex.action)}</p>
        </div>
      `).join('')}
      ${explanations.length > 1 ? `
        <button class="as-toggle-btn" id="as-toggle-reasons">
          + ${explanations.length - 1} more reason${explanations.length > 2 ? 's' : ''} — click to expand
        </button>
      ` : ''}
    `;
  }

  function showAlert(data) {
    dismissAlert();

    const root = document.createElement('div');
    root.id = 'as-alert-root';

    const { hostname, threatLevel, riskScore, explanations = [], url } = data;

    root.innerHTML = `
      <div class="as-banner">
        <div class="as-banner-inner">
          <div class="as-header">
            <span class="as-icon">${levelEmoji(threatLevel)}</span>
            <div class="as-title-group">
              <p class="as-title">AdaptiveShield Security Warning — Dangerous Site Blocked</p>
              <p class="as-subtitle">${esc(hostname)} · Risk Score: ${riskScore}/100</p>
            </div>
            <span class="as-level-badge as-level-${esc(threatLevel)}">${esc(threatLevel)}</span>
          </div>

          <div class="as-reasons">
            ${buildExplanationHtml(explanations)}
          </div>

          <div class="as-actions">
            <button class="as-btn as-btn-danger" id="as-go-back">
              ← Go Back to Safety
            </button>
            <button class="as-btn as-btn-ghost" id="as-dismiss">
              Dismiss &amp; Proceed at Your Own Risk
            </button>
          </div>

          <p class="as-url-display">Flagged: ${esc(url)}</p>
        </div>
      </div>
    `;

    document.documentElement.insertBefore(root, document.documentElement.firstChild);
    currentRoot = root;

    if (document.body) document.body.style.paddingTop = (root.offsetHeight + 8) + 'px';

    // Toggle extra reasons
    const toggleBtn = root.querySelector('#as-toggle-reasons');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const extras = root.querySelectorAll('.as-reason-extra');
        const open = toggleBtn.dataset.open === '1';
        extras.forEach(el => el.style.display = open ? 'none' : 'block');
        toggleBtn.textContent = open
          ? `+ ${extras.length} more reason${extras.length > 1 ? 's' : ''} — click to expand`
          : '− Show less';
        toggleBtn.dataset.open = open ? '0' : '1';
      });
      // Hide extras initially
      root.querySelectorAll('.as-reason-extra').forEach(el => el.style.display = 'none');
    }

    root.querySelector('#as-go-back').addEventListener('click', () => {
      if (window.history.length > 1) window.history.back();
      else window.close();
      dismissAlert();
    });

    root.querySelector('#as-dismiss').addEventListener('click', () => {
      dismissAlert();
      chrome.runtime.sendMessage({ type: 'ALERT_DISMISSED', url });
    });
  }

  function dismissAlert() {
    if (currentRoot) { currentRoot.remove(); currentRoot = null; }
    const ex = document.getElementById('as-alert-root');
    if (ex) ex.remove();
    if (document.body) document.body.style.paddingTop = '';
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'SHOW_ALERT')    { showAlert(message.data); sendResponse({ ok: true }); return false; }
    if (message.type === 'DISMISS_ALERT') { dismissAlert();          sendResponse({ ok: true }); return false; }
  });
})();
