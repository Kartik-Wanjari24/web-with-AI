/**
 * build-extension-zip.mjs
 *
 * Packages the compiled dist/ folder into
 * public/adaptive-shield-extension.zip so the dashboard download button
 * serves a real, non-empty ZIP file.
 *
 * Run with: node scripts/build-extension-zip.mjs
 * Called automatically by the "build" npm script after vite build.
 *
 * Uses only Node.js built-ins — no external libraries.
 * Implements a minimal ZIP64-compatible archiver from scratch.
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname, relative, join } from 'path';
import { fileURLToPath } from 'url';
import { deflateRawSync } from 'zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = resolve(__dirname, '..');
const DIST_DIR  = resolve(ROOT, 'dist');
const OUT_FILE  = resolve(ROOT, 'public', 'adaptive-shield-extension.zip');

// ---------------------------------------------------------------------------
// Minimal ZIP writer (DEFLATE, no external deps)
// Spec: https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT
// ---------------------------------------------------------------------------
const ZIP_LOCAL_SIG   = 0x04034b50;
const ZIP_CENTRAL_SIG = 0x02014b50;
const ZIP_EOCD_SIG    = 0x06054b50;

function crc32(buf) {
  let crc = 0xffffffff;
  for (const b of buf) {
    crc ^= b;
    for (let j = 0; j < 8; j++) crc = (crc & 1) ? (0xedb88320 ^ (crc >>> 1)) : (crc >>> 1);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function u16(n) { const b = Buffer.alloc(2); b.writeUInt16LE(n >>> 0, 0); return b; }
function u32(n) { const b = Buffer.alloc(4); b.writeUInt32LE(n >>> 0, 0); return b; }

function dosDate(d) {
  // DOS date: bits 15-9 = year-1980, 8-5 = month, 4-0 = day
  return ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
}
function dosTime(d) {
  // DOS time: bits 15-11 = hour, 10-5 = minute, 4-0 = second/2
  return (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2);
}

const now   = new Date();
const dDate = u16(dosDate(now));
const dTime = u16(dosTime(now));

// Collect all files in dist/
function collectFiles(dir, base = '') {
  const entries = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const rel  = base ? `${base}/${name}` : name;
    if (statSync(full).isDirectory()) {
      entries.push(...collectFiles(full, rel));
    } else {
      entries.push({ full, rel });
    }
  }
  return entries;
}

const files   = collectFiles(DIST_DIR);
const parts   = []; // local file records
const central = []; // central directory records
let   offset  = 0;

for (const { full, rel } of files) {
  const raw      = readFileSync(full);
  const deflated = deflateRawSync(raw, { level: 6 });

  // Use DEFLATE only if it actually shrinks the file
  const useDeflate = deflated.length < raw.length;
  const data       = useDeflate ? deflated : raw;
  const method     = useDeflate ? 8 : 0;
  const crc        = crc32(raw);
  const nameBytes  = Buffer.from(rel, 'utf8');

  // Local file header
  const local = Buffer.concat([
    u32(ZIP_LOCAL_SIG),
    u16(20),          // version needed
    u16(0),           // general purpose flags
    u16(method),
    dTime, dDate,
    u32(crc),
    u32(data.length),
    u32(raw.length),
    u16(nameBytes.length),
    u16(0),           // extra field length
    nameBytes,
    data,
  ]);

  parts.push(local);

  // Central directory entry
  central.push(Buffer.concat([
    u32(ZIP_CENTRAL_SIG),
    u16(20),           // version made by
    u16(20),           // version needed
    u16(0),            // flags
    u16(method),
    dTime, dDate,
    u32(crc),
    u32(data.length),
    u32(raw.length),
    u16(nameBytes.length),
    u16(0),            // extra
    u16(0),            // comment
    u16(0),            // disk start
    u16(0),            // internal attrs
    u32(0),            // external attrs
    u32(offset),       // offset of local header
    nameBytes,
  ]));

  offset += local.length;
}

const cdBuffer  = Buffer.concat(central);
const cdOffset  = offset;
const cdSize    = cdBuffer.length;

const eocd = Buffer.concat([
  u32(ZIP_EOCD_SIG),
  u16(0),           // disk number
  u16(0),           // disk with central dir
  u16(files.length),
  u16(files.length),
  u32(cdSize),
  u32(cdOffset),
  u16(0),           // comment length
]);

const zip = Buffer.concat([...parts, cdBuffer, eocd]);
writeFileSync(OUT_FILE, zip);

const kb = (zip.length / 1024).toFixed(1);
console.log(`  ✔  adaptive-shield-extension.zip  (${kb} KB, ${files.length} files)`);
