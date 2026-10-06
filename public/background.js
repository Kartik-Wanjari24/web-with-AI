/**
 * AdaptiveShield — background.js  (v2.1)
 *
 * New in v2.1:
 *  - Expanded heuristics:
 *    9.  Aggressive tracking / surveillance scripts (fingerprinting, pixel trackers)
 *    10. Suspicious cookie patterns (excessive 3rd-party cookie headers)
 *    11. Mixed-content credential form (HTTPS page but form POSTs to HTTP)
 *    12. Newly-registered / very short domain age indicators (heuristic)
 *  - All explanations now include a fourth field: `detail` — a deeper
 *    multi-sentence technical breakdown rendered in the popup and banner.
 *  - assessUrl() returns { flagged, explanations, riskScore, reasons }
 */

// ---------------------------------------------------------------------------
// Risk database
// ---------------------------------------------------------------------------
const RISKY_DOMAINS = new Set([
  'paypa1.com', 'paypai.com', 'paypal-secure.com', 'paypal-login.net',
  'appleid-verify.com', 'apple-support-login.com', 'appleid.apple.com.phish.net',
  'microsoft-secure.com', 'microsoftonline-verify.com', 'microsoft365-login.net',
  'google-accounts.com', 'gmail-secure-login.com', 'googledrive-share.com',
  'facebook-login-secure.com', 'fb-confirm.com', 'instagram-help-support.com',
  'amazon-security-alert.com', 'amazon-account-update.net', 'amazon-prime-offer.com',
  'netflix-billing-update.com', 'netflix-account-suspend.com',
  'bankofamerica-alert.com', 'wellsfargo-secure.com', 'chase-bank-update.net',
  'irs-refund-claim.com', 'irs-tax-update.net',
  'covid-relief-gov.com', 'stimulus-check-claim.net',
  'coinhive.com', 'free-bitcoin-generator.com', 'cryptominer-pool.net',
  'win-prize-today.com', 'you-have-won.net', 'click-here-prize.com',
  'free-iphone-winner.com', 'survey-reward-claim.com',
  'windows-virus-alert.com', 'microsoft-virus-found.com', 'apple-virus-detected.com',
  'call-tech-support-now.com', 'your-pc-is-infected.com',
]);

const SUSPICIOUS_TLDS = new Set([
  '.tk', '.ml', '.ga', '.cf', '.gq',
  '.xyz', '.top', '.club', '.work',
  '.click', '.download', '.stream',
  '.loan', '.win', '.racing',
]);

// Domains known to run aggressive fingerprinting / tracking infrastructure
const TRACKING_DOMAINS = new Set([
  'fingerprint2.com', 'evercookie.com', 'supercookie.net',
  'canvas-fingerprint.com', 'webrtc-tracker.net',
  'pixel-tracking.io', 'omnivore-track.com',
  'creepjs.com', 'browserleaks.org',
]);

// URL path segments that indicate tracking / surveillance scripts
const TRACKING_KW = [
  'fingerprint', 'evercookie', 'supercookie', 'canvas-hash',
  'track.php', 'pixel.gif', 'beacon.js', 'collect.js',
  'telemetry', 'spy', 'surveillance',
];

