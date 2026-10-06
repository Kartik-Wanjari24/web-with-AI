/**
 * generate-icons.mjs  (v2.0 — redesigned shield)
 *
 * Produces: public/icons/icon16.png, icon48.png, icon128.png
 *
 * Design: modern shield silhouette with a glowing sentinel motif.
 *  - Deep navy (#0a0f1e) rounded-rect background
 *  - Blue-to-emerald gradient shield body  (#1e40af → #059669)
 *  - Bright white check-mark / sentinel tick inside the shield
 *  - Soft outer glow ring in electric blue (#3b82f6)
 */

import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { deflateSync } from 'zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// PNG encoder (pure Node, no deps)
// ---------------------------------------------------------------------------
function uint32BE(n) {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n >>> 0, 0);
  return b;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (const byte of buf) {
    crc ^= byte;
    for (let j = 0; j < 8; j++) crc = (crc & 1) ? (0xedb88320 ^ (crc >>> 1)) : (crc >>> 1);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const tb = Buffer.from(type, 'ascii');
  const cb = Buffer.concat([tb, data]);
  return Buffer.concat([uint32BE(data.length), tb, data, uint32BE(crc32(cb))]);
}

function encodePNG(w, h, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  const rw  = w * 4;
  const raw = Buffer.alloc((rw + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (rw + 1)] = 0;
    rgba.copy(raw, y * (rw + 1) + 1, y * rw, (y + 1) * rw);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------------------
// Colour helpers
// ---------------------------------------------------------------------------
function lerp(a, b, t) { return a + (b - a) * t; }

// Bilinear mix between two RGBA colours
function mix(c1, c2, t) {
  return [
    Math.round(lerp(c1[0], c2[0], t)),
    Math.round(lerp(c1[1], c2[1], t)),
    Math.round(lerp(c1[2], c2[2], t)),
    Math.round(lerp(c1[3], c2[3], t)),
  ];
}

// Alpha-composite src over dst (both [r,g,b,a 0-255])
function composite(dst, src) {
  const sa = src[3] / 255, da = dst[3] / 255;
  const oa = sa + da * (1 - sa);
  if (oa < 0.001) return [0, 0, 0, 0];
  return [
    Math.round((src[0] * sa + dst[0] * da * (1 - sa)) / oa),
    Math.round((src[1] * sa + dst[1] * da * (1 - sa)) / oa),
    Math.round((src[2] * sa + dst[2] * da * (1 - sa)) / oa),
    Math.round(oa * 255),
  ];
}

function dist(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }

// Smooth-step for anti-aliasing at edges
function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// ---------------------------------------------------------------------------
// Draw icon at `size` pixels
// ---------------------------------------------------------------------------
function drawIcon(size) {
  const rgba = Buffer.alloc(size * size * 4);

  // Palette
  const BG        = [0x0a, 0x0f, 0x1e, 255]; // deep navy
  const SHIELD_T  = [0x1e, 0x40, 0xaf, 255]; // blue-800  (top of shield)
  const SHIELD_B  = [0x05, 0x96, 0x69, 255]; // emerald-600 (bottom)
  const GLOW      = [0x3b, 0x82, 0xf6, 200]; // blue-500 glow ring
  const TICK_C    = [0xff, 0xff, 0xff, 255]; // white check
  const TICK_SH   = [0x00, 0x00, 0x00,  80]; // subtle shadow

  const S    = size;
  const half = S / 2;
  const pad  = S * 0.08;   // outer padding
  const cr   = S * 0.20;   // corner radius for background rect

  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const idx = (y * S + x) * 4;
      const nx  = x / (S - 1); // 0‥1
      const ny  = y / (S - 1);

      // ── 1. Rounded-rect background ───────────────────────────────────────
      // Distance from nearest corner centre for corner AA
      const cx = Math.max(cr, Math.min(S - cr, x));
      const cy = Math.max(cr, Math.min(S - cr, y));
      const dr = dist(x, y, cx, cy);
      const bgAlpha = smoothstep(cr + 0.7, cr - 0.7, dr) * 255;

      if (bgAlpha < 1) {
        rgba[idx] = 0; rgba[idx+1] = 0; rgba[idx+2] = 0; rgba[idx+3] = 0;
        continue;
      }

      let [r, g, b, a] = [BG[0], BG[1], BG[2], Math.round(bgAlpha)];

      // ── 2. Outer glow ring (electric blue circle) ────────────────────────
      const glowR   = half * 0.85;
      const glowW   = S * 0.045;
      const dCenter = dist(x, y, half, half * 0.96);
      const glowAmt = smoothstep(glowR + glowW, glowR + glowW * 0.3, dCenter)
                    - smoothstep(glowR, glowR - glowW * 0.5, dCenter);
      if (glowAmt > 0) {
        const gc = [...GLOW]; gc[3] = Math.round(glowAmt * GLOW[3]);
        [r, g, b, a] = composite([r, g, b, a], gc);
      }

      // ── 3. Shield body (pentagon) ────────────────────────────────────────
      // Shield defined in normalised coords (0..1), centred at (0.5, 0.48)
      const sx  = (nx - 0.10) / 0.80; // remap so shield occupies 80% width
      const sy  = (ny - 0.07) / 0.86;

      // Pentagon test: top 60% is a rectangle, bottom 40% tapers to a point
      const shieldMarginX = 0.08;
      const inShieldRect  = sx >= shieldMarginX && sx <= 1 - shieldMarginX && sy >= 0 && sy <= 0.60;
      const tipProgress   = (sy - 0.60) / 0.40; // 0‥1 from waist to tip
      const halfWidth     = (1 - shieldMarginX * 2) * 0.5 * (1 - tipProgress);
      const inShieldTip   = sy > 0.60 && sy <= 1.00 && Math.abs(sx - 0.5) <= halfWidth;
      const inShield      = inShieldRect || inShieldTip;

      if (inShield) {
        // gradient: top = SHIELD_T, bottom = SHIELD_B based on sy
        const t   = Math.min(1, sy / 1.0);
        const sc  = mix(SHIELD_T, SHIELD_B, t);
        // slight inner highlight at top
        const hl  = sy < 0.18 ? (0.18 - sy) / 0.18 * 0.35 : 0;
        sc[0] = Math.min(255, sc[0] + Math.round(hl * 255));
        sc[1] = Math.min(255, sc[1] + Math.round(hl * 255));
        sc[2] = Math.min(255, sc[2] + Math.round(hl * 255));
        [r, g, b, a] = composite([r, g, b, a], [...sc, 255]);
      }

      // ── 4. Shield border / rim (1-pixel inside edge) ─────────────────────
      // Add a thin bright rim around the shield for crisp definition
      if (size >= 32) {
        const rimW   = S * 0.022;
        const sxInner = (nx - 0.10 + rimW / S) / (0.80 - 2 * rimW / S);
        const syInner = (ny - 0.07 + rimW / S) / (0.86 - 2 * rimW / S);
        const shX    = Math.max(shieldMarginX + 0.015, Math.min(1 - shieldMarginX - 0.015, sx));
        // Use a distance-to-shield-edge approach via thin AA band
        const nearEdgeX = Math.min(Math.abs(sx - shieldMarginX), Math.abs(sx - (1 - shieldMarginX)));
        const nearEdgeY = sy <= 0.60 ? Math.abs(sy) : 0;
        const rimAlpha  = inShield && (nearEdgeX < 0.04 || nearEdgeY < 0.04)
                        ? smoothstep(0.04, 0.01, Math.min(nearEdgeX, nearEdgeY)) * 180 : 0;
        if (rimAlpha > 0) {
          [r, g, b, a] = composite([r, g, b, a], [180, 220, 255, Math.round(rimAlpha)]);
        }
      }

      // ── 5. Check-mark / sentinel tick ────────────────────────────────────
      // Draw a bold check-mark centred in the shield (only for size >= 24)
      if (size >= 16 && inShield) {
        // Tick defined as two line segments in shield-local coords (sx, sy)
        // Left arm: (0.25, 0.52) → (0.42, 0.70)
        // Right arm: (0.42, 0.70) → (0.75, 0.30)
        const tickW = size >= 48 ? 0.065 : 0.09; // line half-width in shield space

        // Distance from point (sx,sy) to a line segment (x1,y1)→(x2,y2)
        function ptSegDist(px, py, x1, y1, x2, y2) {
          const dx = x2 - x1, dy = y2 - y1;
          const t  = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
          return dist(px, py, x1 + t * dx, y1 + t * dy);
        }

        const d1 = ptSegDist(sx, sy, 0.24, 0.51, 0.42, 0.70);
        const d2 = ptSegDist(sx, sy, 0.42, 0.70, 0.76, 0.28);
        const dTick = Math.min(d1, d2);
        const tickAlpha = smoothstep(tickW, tickW * 0.4, dTick);
        if (tickAlpha > 0.01) {
          // Drop shadow first
          const shAlpha = Math.round(tickAlpha * TICK_SH[3]);
          [r, g, b, a]  = composite([r, g, b, a], [0, 0, 0, shAlpha]);
          // Then white tick
          const wAlpha  = Math.round(tickAlpha * 255);
          [r, g, b, a]  = composite([r, g, b, a], [255, 255, 255, wAlpha]);
        }
      }

      rgba[idx] = r; rgba[idx+1] = g; rgba[idx+2] = b; rgba[idx+3] = a;
    }
  }

  return encodePNG(S, S, rgba);
}

// ---------------------------------------------------------------------------
// Write icons
// ---------------------------------------------------------------------------
for (const size of [16, 48, 128]) {
  const buf = drawIcon(size);
  const out = resolve(__dirname, '..', 'public', 'icons', `icon${size}.png`);
  writeFileSync(out, buf);
  console.log(`  ✔  icon${size}.png  (${buf.length} bytes)`);
}

console.log('Icons generated successfully (v2.0 — glowing shield).');
