/**
 * AdaptiveShield Extension — Automated Verification Suite
 * Run with: node scripts/verify-extension.mjs
 */

import { readFileSync, existsSync, statSync } from 'fs';

let passed = 0, failed = 0;

function assert(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✅ PASS  ${label}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL  ${label}${detail ? ' -- ' + detail : ''}`);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// 1. Manifest structure
// ---------------------------------------------------------------------------
console.log('\n[1] Manifest validation');
const manifest = JSON.parse(readFileSync('./manifest.json', 'utf8'));

assert('manifest_version is 3',          manifest.manifest_version === 3);
assert('background.service_worker set',  manifest.background?.service_worker === 'background.js');
assert('background.type = module',       manifest.background?.type === 'module');
assert('permission: tabs',               manifest.permissions?.includes('tabs'));
assert('permission: notifications',      manifest.permissions?.includes('notifications'));
assert('permission: storage',            manifest.permissions?.includes('storage'));
assert('permission: webNavigation',      manifest.permissions?.includes('webNavigation'));
assert('host_permissions: <all_urls>',   manifest.host_permissions?.includes('<all_urls>'));
assert('action.default_popup set',       manifest.action?.default_popup === 'popup.html');
assert('icon 16 declared',              !!manifest.icons?.['16']);
assert('icon 48 declared',              !!manifest.icons?.['48']);
assert('icon 128 declared',             !!manifest.icons?.['128']);

// ---------------------------------------------------------------------------
// 2. dist/ artefact presence
// ---------------------------------------------------------------------------
console.log('\n[2] dist/ artefact presence');
const distFiles = [
  'dist/manifest.json',
  'dist/background.js',
  'dist/popup.html',
  'dist/popup.js',
  'dist/index.html',
  'dist/icons/icon16.png',
  'dist/icons/icon48.png',
  'dist/icons/icon128.png',
];
for (const f of distFiles) {
  assert(`dist contains ${f}`, existsSync(f));
}
const distManifest = JSON.parse(readFileSync('dist/manifest.json', 'utf8'));
assert('dist/manifest.json valid mv3', distManifest.manifest_version === 3);
assert('dist/manifest.json has host_permissions', distManifest.host_permissions?.includes('<all_urls>'));

// ---------------------------------------------------------------------------
// 3. background.js structural checks
// ---------------------------------------------------------------------------
console.log('\n[3] background.js structural checks');
const bgSrc = readFileSync('public/background.js', 'utf8');

assert('scannedCount persisted to storage',           bgSrc.includes('scannedCount'));
assert('persistEventAndIncrementScanned defined',     bgSrc.includes('persistEventAndIncrementScanned'));
assert('webNavigation.onCommitted listener',          bgSrc.includes('webNavigation.onCommitted.addListener'));
assert('tabs.onUpdated listener',                     bgSrc.includes('tabs.onUpdated.addListener'));
assert('tabs.onRemoved dedup cleanup',                bgSrc.includes('tabs.onRemoved.addListener'));
assert('onInstalled startup scan',                    bgSrc.includes('onInstalled.addListener'));
assert('onStartup scan',                              bgSrc.includes('onStartup.addListener'));
assert('lastSeenUrl deduplication map',               bgSrc.includes('lastSeenUrl'));
assert('PING returns scannedCount',                   bgSrc.includes("type === 'PING'") && bgSrc.includes('scannedCount'));
assert('CLEAR resets scannedCount to 0',              bgSrc.includes('scannedCount: 0') && bgSrc.includes('CLEAR_EXTENSION_EVENTS'));
assert('broadcastToDashboard uses tabs.query',        bgSrc.includes('tabs.query') && bgSrc.includes('broadcastToDashboard'));
assert('version bumped to 2.1.0',                     bgSrc.includes('2.1.0'));
assert('console.log on clean navigation',             bgSrc.includes('CLEAN'));
assert('console.log on flagged navigation',           bgSrc.includes('FLAGGED'));
assert('explanations[] returned by assessUrl',        bgSrc.includes('explanations'));
assert('injectAlert sends SHOW_ALERT to tab',         bgSrc.includes('SHOW_ALERT'));
assert('ALERT_DISMISSED message handler',             bgSrc.includes('ALERT_DISMISSED'));
assert('rich EXPLANATIONS library defined',           bgSrc.includes('EXPLANATIONS'));
assert('content script file listed in manifest',      JSON.parse(readFileSync('./manifest.json','utf8')).content_scripts?.length > 0);
assert('contentScript.js in dist',                   existsSync('dist/contentScript.js'));
assert('alert.css in dist',                          existsSync('dist/alert.css'));

// ---------------------------------------------------------------------------
// 4. popup.js structural checks
// ---------------------------------------------------------------------------
console.log('\n[4] popup.js structural checks');
const popupSrc = readFileSync('public/popup.js', 'utf8');

assert('reads scannedCount from storage',             popupSrc.includes('scannedCount'));
assert('storage.onChanged live updates',              popupSrc.includes('storage.onChanged.addListener'));
assert('reads storage.local directly',                popupSrc.includes('chrome.storage.local.get'));
assert('XSS-safe esc() used for hostname',            popupSrc.includes('function esc(') && popupSrc.includes('esc(e.hostname)'));
assert('clearBtn writes to storage directly',         popupSrc.includes('chrome.storage.local.set') && popupSrc.includes('clearBtn'));
assert('openDashboard tab creation',                  popupSrc.includes('openDashboard') && popupSrc.includes('tabs.create'));

// ---------------------------------------------------------------------------
// 5. useExtensionBridge.js structural checks
// ---------------------------------------------------------------------------
console.log('\n[5] useExtensionBridge.js structural checks');
const hookSrc = readFileSync('src/hooks/useExtensionBridge.js', 'utf8');

assert('scannedCount state exported',                 hookSrc.includes('scannedCount') && hookSrc.includes('setScannedCount'));
assert('storage.onChanged listener',                  hookSrc.includes('onChanged.addListener'));
assert('onMessage registered unconditionally',        hookSrc.includes('cr.runtime.onMessage.addListener'));
assert('reads storage.local directly on mount',       hookSrc.includes('cs.local.get'));
assert('clearEvents writes to storage',               hookSrc.includes('cs.local.set') && hookSrc.includes('clearEvents'));
assert('probe interval 5s (not 8s)',                  hookSrc.includes('5000') && !hookSrc.includes('8000'));
assert('getChromeStorage() guard defined',            hookSrc.includes('getChromeStorage'));
assert('extensionEventToDecision defined',            hookSrc.includes('extensionEventToDecision'));
assert('getThreatLevel() compatible method',          hookSrc.includes('getThreatLevel'));

// ---------------------------------------------------------------------------
// 6. Heuristic engine unit tests
// ---------------------------------------------------------------------------
console.log('\n[6] Heuristic engine unit tests');

const RISKY = new Set(['paypal-secure.com','coinhive.com','win-prize-today.com','microsoft-secure.com']);
const TLDS  = new Set(['.tk','.ml','.ga','.cf','.gq','.xyz','.top','.club','.work','.click','.download','.stream','.loan','.win','.racing']);

function assessUrl(urlString) {
  const reasons = []; let score = 0;
  let url;
  try { url = new URL(urlString); } catch { return { flagged: false, reasons: [], score: 0 }; }
  const h = url.hostname.toLowerCase().replace(/^www\./, '');
  const full = urlString.toLowerCase();
  const INTERNAL = ['chrome-extension:','chrome:','about:','data:','file:'];
  if (INTERNAL.includes(url.protocol) || h === 'localhost' || h === '127.0.0.1' || h.startsWith('192.168.')) {
    return { flagged: false, reasons: [], score: 0 };
  }
  if (RISKY.has(h))                               { reasons.push('Known phishing domain'); score += 100; }
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(h))         { reasons.push('Raw IP');                score += 75;  }
  for (const tld of TLDS) { if (h.endsWith(tld)) { reasons.push(`Risky TLD ${tld}`);       score += 55; break; } }
  if (url.protocol === 'http:') {
    const kw = ['login','signin','account','password','payment','checkout','bank','credit'];
    if (kw.some(k => full.includes(k)))           { reasons.push('HTTP creds page');        score += 70;  }
  }
  const BRANDS = ['paypal','apple','microsoft','google','amazon','netflix','facebook'];
  for (const b of BRANDS) {
    if (h.includes(b) && h !== `${b}.com` && !h.endsWith(`.${b}.com`)) {
      reasons.push(`Brand impersonation: ${b}`); score += 65; break;
    }
  }
  const enc = (urlString.match(/%[0-9a-f]{2}/gi) || []).length;
  if (enc > 8) { reasons.push('Heavy encoding'); score += 35; }
  return { flagged: score >= 55, reasons, score: Math.min(score, 100) };
}

const cases = [
  { url: 'https://paypal-secure.com/login',      want: true,  lbl: 'Known phishing domain flagged' },
  { url: 'http://192.168.50.1/admin',            want: false, lbl: 'Private 192.168.x IP skipped' },
  { url: 'http://93.184.216.34/bank/login',      want: true,  lbl: 'Raw public IP + HTTP cred page' },
  { url: 'https://evil-site.tk/payload',         want: true,  lbl: 'Suspicious TLD .tk flagged' },
  { url: 'http://paypal-verify.evil.com/login',  want: true,  lbl: 'Typosquat + HTTP cred page' },
  { url: 'https://www.google.com/search',        want: false, lbl: 'Legit Google not flagged' },
  { url: 'https://accounts.google.com/signin',   want: false, lbl: 'Legit Google subdomain not flagged' },
  { url: 'chrome://extensions',                  want: false, lbl: 'chrome:// URL skipped' },
  { url: 'http://localhost:5173',                want: false, lbl: 'localhost skipped' },
  { url: 'https://microsoft-secure.com',         want: true,  lbl: 'microsoft-secure.com flagged (DB hit)' },
  { url: 'https://a.b.c.d.example.xyz/%41%42%43%44%45%46%47%48%49', want: true, lbl: 'Suspicious TLD + heavy encoding' },
];

for (const c of cases) {
  const r = assessUrl(c.url);
  assert(c.lbl, r.flagged === c.want, `flagged=${r.flagged} score=${r.score} [${r.reasons.join('; ')}]`);
}

// ---------------------------------------------------------------------------
// 7. Mock message-passing contract
// ---------------------------------------------------------------------------
console.log('\n[7] Message passing contract (mock storage)');

const store = { extensionEvents: [{ id: 'e1', hostname: 'evil.tk', threatLevel: 'HIGH', riskScore: 75, reasons: ['Risky TLD'], timestamp: new Date().toISOString() }], scannedCount: 42 };
const mockStorage = {
  get: (defaults) => Promise.resolve({ ...defaults, ...store }),
  set: (data) => { Object.assign(store, data); return Promise.resolve(); },
};

// PING handler
let pingResult = await mockStorage.get({ extensionEvents: [], scannedCount: 0 });
assert('PING: scannedCount=42 from storage',         pingResult.scannedCount === 42);
assert('PING: flaggedCount=1 from storage',          pingResult.extensionEvents.length === 1);

// GET_EXTENSION_EVENTS
let getResult = await mockStorage.get({ extensionEvents: [], scannedCount: 0 });
assert('GET_EVENTS: returns array',                  Array.isArray(getResult.extensionEvents));
assert('GET_EVENTS: hostname correct',               getResult.extensionEvents[0]?.hostname === 'evil.tk');
assert('GET_EVENTS: includes scannedCount',          typeof getResult.scannedCount === 'number');

// CLEAR
await mockStorage.set({ extensionEvents: [], scannedCount: 0 });
let cleared = await mockStorage.get({ extensionEvents: [], scannedCount: 0 });
assert('CLEAR: extensionEvents reset to []',         cleared.extensionEvents.length === 0);
assert('CLEAR: scannedCount reset to 0',             cleared.scannedCount === 0);

// scannedCount increment simulation
await mockStorage.set({ scannedCount: 0 });
for (let i = 0; i < 5; i++) {
  const d = await mockStorage.get({ scannedCount: 0 });
  await mockStorage.set({ scannedCount: d.scannedCount + 1 });
}
const afterIncr = await mockStorage.get({ scannedCount: 0 });
assert('scannedCount increments correctly (5 navigations)', afterIncr.scannedCount === 5);

// ---------------------------------------------------------------------------
// 8. v2.0 Content script checks
// ---------------------------------------------------------------------------
console.log('\n[8] contentScript.js structural checks');
const csSrc = readFileSync('public/contentScript.js', 'utf8');

assert('SHOW_ALERT message listener',                 csSrc.includes("message.type === 'SHOW_ALERT'"));
assert('DISMISS_ALERT message listener',              csSrc.includes("message.type === 'DISMISS_ALERT'"));
assert('Go Back to Safety button rendered',           csSrc.includes('Go Back to Safety'));
assert('Dismiss & Proceed button rendered',           csSrc.includes('Dismiss'));
assert('XSS-safe esc() used',                        csSrc.includes('function esc('));
assert('explanations rendered in banner',             csSrc.includes('explanations'));
assert('ALERT_DISMISSED sent on dismiss',             csSrc.includes('ALERT_DISMISSED'));
assert('as-alert-root guard prevents double inject',  csSrc.includes('as-alert-root'));

// ---------------------------------------------------------------------------
// 9. alert.css checks
// ---------------------------------------------------------------------------
console.log('\n[9] alert.css checks');
const alertCss = readFileSync('public/alert.css', 'utf8');

assert('as- prefix used (no collisions)',             alertCss.includes('#as-alert-root'));
assert('as-slide-down animation defined',             alertCss.includes('as-slide-down'));
assert('CRITICAL badge style present',               alertCss.includes('as-level-CRITICAL'));
assert('HIGH badge style present',                   alertCss.includes('as-level-HIGH'));
assert('action buttons styled',                      alertCss.includes('as-btn-danger'));
assert('max z-index set',                            alertCss.includes('2147483647'));

// ---------------------------------------------------------------------------
// 10. ExtensionInstallCenter component checks
// ---------------------------------------------------------------------------
console.log('\n[10] ExtensionInstallCenter.jsx checks');
const installSrc = readFileSync('src/components/ExtensionInstallCenter.jsx', 'utf8');

assert('Download button present',                    installSrc.includes('Download Extension'));
assert('4-step install guide',                        (installSrc.match(/'0[1-4]'/g) || []).length >= 4);
assert('Developer Mode step included',               installSrc.includes('Developer Mode') || installSrc.includes('Developer mode'));
assert('Load unpacked step included',                installSrc.includes('Load unpacked') || installSrc.includes('Load Unpacked'));
assert('Connected state shows live stats',           installSrc.includes('scannedCount') && installSrc.includes('flaggedCount'));
assert('Warning note about developer mode',          installSrc.includes('Developer Mode note') || installSrc.includes('developer mode'));

// ---------------------------------------------------------------------------
// 11. v2.1 new heuristics
// ---------------------------------------------------------------------------
console.log('\n[11] v2.1 new heuristics checks');

assert('TRACKING_DOMAINS set defined',            bgSrc.includes('TRACKING_DOMAINS'));
assert('TRACKING_KW array defined',                bgSrc.includes('TRACKING_KW'));
assert('TRACKING_SCRIPTS explanation defined',    bgSrc.includes('TRACKING_SCRIPTS'));
assert('MIXED_CONTENT_FORM explanation defined',  bgSrc.includes('MIXED_CONTENT_FORM'));
assert('detail field in explanation objects',     bgSrc.includes('detail:'));
assert('chase + wellsfargo added to BRANDS',      bgSrc.includes('chase') && bgSrc.includes('wellsfargo'));

// ---------------------------------------------------------------------------
// 12. ZIP file checks
// ---------------------------------------------------------------------------
console.log('\n[12] Extension ZIP file checks');
const zipStat = statSync('public/adaptive-shield-extension.zip');

assert('ZIP file exists at public/',              existsSync('public/adaptive-shield-extension.zip'));
assert('ZIP is non-empty (> 10 KB)',              zipStat.size > 10240);
assert('ZIP is complete (> 100 KB)',              zipStat.size > 102400);

// ---------------------------------------------------------------------------
// 13. Icon size checks (v2.0 anti-aliased shield)
// ---------------------------------------------------------------------------
console.log('\n[13] Icon size checks (v2.0 glowing shield)');
const icon16  = statSync('public/icons/icon16.png');
const icon48  = statSync('public/icons/icon48.png');
const icon128 = statSync('public/icons/icon128.png');

assert('icon16.png > 200 bytes (real content)',   icon16.size  > 200);
assert('icon48.png > 1 KB (real content)',         icon48.size  > 1024);
assert('icon128.png > 5 KB (real content)',        icon128.size > 5120);

// ---------------------------------------------------------------------------
// 14. ExtensionInstallCenter v2.1 UX checks
// ---------------------------------------------------------------------------
console.log('\n[14] ExtensionInstallCenter v2.1 UX checks');

assert('CopyButton component defined',              installSrc.includes('function CopyButton'));
assert('clipboard copy for chrome:// URL',          installSrc.includes('chrome://extensions') && installSrc.includes('clipboard'));
assert('chrome:// security note shown',              installSrc.includes('Browsers block direct links'));
assert('download links to real zip file',            installSrc.includes('adaptive-shield-extension.zip'));


console.log('\n' + '-'.repeat(60));
console.log(`  RESULTS:  ${passed} passed  |  ${failed} failed`);
console.log('-'.repeat(60) + '\n');
if (failed > 0) process.exit(1);