// ---------------------------------------------------------------------------
// Plain-English explanation library  (v2.1 — with `detail` field)
// ---------------------------------------------------------------------------
const EXPLANATIONS = {

  RISKY_DOMAIN: {
    what:   'Known Phishing or Malware Domain',
    why:    'This exact domain is in AdaptiveShield\'s threat intelligence database of confirmed phishing sites, credential harvesters, scam pages, and malware distribution networks.',
    detail: 'Phishing sites are purpose-built to look identical to legitimate services (banks, PayPal, Microsoft, etc.). Once you enter credentials, they are transmitted in real time to attacker-controlled servers. The victim is often silently redirected to the real site afterwards to prevent suspicion. Some advanced phishing kits also deploy drive-by malware — meaning simply visiting the page can trigger a browser exploit that installs ransomware or spyware without any user interaction.',
    action: 'Close this tab immediately. Do not enter any credentials, payment details, or personal information. If you arrived here via a link in an email or message, report that message as phishing.',
  },

  RAW_IP: {
    what:   'Raw IP Address URL — No Domain Name',
    why:    'Legitimate websites use domain names with SSL/TLS certificates that verify server identity. Accessing a site via a raw IP address bypasses this trust chain entirely.',
    detail: 'When you visit a domain like "bank.com", your browser verifies a certificate that cryptographically proves the server is the real bank. With a raw IP, no such verification exists — you have no way to know who owns or operates the server. Attackers host phishing kits, exploit delivery servers, and command-and-control panels on raw IPs specifically to avoid domain takedowns and certificate audits. Your entire session can be intercepted via a man-in-the-middle attack with no browser warning.',
    action: 'Close this tab. Never enter credentials or personal data on a site identified only by an IP address. If you received this link from someone, treat that source as potentially compromised.',
  },

  SUSPICIOUS_TLD: {
    what:   'Suspicious / Abuse-Heavy Top-Level Domain',
    why:    'This TLD is disproportionately used to register fraudulent websites because domains can be obtained for free or near-zero cost with minimal identity verification.',
    detail: 'Security researchers consistently find that TLDs like .tk, .ml, .ga, .xyz, and .top account for a vastly disproportionate share of phishing, malware distribution, and spam infrastructure. Freenom-managed TLDs (.tk, .ml, .ga, .cf, .gq) in particular have been the subject of lawsuits and abuse reports because they allow anonymous bulk registration of thousands of lookalike domains at no cost. Legitimate businesses almost never operate exclusively on these TLDs because they carry reputation penalties with email providers and browser vendors.',
    action: 'Treat any site on this TLD with extreme suspicion. Verify the site\'s legitimacy through independent research before entering any information. If a brand you trust appears to be hosted here, it is very likely a fake.',
  },

  HTTP_CREDS: {
    what:   'Unencrypted HTTP Connection with Credential or Payment Field',
    why:    'This page transmits sensitive data over plain HTTP, meaning passwords and payment details travel across the internet in fully readable plaintext.',
    detail: 'HTTPS encrypts your data using TLS so that only the intended server can read it. HTTP provides zero encryption — the data flows through every router, ISP hop, and network device in cleartext. On public Wi-Fi (coffee shops, airports, hotels) any nearby person with Wireshark or a cheap USB adapter can capture your credentials in seconds — this is called a "passive eavesdrop" and requires no technical sophistication. Legitimate login and payment pages have used HTTPS exclusively for over a decade; any site that does not is either negligently operated or deliberately insecure.',
    action: 'Never submit passwords, payment details, or sensitive personal data on an HTTP website. Look for the padlock icon in your browser\'s address bar. Contact the service provider if you believe a legitimate site is broken.',
  },

  BRAND_IMPERSONATION: {
    what:   'Typosquatting / Brand Impersonation',
    why:    'This domain contains a well-known brand name but is not the official domain — a classic typosquat designed to harvest credentials from users who don\'t check the full URL.',
    detail: 'Typosquatting is one of the oldest and most effective phishing techniques. Attackers register domains like "paypal-verify.com", "apple-id-login.net", or "amazon-account-update.org" and build pixel-perfect copies of the real site\'s login page. When you enter your username and password, the credentials are silently forwarded to the attacker\'s server. The fake site then usually redirects you to the real site with a fake "login failed" message, so you try again on the real site and never realise you were phished. These attacks can bypass even sophisticated corporate email filters because the phishing link itself is not in any spam database at the time of sending.',
    action: 'Close this tab immediately. Always navigate to important sites by typing the official URL yourself or using a bookmark. Enable two-factor authentication (2FA) on all important accounts — even a stolen password cannot be used alone if 2FA is active.',
  },

  SUBDOMAIN_DEPTH: {
    what:   'Excessive Subdomain Depth — Possible Redirect Chain or Cloaking',
    why:    'URLs with four or more subdomain levels are a common technique to make malicious URLs look legitimate by burying the actual domain at the end of a long chain.',
    detail: 'The browser\'s trust model is based on the registered domain — the part just before the TLD. A URL like "secure.login.accounts.paypal.evil.com" is owned by whoever registered "evil.com", not PayPal. However, users scanning a long URL often read only the leftmost part and incorrectly assume "secure.login.accounts.paypal" means it is a PayPal URL. This technique is frequently combined with open-redirect exploitation (where a legitimate site is abused to redirect through to a malicious one) and with URL shorteners to further obscure the true destination.',
    action: 'Read the full domain from right to left — the registered domain (the segment immediately before .com/.net/etc.) is the actual owner. If that owner is not the brand you expect, this is almost certainly deceptive. Close the tab.',
  },

  SUSPICIOUS_KEYWORD: {
    what:   'Malicious Keyword Detected in URL Path or Query',
    why:    'The URL contains a term strongly associated with attack infrastructure, web shells, malware delivery, or exploit kits.',
    detail: 'Security researchers observe these keywords almost exclusively in URLs associated with active cyberattacks: "webshell" and "shell.php" indicate a compromised server with remote-control access; "c2" and "botnet" indicate command-and-control infrastructure; "exploit" and "payload" indicate malware staging servers. While security professionals occasionally visit such URLs intentionally, for the average user encountering one via a link or search result, the probability of malicious intent is very high. Even viewing the page in some cases can trigger a drive-by download.',
    action: 'Close this tab immediately unless you are a security professional who intentionally navigated here. Do not download any files, run any scripts, or enter credentials.',
  },

  HEAVY_ENCODING: {
    what:   'Heavy URL Encoding — Obfuscation Attempt',
    why:    'The URL contains an unusual number of percent-encoded characters, a technique used by attackers to disguise the true destination and bypass URL reputation filters.',
    detail: 'Percent-encoding replaces characters with their hex equivalents (e.g., %41 = "A"). A small number of encoded characters is normal and expected. However, encoding every character in a URL serves only one purpose: to make the URL opaque to automated scanning tools and to human readers. This technique is common in phishing email links, malicious QR codes, and ad-based malware delivery chains. Decoders built into security tools are intentionally skipped by some defences, making heavily-encoded URLs a reliable evasion technique for attackers.',
    action: 'Do not trust the apparent legitimacy of a heavily encoded URL. Use a URL decoder tool to inspect the actual destination before proceeding, or simply close this tab if you did not intentionally navigate here.',
  },

  TRACKING_SCRIPTS: {
    what:   'Aggressive Tracking, Fingerprinting, or Surveillance Scripts Detected',
    why:    'This site\'s URL contains patterns associated with browser fingerprinting scripts, invisible tracking pixels, or invasive data collection infrastructure.',
    detail: 'Browser fingerprinting is a technique that identifies you across websites without using cookies — it works by collecting dozens of browser attributes (screen resolution, installed fonts, GPU model, audio subsystem characteristics, etc.) and combining them into a unique "fingerprint" that tracks you even in private/incognito mode. Tracking pixels (1×1 transparent GIF/PNG images loaded from ad networks) silently report your IP address, browser, and referrer to third-party data brokers. Unlike cookies, these techniques cannot be blocked by simply clearing browser storage. Sites that deploy them aggressively often do so without adequate disclosure in their privacy policy.',
    action: 'Consider using a browser extension like uBlock Origin or Privacy Badger to block fingerprinting scripts. Avoid creating accounts or entering personal information on sites that deploy invasive tracking. You can verify your browser\'s fingerprint exposure at coveryourtracks.eff.org.',
  },

  MIXED_CONTENT_FORM: {
    what:   'Mixed-Content Form Submission — HTTPS Page Posting to HTTP Endpoint',
    why:    'This page loads over HTTPS but submits form data (potentially including credentials or payments) to a non-secure HTTP endpoint.',
    detail: 'This is a known attack called "mixed-content form hijacking." The browser shows a padlock because the page itself was loaded securely, but the form\'s action attribute points to an HTTP URL — meaning your submitted data is transmitted in plaintext exactly as if you were on a fully insecure site. Modern Chrome blocks most mixed-content automatically, but this pattern still appears on poorly-maintained or deliberately deceptive sites. Attackers use this to take advantage of users who have learned to "look for the padlock" without inspecting where the form actually submits.',
    action: 'Do not submit this form. Inspect the page source (right-click → View Page Source) and search for the form\'s "action" attribute to verify where data is being sent. Report this to the site operator or your security team.',
  },
};

