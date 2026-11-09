#!/usr/bin/env node
/**
 * Prepares a case's particle artwork from a source image. No dependencies
 * beyond Node and macOS `sips` (used to decode JPEG/PNG/WebP to BMP and to
 * encode the preview JPEG).
 *
 *   node scripts/particle-prep.mjs <slug> <image> [--tolerance N] [--trim N] [--gamma G] [--masked]
 *
 * Writes:
 *   public/images/cases/<slug>/particle.png  — RGBA cut-out of the subject
 *                                              (sampled live by lib/particle-engine.ts)
 *   public/images/cases/<slug>/preview.jpg   — still of the particle look, used
 *                                              by the wheel's neighbour cards and
 *                                              as the no-WebGL fallback
 *
 * The subject is isolated by flood-filling the background from the image
 * border (the background colour is read from the corners). Options:
 *   --tolerance  how far a pixel may differ from the background colour and still
 *                be background, 0–255 per channel (default 28). Use a low value
 *                (5–10) when the subject itself is nearly white.
 *   --trim       extra pixels of light, low-saturation border to eat around the
 *                subject, for sticker-style outlines (default 0).
 *   --gamma      brightness curve for the still, match the case's `gamma` in
 *                lib/particle-cases.ts (default 1).
 *   --masked     the image is an RGBA PNG whose background is already
 *                transparent (e.g. from scripts/subject-mask.swift): its alpha
 *                is the subject mask, no colour flood fill is run.
 * Then add the slug to lib/particle-cases.ts.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { execFileSync } from "node:child_process";

const args = process.argv.slice(2);
const [slug, image] = args;
if (!slug || !image) { console.error("usage: node scripts/particle-prep.mjs <slug> <image> [--tolerance N] [--trim N] [--gamma G]"); process.exit(1); }
const opt = (name, def) => { const i = args.indexOf(`--${name}`); return i >= 0 ? +args[i + 1] : def; };
const TOL = opt("tolerance", 28), TRIM = opt("trim", 0), GAMMA = opt("gamma", 1);
const MASKED = args.includes("--masked");
const MAX_SIDE = 440;                    // longer side of particle.png
const STILL = { w: 1920, h: 1200 };      // preview.jpg size
const outDir = path.join("public/images/cases", slug);
fs.mkdirSync(outDir, { recursive: true });

// ── Decode ────────────────────────────────────────────────────────────────────
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "particle-prep-"));
let W, H, px;
if (MASKED) {
  ({ W, H, px } = readPNG(image));
} else {
  // Via sips → 24/32-bit BMP (alpha is dropped; the flood fill makes the mask).
  const bmpPath = path.join(tmp, "src.bmp");
  execFileSync("sips", ["-s", "format", "bmp", image, "--out", bmpPath], { stdio: "ignore" });
  const buf = fs.readFileSync(bmpPath);
  const off = buf.readUInt32LE(10); W = buf.readInt32LE(18); H = buf.readInt32LE(22);
  const bpp = buf.readUInt16LE(28), bottomUp = H > 0; H = Math.abs(H);
  const stride = Math.floor((W * bpp + 31) / 32) * 4, B = bpp / 8;
  px = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) {
    const row = off + (bottomUp ? H - 1 - y : y) * stride;
    for (let x = 0; x < W; x++) {
      const i = row + x * B, o = (y * W + x) * 4;
      px[o] = buf[i + 2]; px[o + 1] = buf[i + 1]; px[o + 2] = buf[i]; px[o + 3] = 255;
    }
  }
}

/** Minimal PNG reader: 8-bit RGB/RGBA (or grey/grey+alpha), non-interlaced. */
function readPNG(file) {
  const buf = fs.readFileSync(file);
  let pos = 8, w = 0, h = 0, colorType = 0; const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos), type = buf.toString("ascii", pos + 4, pos + 8), data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") {
      w = data.readUInt32BE(0); h = data.readUInt32BE(4); colorType = data[9];
      if (data[8] !== 8 || data[12] !== 0) throw new Error("PNG must be 8-bit, non-interlaced");
    } else if (type === "IDAT") idat.push(data);
    else if (type === "IEND") break;
    pos += 12 + len;
  }
  const ch = { 0: 1, 2: 3, 4: 2, 6: 4 }[colorType];
  if (!ch) throw new Error("unsupported PNG colour type " + colorType);
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = w * ch, out = new Uint8ClampedArray(w * h * 4);
  let prev = Buffer.alloc(stride), cur = Buffer.alloc(stride), p = 0;
  for (let y = 0; y < h; y++) {
    const filter = raw[p++];
    for (let i = 0; i < stride; i++) {
      const x = raw[p++], a = i >= ch ? cur[i - ch] : 0, b = prev[i], c = i >= ch ? prev[i - ch] : 0;
      let v;
      switch (filter) {
        case 0: v = x; break;
        case 1: v = x + a; break;
        case 2: v = x + b; break;
        case 3: v = x + ((a + b) >> 1); break;
        default: { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); v = x + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c); }
      }
      cur[i] = v & 255;
    }
    for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 4, i = x * ch;
      if (ch >= 3) { out[o] = cur[i]; out[o + 1] = cur[i + 1]; out[o + 2] = cur[i + 2]; out[o + 3] = ch === 4 ? cur[i + 3] : 255; }
      else { out[o] = out[o + 1] = out[o + 2] = cur[i]; out[o + 3] = ch === 2 ? cur[i + 1] : 255; }
    }
    [prev, cur] = [cur, prev];
  }
  return { W: w, H: h, px: out };
}