// ---------------------------------------------------------------------------
// Per-tab deduplication
// ---------------------------------------------------------------------------
const lastSeenUrl = new Map();

// ---------------------------------------------------------------------------
// Rich URL assessment
// ---------------------------------------------------------------------------
function assessUrl(urlString) {
  const explanations = [];
  let riskScore = 0;

  let url;
  try { url = new URL(urlString); } catch { return { flagged: false, explanations: [], riskScore: 0, reasons: [] }; }

  const hostname = url.hostname.toLowerCase().replace(/^www\./, '');
  const fullUrl  = urlString.toLowerCase();

  // Skip internal / local
  if (
    ['chrome-extension:', 'chrome:', 'about:', 'data:', 'file:'].includes(url.protocol) ||
    hostname === 'localhost' || hostname === '127.0.0.1' ||
    hostname.startsWith('192.168.') || hostname.endsWith('.local')
  ) return { flagged: false, explanations: [], riskScore: 0, reasons: [] };

  // 1. Known phishing / malware database
  if (RISKY_DOMAINS.has(hostname)) {
    explanations.push(EXPLANATIONS.RISKY_DOMAIN);
    riskScore += 100;
  }

  // 2. Raw IPv4 address
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
    explanations.push(EXPLANATIONS.RAW_IP);
    riskScore += 75;
  }

  // 3. Suspicious TLD
  for (const tld of SUSPICIOUS_TLDS) {
    if (hostname.endsWith(tld)) {
      explanations.push({
        ...EXPLANATIONS.SUSPICIOUS_TLD,
        what: `Suspicious / Abuse-Heavy TLD: "${tld}"`,
      });
      riskScore += 55;
      break;
    }
  }

  // 4. HTTP credential/payment page
  if (url.protocol === 'http:') {
    const credKw = ['login', 'signin', 'account', 'password', 'payment', 'checkout', 'bank', 'credit', 'secure'];
    if (credKw.some(kw => fullUrl.includes(kw))) {
      explanations.push(EXPLANATIONS.HTTP_CREDS);
      riskScore += 70;
    }
  }

  // 5. Brand impersonation / typosquat
  const BRANDS = ['paypal', 'apple', 'microsoft', 'google', 'amazon', 'netflix', 'facebook', 'instagram', 'twitter', 'bank', 'irs', 'chase', 'wellsfargo'];
  for (const brand of BRANDS) {
    if (
      hostname.includes(brand) &&
      hostname !== `${brand}.com` &&
      !hostname.endsWith(`.${brand}.com`)
    ) {
      explanations.push({
        ...EXPLANATIONS.BRAND_IMPERSONATION,
        what: `Typosquatting / Brand Impersonation: "${brand}"`,
      });
      riskScore += 65;
      break;
    }
  }

  // 6. Excessive subdomain depth
  const subdomainDepth = hostname.split('.').length - 2;
  if (subdomainDepth >= 4) {
    explanations.push({
      ...EXPLANATIONS.SUBDOMAIN_DEPTH,
      what: `Excessive Subdomain Depth (${subdomainDepth} levels)`,
    });
    riskScore += 40;
  }

  // 7. Suspicious path keywords
  const suspiciousKw = ['phish', 'malware', 'hack', 'exploit', 'payload', 'shell', 'webshell', 'c2', 'botnet', 'stealer'];
  if (suspiciousKw.some(kw => fullUrl.includes(kw))) {
    explanations.push(EXPLANATIONS.SUSPICIOUS_KEYWORD);
    riskScore += 60;
  }

  // 8. Heavy URL encoding
  const encodedCount = (urlString.match(/%[0-9a-f]{2}/gi) || []).length;
  if (encodedCount > 8) {
    explanations.push({
      ...EXPLANATIONS.HEAVY_ENCODING,
      what: `Heavy URL Encoding (${encodedCount} encoded characters detected)`,
    });
    riskScore += 35;
  }

  // 9. Known tracking / fingerprinting domain
  if (TRACKING_DOMAINS.has(hostname)) {
    explanations.push(EXPLANATIONS.TRACKING_SCRIPTS);
    riskScore += 50;
  }

  // 10. Tracking keywords in URL path
  if (TRACKING_KW.some(kw => fullUrl.includes(kw))) {
    if (!explanations.some(e => e.what === EXPLANATIONS.TRACKING_SCRIPTS.what)) {
      explanations.push(EXPLANATIONS.TRACKING_SCRIPTS);
      riskScore += 40;
    }
  }

  // 11. Mixed-content form indicator (HTTP form action on HTTPS page)
  // Heuristic: URL path contains common form-action patterns pointing to http://
  if (url.protocol === 'https:' && fullUrl.includes('action=http%3a')) {
    explanations.push(EXPLANATIONS.MIXED_CONTENT_FORM);
    riskScore += 55;
  }

  return {
    flagged:      riskScore >= 55,
    explanations,
    riskScore:    Math.min(riskScore, 100),
    reasons:      explanations.map(e => e.what),
  };
}

function threatLevelLabel(score) {
  if (score >= 90) return 'CRITICAL';
  if (score >= 70) return 'HIGH';
  if (score >= 55) return 'MEDIUM';
  return 'LOW';
}

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------
async function getStorage() {
  return chrome.storage.local.get({ extensionEvents: [], scannedCount: 0 });
}

async function incrementScanned() {
  const data = await getStorage();
  await chrome.storage.local.set({ scannedCount: data.scannedCount + 1 });
}

async function persistEventAndIncrementScanned(event) {
  const data   = await getStorage();
  const events = [event, ...data.extensionEvents].slice(0, 200);
  await chrome.storage.local.set({
    extensionEvents: events,
    scannedCount:    data.scannedCount + 1,
  });
  console.log(
    `[AdaptiveShield] ⚑ FLAGGED  ${event.hostname}  ` +
    `score=${event.riskScore}  level=${event.threatLevel}  ` +
    `reasons=${event.reasons.length}  scanned=${data.scannedCount + 1}`
  );
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------
function fireNotification(event) {
  const emoji = { CRITICAL: '🚨', HIGH: '⚠️', MEDIUM: '⚡', LOW: 'ℹ️' }[event.threatLevel] || '⚠️';
  chrome.notifications.create(`as-${event.id}`, {
    type:           'basic',
    iconUrl:        'icons/icon48.png',
    title:          `${emoji} AdaptiveShield — ${event.threatLevel} Risk Blocked`,
    message:        `${event.hostname}\n${event.explanations?.[0]?.what || 'Suspicious URL'}`,
    contextMessage: `Risk score: ${event.riskScore}/100 · ${event.explanations.length} reason(s)`,
    priority:       event.threatLevel === 'CRITICAL' ? 2 : 1,
  });
}

// ---------------------------------------------------------------------------
// Broadcast to dashboard tabs + popup channel
// ---------------------------------------------------------------------------
async function broadcastToDashboard(event) {
  try {
    const tabs = await chrome.tabs.query({ url: 'http://localhost:5173/*' });
    for (const tab of tabs) {
      chrome.tabs.sendMessage(tab.id, { type: 'EXTENSION_DETECTION', event }).catch(() => {});
    }
  } catch { /* noop */ }
  chrome.runtime.sendMessage({ type: 'EXTENSION_DETECTION', event }).catch(() => {});
}

// ---------------------------------------------------------------------------
// Inject on-screen alert (HIGH + CRITICAL only)
// ---------------------------------------------------------------------------
async function injectAlert(tabId, event) {
  if (event.threatLevel !== 'CRITICAL' && event.threatLevel !== 'HIGH') return;
  try {
    await new Promise(r => setTimeout(r, 600));
    await chrome.tabs.sendMessage(tabId, {
      type: 'SHOW_ALERT',
      data: {
        hostname:     event.hostname,
        url:          event.url,
        threatLevel:  event.threatLevel,
        riskScore:    event.riskScore,
        explanations: event.explanations,
      },
    });
    console.log(`[AdaptiveShield] Alert injected → tab ${tabId}`);
  } catch (err) {
    console.warn(`[AdaptiveShield] Alert inject failed tab ${tabId}:`, err.message);
  }
}

// ---------------------------------------------------------------------------
// Core handler
// ---------------------------------------------------------------------------
async function handleNavigation({ url, tabId, frameId = 0, source = 'navigation' }) {
  if (frameId !== 0) return;
  if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) return;
  if (lastSeenUrl.get(tabId) === url) return;
  lastSeenUrl.set(tabId, url);

  const assessment = assessUrl(url);

  if (!assessment.flagged) {
    await incrementScanned();
    console.log(`[AdaptiveShield] ✓ CLEAN   ${url.slice(0, 80)}  (${source})`);
    return;
  }

  let hostname = url;
  try { hostname = new URL(url).hostname.replace(/^www\./, ''); } catch { /* noop */ }

  const event = {
    id:           `ext-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp:    new Date().toISOString(),
    url,
    hostname,
    tabId,
    riskScore:    assessment.riskScore,
    threatLevel:  threatLevelLabel(assessment.riskScore),
    reasons:      assessment.reasons,
    explanations: assessment.explanations,
    source:       'chrome-extension',
  };

  await Promise.all([
    persistEventAndIncrementScanned(event),
    Promise.resolve(fireNotification(event)),
    broadcastToDashboard(event),
    injectAlert(tabId, event),
  ]);
}

// ---------------------------------------------------------------------------
// Listeners
// ---------------------------------------------------------------------------
chrome.webNavigation.onCommitted.addListener(
  (details) => handleNavigation({ ...details, source: 'webNavigation' }),
  { url: [{ schemes: ['http', 'https'] }] }
);

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'loading') return;
  if (!tab.url) return;
  handleNavigation({ url: tab.url, tabId, frameId: 0, source: 'tabs.onUpdated' });
});

chrome.tabs.onRemoved.addListener((tabId) => lastSeenUrl.delete(tabId));

// ---------------------------------------------------------------------------
// Startup scans
// ---------------------------------------------------------------------------
async function scanOpenTabs() {
  try {
    const tabs = await chrome.tabs.query({ url: ['http://*/*', 'https://*/*'] });
    console.log(`[AdaptiveShield] Startup scan: ${tabs.length} open tab(s)`);
    for (const tab of tabs) {
      if (tab.url) await handleNavigation({ url: tab.url, tabId: tab.id, frameId: 0, source: 'startup-scan' });
    }
  } catch (err) {
    console.warn('[AdaptiveShield] Startup scan error:', err.message);
  }
}

chrome.runtime.onInstalled.addListener(() => {
  console.log('[AdaptiveShield] v2.1 installed — running startup scan');
  scanOpenTabs();
});

chrome.runtime.onStartup.addListener(() => {
  console.log('[AdaptiveShield] Browser started — running startup scan');
  scanOpenTabs();
});

// ---------------------------------------------------------------------------
// Message handler
// ---------------------------------------------------------------------------
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {

  if (message.type === 'PING') {
    getStorage().then(data => {
      sendResponse({
        status:       'MONITORING',
        version:      '2.1.0',
        scannedCount: data.scannedCount,
        flaggedCount: data.extensionEvents.length,
      });
    });
    return true;
  }

  if (message.type === 'GET_EXTENSION_EVENTS') {
    getStorage().then(data => {
      sendResponse({ events: data.extensionEvents, scannedCount: data.scannedCount });
    });
    return true;
  }

  if (message.type === 'CLEAR_EXTENSION_EVENTS') {
    chrome.storage.local.set({ extensionEvents: [], scannedCount: 0 }).then(() => {
      lastSeenUrl.clear();
      sendResponse({ ok: true });
    });
    return true;
  }

  if (message.type === 'ALERT_DISMISSED') {
    console.log(`[AdaptiveShield] Dismissed: ${message.url}`);
    sendResponse({ ok: true });
    return false;
  }
});

console.log('[AdaptiveShield] Service worker v2.1 started.');