// ── Background colour = median of the corner patches ─────────────────────────
const samples = [];
for (const [cx, cy] of [[0, 0], [W - 1, 0], [0, H - 1], [W - 1, H - 1]])
  for (let dy = 0; dy < 6; dy++) for (let dx = 0; dx < 6; dx++) {
    const x = cx === 0 ? dx : cx - dx, y = cy === 0 ? dy : cy - dy, o = (y * W + x) * 4;
    samples.push([px[o], px[o + 1], px[o + 2]]);
  }
const med = (k) => samples.map((s) => s[k]).sort((a, b) => a - b)[samples.length >> 1];
const bg = [med(0), med(1), med(2)];
const near = (o, tol) => Math.abs(px[o] - bg[0]) + Math.abs(px[o + 1] - bg[1]) + Math.abs(px[o + 2] - bg[2]) <= tol * 3;

// ── Background mask: alpha (--masked) or a colour flood fill from the border ─
const isBg = new Uint8Array(W * H);
const stack = [];
if (MASKED) {
  for (let i = 0; i < W * H; i++) if (px[i * 4 + 3] < 128) isBg[i] = 1;
} else {
for (let x = 0; x < W; x++) stack.push(x, (H - 1) * W + x);
for (let y = 0; y < H; y++) stack.push(y * W, y * W + W - 1);
while (stack.length) {
  const i = stack.pop();
  if (isBg[i] || !near(i * 4, TOL)) continue;
  isBg[i] = 1;
  const x = i % W, y = (i - x) / W;
  if (x > 0) stack.push(i - 1); if (x < W - 1) stack.push(i + 1);
  if (y > 0) stack.push(i - W); if (y < H - 1) stack.push(i + W);
}
}

// ── Optional trim: grow the background through light, neutral pixels ─────────
for (let k = 0; k < TRIM; k++) {
  const next = isBg.slice();
  for (let i = 0; i < W * H; i++) {
    if (isBg[i]) continue;
    const x = i % W, y = (i - x) / W, o = i * 4;
    const mx = Math.max(px[o], px[o + 1], px[o + 2]), mn = Math.min(px[o], px[o + 1], px[o + 2]);
    if (!(mn > 120 && mx - mn < 40)) continue;
    if ((x > 0 && isBg[i - 1]) || (x < W - 1 && isBg[i + 1]) || (y > 0 && isBg[i - W]) || (y < H - 1 && isBg[i + W])) next[i] = 1;
  }
  isBg.set(next);
}

// ── Keep the largest connected piece of foreground ───────────────────────────
const label = new Int32Array(W * H).fill(-1); const sizes = [];
for (let s = 0; s < W * H; s++) {
  if (isBg[s] || label[s] >= 0) continue;
  const id = sizes.length; let count = 0; const st = [s]; label[s] = id;
  while (st.length) {
    const i = st.pop(); count++;
    const x = i % W, y = (i - x) / W;
    for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1])
      if (j >= 0 && !isBg[j] && label[j] < 0) { label[j] = id; st.push(j); }
  }
  sizes.push(count);
}
// A pre-masked image keeps every piece (the subject may be several objects);
// otherwise only the largest piece survives (drops watermarks and specks).
const keep = sizes.indexOf(Math.max(...sizes));
const fg = new Uint8Array(W * H);
let x0 = W, y0 = H, x1 = 0, y1 = 0;
for (let i = 0; i < W * H; i++) if (MASKED ? !isBg[i] : label[i] === keep) {
  fg[i] = 1; const x = i % W, y = (i - x) / W;
  if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
}

// ── Crop + downscale (alpha-weighted box filter) ─────────────────────────────
const pad = 2; x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(W - 1, x1 + pad); y1 = Math.min(H - 1, y1 + pad);
const cw = x1 - x0 + 1, ch = y1 - y0 + 1;
const scale = Math.min(1, MAX_SIDE / Math.max(cw, ch));
const ow = Math.max(1, Math.round(cw * scale)), oh = Math.max(1, Math.round(ch * scale));
const out = new Uint8ClampedArray(ow * oh * 4);
for (let oy = 0; oy < oh; oy++) for (let ox = 0; ox < ow; ox++) {
  const sx0 = x0 + Math.floor(ox / scale), sx1 = x0 + Math.max(Math.floor((ox + 1) / scale), Math.floor(ox / scale) + 1);
  const sy0 = y0 + Math.floor(oy / scale), sy1 = y0 + Math.max(Math.floor((oy + 1) / scale), Math.floor(oy / scale) + 1);
  let r = 0, g = 0, b = 0, a = 0, n = 0;
  for (let y = sy0; y < sy1 && y <= y1; y++) for (let x = sx0; x < sx1 && x <= x1; x++) {
    const i = y * W + x; n++;
    if (fg[i]) { const o = i * 4; r += px[o]; g += px[o + 1]; b += px[o + 2]; a++; }
  }
  const o = (oy * ow + ox) * 4;
  if (a) { out[o] = r / a; out[o + 1] = g / a; out[o + 2] = b / a; out[o + 3] = 255 * a / n; }
}

// ── PNG encoder ──────────────────────────────────────────────────────────────
const crcTable = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc32 = (b) => { let c = -1; for (const v of b) c = crcTable[(c ^ v) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, crc]); };
function writePNG(file, w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; raw.set(rgba.subarray(y * w * 4, (y + 1) * w * 4), y * (w * 4 + 1) + 1); }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  fs.writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]));
}
const particlePath = path.join(outDir, "particle.png");
writePNG(particlePath, ow, oh, out);

// ── Still: the particle look rendered once, for the wheel's neighbour cards ──
// Mirrors lib/particle-engine.ts: brightness → density, size and alpha; the
// subject sits where the live layout puts it on a wide screen (right of the
// text column), on the site's dark background.
const { w: SW, h: SH } = STILL;
const img = new Float32Array(SW * SH * 3);
const BG = [0x0E / 255, 0x0E / 255, 0x0E / 255];
for (let i = 0; i < SW * SH; i++) { img[i * 3] = BG[0]; img[i * 3 + 1] = BG[1]; img[i * 3 + 2] = BG[2]; }
const left = Math.min(SW * 0.4, 440) + 24;
const freeW = SW - left, size = Math.min(freeW * 0.8, SH * 0.7), half = Math.max(ow, oh) / 2;
const cx = left + freeW / 2, cy = SH / 2, S = size / 2;
const COUNT = 12000, DARK_DENSITY = 0.22, MIX = 0.72, SIZE = 3.0, SIZE_BY_B = 0.7;
const shadow = [0.4, 0.4, 0.5], highlight = [0xF3 / 255, 0xF1 / 255, 1];
const idx = [], cdf = []; let total = 0; const lum = new Float32Array(ow * oh);
for (let p = 0; p < ow * oh; p++) {
  const a = out[p * 4 + 3] / 255; if (a < 0.4) continue;
  const l = Math.pow(0.2126 * out[p * 4] / 255 + 0.7152 * out[p * 4 + 1] / 255 + 0.0722 * out[p * 4 + 2] / 255, GAMMA);
  lum[p] = l; total += a * (DARK_DENSITY + (1 - DARK_DENSITY) * l); idx.push(p); cdf.push(total);
}
const pick = (r) => { let lo = 0, hi = cdf.length - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (cdf[m] < r) lo = m + 1; else hi = m; } return idx[lo]; };
const splat = (x, y, rad, col, alpha) => {
  const r2 = rad * rad;
  for (let yy = Math.floor(y - rad); yy <= Math.ceil(y + rad); yy++) for (let xx = Math.floor(x - rad); xx <= Math.ceil(x + rad); xx++) {
    if (xx < 0 || yy < 0 || xx >= SW || yy >= SH) continue;
    const d2 = (xx + 0.5 - x) ** 2 + (yy + 0.5 - y) ** 2; if (d2 > r2) continue;
    const d = Math.sqrt(d2) / rad;
    const k = (Math.exp(-d * d * 3.2) * 0.7 + (1 - Math.min(1, d / 0.55)) * 1.0) * alpha;
    const o = (yy * SW + xx) * 3;
    img[o] += col[0] * k; img[o + 1] += col[1] * k; img[o + 2] += col[2] * k;
  }
};
for (let i = 0; i < COUNT; i++) {
  const p = pick(Math.random() * total);
  const u = ((p % ow) + Math.random() - ow / 2) / half, v = (Math.floor(p / ow) + Math.random() - oh / 2) / half;
  const l = lum[p];
  const col = [0, 1, 2].map((c) => { const src = out[p * 4 + c] / 255; const pal = shadow[c] + (highlight[c] - shadow[c]) * l; return pal * (1 - MIX) + (src + (1 - src) * 0.5 * l) * MIX; });
  splat(cx + u * S, cy + v * S, SIZE * (1 - SIZE_BY_B * 0.5 + SIZE_BY_B * l) / 2, col, 0.38 + 0.62 * Math.sqrt(l));
}
const still = new Uint8ClampedArray(SW * SH * 4);
for (let i = 0; i < SW * SH; i++) { still[i * 4] = img[i * 3] * 255; still[i * 4 + 1] = img[i * 3 + 1] * 255; still[i * 4 + 2] = img[i * 3 + 2] * 255; still[i * 4 + 3] = 255; }
const stillPng = path.join(tmp, "still.png");
writePNG(stillPng, SW, SH, still);
const previewPath = path.join(outDir, "preview.jpg");
execFileSync("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "82", stillPng, "--out", previewPath], { stdio: "ignore" });
fs.rmSync(tmp, { recursive: true, force: true });

console.log(`${slug}: background rgb(${bg}), kept ${sizes[keep]} px of ${sizes.length} pieces → ${particlePath} (${ow}×${oh}), ${previewPath}`);
