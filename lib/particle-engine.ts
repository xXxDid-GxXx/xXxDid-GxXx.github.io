/**
 * Particle artwork engine for the homepage wheel (see
 * components/picker/ParticleArtwork.tsx for the React side).
 *
 * A subject image (RGBA cut-out) is sampled into a few thousand points:
 * brighter pixels get more, lighter particles; darker pixels fewer, dimmer
 * ones, so the shading survives. Each particle springs back to its home
 * position, is pushed (with a swirl) by the cursor, bursts apart on tap, flies
 * in from a scatter when shown, and dissolves when hidden. The cloud gets a
 * rounded depth bulge and tilts toward the cursor with perspective. Fine dust
 * drifts off the shape to the right. Rendering is one WebGL POINTS draw with
 * additive blending — no libraries.
 *
 * All tuning values live in the TUNING block below.
 */

import { PARTICLE_CASES } from "@/lib/particle-cases";

// ── Tuning ───────────────────────────────────────────────────────────────────
export const TUNING = {
  /** Ambient dots scattered over the whole page while an artwork is on screen
   *  (desktop / mobile), their drift speed (px/s) and brightness (0..1). */
  AMBIENT_DESKTOP: 900,
  AMBIENT_MOBILE: 300,
  AMBIENT_DRIFT: 6,
  AMBIENT_BRIGHTNESS: 0.8,
  /** Dots drawn on a particle case's wheel card while the wheel spins
   *  (desktop / mobile) — see components/picker/ParticleCardArt.tsx. */
  CARD_DOTS_DESKTOP: 2400,
  CARD_DOTS_MOBILE: 1000,
  /** Particles on desktop / on screens narrower than 768px. */
  COUNT_DESKTOP: 18000,
  COUNT_MOBILE: 7500,
  /** Extra "halo" particles scattered just outside the silhouette, as a
   *  fraction of the count, and how far they spread (fraction of the subject's
   *  half-size). They are dimmer and smaller and thin out with distance. */
  HALO_FRACTION: 1.3,
  HALO_SPREAD: 0.42,
  /** Fine dust motes drifting off the shape (desktop / mobile). */
  DUST_DESKTOP: 240,
  DUST_MOBILE: 110,

  /** Base particle diameter in CSS px (scaled by brightness and depth). */
  SIZE: 3.0,
  /** How much a particle's size grows with brightness (0 = all the same). */
  SIZE_BY_BRIGHTNESS: 0.7,
  /** 0 → pure two-tone palette (shadow→highlight); 1 → the image's own colours. */
  SOURCE_COLOR_MIX: 0.72,
  /** Sampling weight of a black pixel relative to a white one (density contrast). */
  DARK_DENSITY: 0.22,

  /** Spring pulling a particle home (1/s²) and velocity damping (1/s). Lower
   *  values let a disturbance linger longer before the shape heals. */
  SPRING: 30,
  DAMPING: 4.5,
  /** Cursor: push radius (CSS px), push acceleration (px/s²) and swirl (0..1). */
  CURSOR_RADIUS: 230,
  CURSOR_STRENGTH: 12000,
  CURSOR_SWIRL: 0.7,
  /** Wake: how much of the cursor's own speed nearby particles pick up (1/s),
   *  so a fast drag sweeps them along its path. */
  CURSOR_DRAG: 7,
  /** Tap/click burst: outward speed (px/s) and how long the spring stays weak (s). */
  BURST_SPEED: 1500,
  BURST_FREE_TIME: 0.42,

  /** Depth of the cloud relative to its size (0 = flat) and bulge roundness. */
  DEPTH: 0.5,
  BULGE: 0.7,
  /** Max tilt toward the cursor (radians) and the easing toward it per frame. */
  TILT: 0.3,
  TILT_EASE: 0.06,
  /** Perspective focal length as a multiple of the cloud's half-size. */
  FOCAL: 3.2,

  /** Idle sway amplitude (CSS px) and twinkle depth (0..1). */
  SWAY: 5,
  TWINKLE: 0.3,
  /** Dust drift speed (px/s, to the right) and lifetime range (s). */
  DUST_SPEED: 34,
  DUST_LIFE: [2.2, 5] as [number, number],

  /** Fade in/out time of the whole artwork (s). */
  FADE: 0.4,
  /** Fraction of the free width/height the subject's longer side may take.
   *  >1 lets wide subjects bleed past the right edge. */
  FIT_W: 1.05,
  FIT_H: 0.92,
  /** Soft radial glow in the case's accent colour behind the subject: strength
   *  (0 = off) and radius as a multiple of the subject's half-size. */
  ACCENT_GLOW: 0.16,
  ACCENT_GLOW_RADIUS: 1.4,
  /** Background colour (the site's --color-bg-dark). */
  BACKGROUND: "#0E0E0E",
};

// ── Types ────────────────────────────────────────────────────────────────────
export type ParticleShape = {
  width: number;
  height: number;
  /** RGBA, premultiplied-free, as from getImageData. */
  data: Uint8ClampedArray;
  shadow: [number, number, number];
  highlight: [number, number, number];
  /** Brightness curve exponent: 1 = linear, <1 lifts mid-tones (for dark subjects). */
  gamma: number;
};

type Layout = {
  width: number; height: number; dpr: number;
  /** Subject centre and px-per-normalized-unit. */
  cx: number; cy: number; scale: number;
};

const STRIDE = 7; // x, y, size, r, g, b, a

/**
 * Where the subject sits on a stage of the given size: centred in the free
 * area right of the text column on desktop (the column is min(40vw, 440px)
 * plus the gutter), centred on phones. `scale` is px per normalized unit, so
 * the subject's longer side spans 2 × scale.
 */
export function subjectLayout(width: number, height: number) {
  // Mirrors --space-gutter: clamp(1.5rem, 5vw, 4rem).
  const gutter = Math.min(64, Math.max(24, width * 0.05));
  if (width < 768) {
    // Phones: the text block sits at the bottom, so the subject rides high.
    const size = Math.min(width * 0.95, height * 0.48);
    return { cx: width / 2, cy: height * 0.36, scale: size / 2 };
  }
  const left = Math.min(width * 0.4, 440) + gutter;
  const freeW = Math.max(120, width - left);
  const size = Math.min(freeW * TUNING.FIT_W, height * TUNING.FIT_H);
  // A touch right of centre so wide subjects bleed off the edge a little.
  return { cx: left + freeW * 0.55, cy: height * 0.5, scale: size / 2 };
}

export type ShapePoint = { u: number; v: number; lum: number; r: number; g: number; b: number };

/**
 * Sample `count` points over a shape's opaque pixels, brighter pixels more
 * often (the same weighting the engine uses). Coordinates are normalized to
 * the shape's longer side (−1..1) around its bounding-box centre; colours are
 * the engine's palette/source blend, 0..1.
 */
export function sampleShapePoints(shape: ParticleShape, count: number): ShapePoint[] {
  const { width: w, height: h, data } = shape;
  const idx: number[] = []; const cdf: number[] = []; let total = 0;
  let minX = w, maxX = 0, minY = h, maxY = 0;
  for (let p = 0; p < w * h; p++) {
    const a = data[p * 4 + 3] / 255;
    if (a < 0.4) continue;
    const l = Math.pow(0.2126 * data[p * 4] / 255 + 0.7152 * data[p * 4 + 1] / 255 + 0.0722 * data[p * 4 + 2] / 255, shape.gamma);
    total += a * (TUNING.DARK_DENSITY + (1 - TUNING.DARK_DENSITY) * l); idx.push(p); cdf.push(total);
    const x = p % w, y = (p - x) / w;
    if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
  }
  const half = Math.max(w, h) / 2, bcx = (minX + maxX + 1) / 2, bcy = (minY + maxY + 1) / 2;
  const out: ShapePoint[] = [];
  for (let i = 0; i < count; i++) {
    const r = Math.random() * total;
    let lo = 0, hi = cdf.length - 1;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (cdf[mid] < r) lo = mid + 1; else hi = mid; }
    const p = idx[lo];
    const l = Math.pow(0.2126 * data[p * 4] / 255 + 0.7152 * data[p * 4 + 1] / 255 + 0.0722 * data[p * 4 + 2] / 255, shape.gamma);
    const m = TUNING.SOURCE_COLOR_MIX;
    const ch = (c: number) => {
      const src = data[p * 4 + c] / 255;
      const pal = shape.shadow[c] + (shape.highlight[c] - shape.shadow[c]) * l;
      return pal * (1 - m) + (src + (1 - src) * 0.5 * l) * m;
    };
    out.push({ u: ((p % w) + Math.random() - bcx) / half, v: (Math.floor(p / w) + Math.random() - bcy) / half, lum: l, r: ch(0), g: ch(1), b: ch(2) });
  }
  return out;
}

const shapeCache = new Map<string, Promise<ParticleShape>>();
/** Decoded shape for a particle case, loaded once and shared. */
export function getCaseShape(slug: string): Promise<ParticleShape> {
  let p = shapeCache.get(slug);
  if (!p) {
    const cfg = PARTICLE_CASES[slug];
    p = loadShape(cfg.src, cfg.shadow, cfg.highlight, cfg.gamma ?? 1);
    shapeCache.set(slug, p);
  }
  return p;
}

const hexToRgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.replace("#", ""), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

const VERT = `
attribute vec2 a_pos;
attribute float a_size;
attribute vec4 a_color;
uniform vec2 u_res;
uniform float u_dpr;
varying vec4 v_color;
void main() {
  vec2 clip = (a_pos / u_res) * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  gl_PointSize = max(1.0, a_size * u_dpr);
  v_color = a_color;
}`;

const FRAG = `
precision mediump float;
varying vec4 v_color;
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  if (d > 1.0) discard;
  float glow = exp(-d * d * 3.2);
  float core = 1.0 - smoothstep(0.0, 0.55, d);
  vec3 c = v_color.rgb * (glow * 0.7 + core * 1.0) * v_color.a;
  gl_FragColor = vec4(c, 1.0);
}`;

const GLOW_VERT = `
attribute vec2 a_clip;
void main() { gl_Position = vec4(a_clip, 0.0, 1.0); }`;

const GLOW_FRAG = `
precision mediump float;
uniform vec2 u_center;   // device px, bottom-left origin
uniform float u_radius;  // device px
uniform vec3 u_color;
uniform float u_alpha;
void main() {
  float d = length(gl_FragCoord.xy - u_center) / u_radius;
  float g = exp(-d * d * 2.2);
  gl_FragColor = vec4(u_color * g * u_alpha, 1.0);
}`;

export class ParticleEngine {
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private buffer: WebGLBuffer | null = null;
  private uRes: WebGLUniformLocation | null = null;
  private uDpr: WebGLUniformLocation | null = null;
  private aPos = 0; private aSize = 0; private aColor = 0;
  // Accent glow: a full-screen triangle shaded with a radial falloff.
  private glowProgram: WebGLProgram | null = null;
  private glowBuffer: WebGLBuffer | null = null;
  private aClip = 0;
  private uGlowCenter: WebGLUniformLocation | null = null;
  private uGlowRadius: WebGLUniformLocation | null = null;
  private uGlowColor: WebGLUniformLocation | null = null;
  private uGlowAlpha: WebGLUniformLocation | null = null;

  private layout: Layout = { width: 1, height: 1, dpr: 1, cx: 0, cy: 0, scale: 1 };
  private shape: ParticleShape | null = null;
  private count = 0;      // shape particles
  private haloCount = 0;  // extra particles around the silhouette (after `count`)
  private total = 0;      // count + haloCount
  // Normalized home (u, v, z) in the shape's own space, plus look.
  private nu = new Float32Array(0); private nv = new Float32Array(0); private nz = new Float32Array(0);
  private lum = new Float32Array(0); private phase = new Float32Array(0);
  private col = new Float32Array(0); // rgb per particle
  // Pixel-space homes and state.
  private hx = new Float32Array(0); private hy = new Float32Array(0); private hz = new Float32Array(0);
  private px = new Float32Array(0); private py = new Float32Array(0); private pz = new Float32Array(0);
  private vx = new Float32Array(0); private vy = new Float32Array(0); private vz = new Float32Array(0);
  // Dust: x, y, z, vx, vy, life, maxLife, size
  private dust = new Float32Array(0);
  private dustCount = 0;
  // Ambient dots over the whole page: x, y, vx, vy, phase, size, alpha
  private ambient = new Float32Array(0);
  private ambientCount = 0;
  private vertices = new Float32Array(0);

  private pointer = { x: 0, y: 0, active: false };
  // Smoothed cursor velocity (px/s) for the wake; decays when the cursor rests.
  private pointerVel = { x: 0, y: 0, t: 0 };
  private tiltX = 0; private tiltY = 0;
  private freeUntil = 0;       // spring is weak until this time (burst)
  private opacity = 0; private opacityTarget = 0;
  private visible = false;
  private time = 0; private last = 0;
  private raf = 0;
  reducedMotion = false;
  private onDone: (() => void) | null = null;

  constructor(private canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl", {
      alpha: false, antialias: false, depth: false, stencil: false,
      premultipliedAlpha: false, powerPreference: "high-performance",
    });
    if (!gl || gl.isContextLost()) return;
    this.gl = gl;
    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src); gl.compileShader(s);
      return s;
    };
    const link = (vert: string, frag: string) => {
      const p = gl.createProgram()!;
      gl.attachShader(p, compile(gl.VERTEX_SHADER, vert));
      gl.attachShader(p, compile(gl.FRAGMENT_SHADER, frag));
      gl.linkProgram(p);
      return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null;
    };
    const program = link(VERT, FRAG);
    const glowProgram = link(GLOW_VERT, GLOW_FRAG);
    if (!program || !glowProgram) { this.gl = null; return; }
    this.program = program;
    this.buffer = gl.createBuffer();
    this.aPos = gl.getAttribLocation(program, "a_pos");
    this.aSize = gl.getAttribLocation(program, "a_size");
    this.aColor = gl.getAttribLocation(program, "a_color");
    this.uRes = gl.getUniformLocation(program, "u_res");
    this.uDpr = gl.getUniformLocation(program, "u_dpr");
    this.glowProgram = glowProgram;
    this.glowBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.glowBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    this.aClip = gl.getAttribLocation(glowProgram, "a_clip");
    this.uGlowCenter = gl.getUniformLocation(glowProgram, "u_center");
    this.uGlowRadius = gl.getUniformLocation(glowProgram, "u_radius");
    this.uGlowColor = gl.getUniformLocation(glowProgram, "u_color");
    this.uGlowAlpha = gl.getUniformLocation(glowProgram, "u_alpha");
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    const [r, g, b] = hexToRgb(TUNING.BACKGROUND);
    gl.clearColor(r, g, b, 1);
  }

  get supported() { return !!this.gl; }

  // ── Layout ─────────────────────────────────────────────────────────────────
  resize(width: number, height: number) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.layout = { width, height, dpr, ...subjectLayout(width, height) };
    this.gl?.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.placeHomes();
    this.seedAmbient();
  }

  /** Scatter the ambient dots over the stage (re-seeded on resize). */
  private seedAmbient() {
    const { width, height } = this.layout;
    this.ambientCount = width < 768 ? TUNING.AMBIENT_MOBILE : TUNING.AMBIENT_DESKTOP;
    this.ambient = new Float32Array(this.ambientCount * 7);
    for (let i = 0; i < this.ambientCount; i++) {
      const o = i * 7;
      this.ambient[o] = Math.random() * width;
      this.ambient[o + 1] = Math.random() * height;
      this.ambient[o + 2] = (Math.random() - 0.3) * TUNING.AMBIENT_DRIFT;
      this.ambient[o + 3] = (Math.random() - 0.5) * TUNING.AMBIENT_DRIFT * 0.6;
      this.ambient[o + 4] = Math.random();
      this.ambient[o + 5] = 1.0 + Math.random() * 1.6;
      // Mostly faint, a few brighter "stars".
      this.ambient[o + 6] = Math.pow(Math.random(), 1.8) * 0.8 + 0.12;
    }
    this.vertices = new Float32Array((this.total + this.dustCount + this.ambientCount) * STRIDE);
  }

  private placeHomes() {
    const { cx, cy, scale } = this.layout;
    for (let i = 0; i < this.total; i++) {
      this.hx[i] = cx + this.nu[i] * scale;
      this.hy[i] = cy + this.nv[i] * scale;
      this.hz[i] = this.nz[i] * scale;
    }
  }

  // ── Shape sampling ─────────────────────────────────────────────────────────
  setShape(shape: ParticleShape) {
    this.shape = shape;
    const mobile = this.layout.width < 768;
    const count = mobile ? TUNING.COUNT_MOBILE : TUNING.COUNT_DESKTOP;
    this.dustCount = this.reducedMotion ? 0 : (mobile ? TUNING.DUST_MOBILE : TUNING.DUST_DESKTOP);
    const { width: w, height: h, data } = shape;

    // Weighted sampling: cumulative weights over opaque pixels.
    const idx: number[] = []; const cdf: number[] = []; let total = 0;
    const lumAt = new Float32Array(w * h);
    let minX = w, maxX = 0, minY = h, maxY = 0;
    for (let p = 0; p < w * h; p++) {
      const a = data[p * 4 + 3] / 255;
      if (a < 0.4) continue;
      const r = data[p * 4] / 255, g = data[p * 4 + 1] / 255, b = data[p * 4 + 2] / 255;
      const l = Math.pow(0.2126 * r + 0.7152 * g + 0.0722 * b, shape.gamma);
      lumAt[p] = l;
      const weight = a * (TUNING.DARK_DENSITY + (1 - TUNING.DARK_DENSITY) * l);
      total += weight; idx.push(p); cdf.push(total);
      const x = p % w, y = (p - x) / w;
      if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
    const half = Math.max(w, h) / 2;
    const bboxCx = (minX + maxX + 1) / 2, bboxCy = (minY + maxY + 1) / 2;
    const ru = ((maxX - minX + 1) / 2) / half * 1.08, rv = ((maxY - minY + 1) / 2) / half * 1.08;

    const haloCount = Math.round(count * TUNING.HALO_FRACTION);
    const totalCount = count + haloCount;
    this.count = count; this.haloCount = haloCount; this.total = totalCount;
    const alloc = () => new Float32Array(totalCount);
    this.nu = alloc(); this.nv = alloc(); this.nz = alloc(); this.lum = alloc(); this.phase = alloc();
    this.col = new Float32Array(totalCount * 3);
    this.hx = alloc(); this.hy = alloc(); this.hz = alloc();
    this.px = alloc(); this.py = alloc(); this.pz = alloc();
    this.vx = alloc(); this.vy = alloc(); this.vz = alloc();
    this.dust = new Float32Array(this.dustCount * 8);
    this.vertices = new Float32Array((totalCount + this.dustCount + this.ambientCount) * STRIDE);
    // Opaque-pixel test for the halo sampling (alpha ≥ 0.4, like the CDF).
    const inside = (x: number, y: number) =>
      x >= 0 && y >= 0 && x < w && y < h && data[(Math.floor(y) * w + Math.floor(x)) * 4 + 3] >= 102;
    const gauss = () => { // Box–Muller
      const u = 1 - Math.random(), v = Math.random();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    };

    const pick = (r: number) => { // binary search the CDF
      let lo = 0, hi = cdf.length - 1;
      while (lo < hi) { const mid = (lo + hi) >> 1; if (cdf[mid] < r) lo = mid + 1; else hi = mid; }
      return idx[lo];
    };
    for (let i = 0; i < count; i++) {
      const p = pick(Math.random() * total);
      const x = (p % w) + Math.random(), y = Math.floor(p / w) + Math.random();
      const u = (x - bboxCx) / half, v = (y - bboxCy) / half;
      const l = lumAt[p];
      this.nu[i] = u; this.nv[i] = v; this.lum[i] = l; this.phase[i] = Math.random();
      // Depth: rounded bulge over the subject's footprint plus brightness relief.
      const bulge = Math.sqrt(Math.max(0, 1 - (u / ru) ** 2 - (v / rv) ** 2));
      this.nz[i] = TUNING.DEPTH * (TUNING.BULGE * bulge + (1 - TUNING.BULGE) * l) - TUNING.DEPTH * 0.5;
      // Colour: two-tone palette by brightness, blended with the pixel's own colour.
      const sr = data[p * 4] / 255, sg = data[p * 4 + 1] / 255, sb = data[p * 4 + 2] / 255;
      const m = TUNING.SOURCE_COLOR_MIX;
      for (let c = 0; c < 3; c++) {
        const pal = shape.shadow[c] + (shape.highlight[c] - shape.shadow[c]) * l;
        const src = c === 0 ? sr : c === 1 ? sg : sb;
        // Lift the source colour toward white with brightness so pale areas glow
        // and saturated ones keep their hue.
        const lifted = src + (1 - src) * 0.5 * l;
        this.col[i * 3 + c] = pal * (1 - m) + lifted * m;
      }
    }
    // Halo: start from a random subject pixel, step outward by a gaussian
    // offset, and keep the point only if it landed outside the silhouette —
    // so the dots hug the edge and thin out with distance.
    const spread = TUNING.HALO_SPREAD * half;
    for (let i = count; i < totalCount; i++) {
      let x = 0, y = 0, d = 0, l = 0, p = 0;
      for (let attempt = 0; attempt < 8; attempt++) {
        p = pick(Math.random() * total);
        const ox = gauss() * spread, oy = gauss() * spread;
        x = (p % w) + 0.5 + ox; y = Math.floor(p / w) + 0.5 + oy;
        d = Math.hypot(ox, oy) / spread;
        if (!inside(x, y)) break;
      }
      l = lumAt[p];
      const u = (x - bboxCx) / half, v = (y - bboxCy) / half;
      this.nu[i] = u; this.nv[i] = v; this.phase[i] = Math.random();
      // Dim with distance; the brightness channel doubles as the alpha driver.
      this.lum[i] = Math.max(0.02, 0.9 * Math.exp(-d * d * 0.7) * (0.5 + 0.5 * l));
      this.nz[i] = (Math.random() - 0.7) * TUNING.DEPTH * 0.6; // mostly a touch behind
      const sr = data[p * 4] / 255, sg = data[p * 4 + 1] / 255, sb = data[p * 4 + 2] / 255;
      const m = TUNING.SOURCE_COLOR_MIX;
      for (let c = 0; c < 3; c++) {
        const pal = shape.shadow[c] + (shape.highlight[c] - shape.shadow[c]) * l;
        const src = c === 0 ? sr : c === 1 ? sg : sb;
        // The mist leans toward the case's accent colour.
        this.col[i * 3 + c] = shape.shadow[c] * 0.6 + (pal * (1 - m) + (src + (1 - src) * 0.5 * l) * m) * 0.4;
      }
    }
    this.placeHomes();
    for (let d = 0; d < this.dustCount; d++) this.spawnDust(d, true);
  }

  private spawnDust(d: number, randomAge: boolean) {
    const o = d * 8;
    const i = Math.floor(Math.random() * this.count);
    const life = TUNING.DUST_LIFE[0] + Math.random() * (TUNING.DUST_LIFE[1] - TUNING.DUST_LIFE[0]);
    this.dust[o] = this.hx[i] + (Math.random() - 0.5) * 6;
    this.dust[o + 1] = this.hy[i] + (Math.random() - 0.5) * 6;
    this.dust[o + 2] = this.hz[i];
    this.dust[o + 3] = TUNING.DUST_SPEED * (0.5 + Math.random());
    this.dust[o + 4] = (Math.random() - 0.6) * TUNING.DUST_SPEED * 0.5;
    this.dust[o + 5] = randomAge ? Math.random() * life : 0;
    this.dust[o + 6] = life;
    this.dust[o + 7] = 0.7 + Math.random() * 0.9;
  }

  // ── Show / hide / interact ─────────────────────────────────────────────────
  /**
   * Reveal a shape. `entry` "scatter" flies the particles in from random
   * positions; "home" starts them in place with a soft puff (used after the
   * wheel spins, when the card already showed the dotted shape). Reduced
   * motion always snaps home. If a shape is already on screen, the particles
   * keep their positions and spring to the new homes — one shape morphs into
   * the next.
   */
  show(shape: ParticleShape, entry: "scatter" | "home" = "scatter") {
    const wasVisible = this.visible && this.total > 0;
    const keep = wasVisible
      ? { px: this.px, py: this.py, pz: this.pz, vx: this.vx, vy: this.vy, vz: this.vz }
      : null;
    this.setShape(shape);
    if (keep && keep.px.length === this.total) {
      this.px.set(keep.px); this.py.set(keep.py); this.pz.set(keep.pz);
      this.vx.set(keep.vx); this.vy.set(keep.vy); this.vz.set(keep.vz);
      if (!this.reducedMotion) this.freeUntil = this.time + 0.12; // loosen briefly so the morph swirls
      this.visible = true;
      this.opacityTarget = 1;
      this.start();
      return;
    }
    const { width, height, scale } = this.layout;
    const home = this.reducedMotion || entry === "home";
    for (let i = 0; i < this.total; i++) {
      if (home) {
        this.px[i] = this.hx[i]; this.py[i] = this.hy[i]; this.pz[i] = this.hz[i];
      } else {
        this.px[i] = Math.random() * width;
        this.py[i] = Math.random() * height;
        this.pz[i] = (Math.random() - 0.5) * scale * 2;
      }
      this.vx[i] = this.vy[i] = this.vz[i] = 0;
    }
    this.freeUntil = this.reducedMotion ? 0 : this.time + 0.15;
    this.visible = true;
    this.opacityTarget = 1;
    // Landed in place: a soft breath outward and back says "arrived".
    if (home && !this.reducedMotion) this.burst(this.layout.cx, this.layout.cy, 0.28);
    this.start();
  }

  /** Dissolve the shape and fade out; `onDone` fires once fully hidden. */
  hide(onDone?: () => void) {
    if (!this.visible) { onDone?.(); return; }
    this.visible = false;
    this.opacityTarget = 0;
    this.onDone = onDone ?? null;
    if (!this.reducedMotion) this.burst(this.layout.cx, this.layout.cy, 0.6);
    this.start();
  }

  /** Blow every particle outward from (x, y); they spring back on their own. */
  burst(x: number, y: number, power = 1) {
    if (!this.total) return;
    const speed = TUNING.BURST_SPEED * power;
    for (let i = 0; i < this.total; i++) {
      let dx = this.px[i] - x, dy = this.py[i] - y;
      let d = Math.hypot(dx, dy);
      if (d < 1) { dx = Math.random() - 0.5; dy = Math.random() - 0.5; d = Math.hypot(dx, dy); }
      const s = speed * (0.45 + Math.random() * 0.9) / d;
      this.vx[i] += dx * s + (Math.random() - 0.5) * speed * 0.3;
      this.vy[i] += dy * s + (Math.random() - 0.5) * speed * 0.3;
      this.vz[i] += (Math.random() - 0.5) * speed * 0.6;
    }
    this.freeUntil = this.time + TUNING.BURST_FREE_TIME * power;
  }

  setPointer(x: number, y: number, active: boolean) {
    const now = performance.now();
    if (active && this.pointer.active) {
      const dt = Math.max(0.004, (now - this.pointerVel.t) / 1000);
      if (dt < 0.2) {
        // Blend toward the instantaneous velocity so jittery input stays smooth.
        const vx = (x - this.pointer.x) / dt, vy = (y - this.pointer.y) / dt;
        this.pointerVel.x += (vx - this.pointerVel.x) * 0.5;
        this.pointerVel.y += (vy - this.pointerVel.y) * 0.5;
      }
    } else { this.pointerVel.x = 0; this.pointerVel.y = 0; }
    this.pointerVel.t = now;
    this.pointer.x = x; this.pointer.y = y; this.pointer.active = active;
  }

  // ── Loop ───────────────────────────────────────────────────────────────────
  private start() {
    if (this.raf || !this.gl) return;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  stop() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  destroy() {
    // Only stop the loop. The WebGL context belongs to the canvas element and
    // is collected with it; forcing it lost here would hand React's strict-mode
    // remount a dead context from the same canvas.
    this.stop();
    this.gl = null;
  }

  private frame = (now: number) => {
    this.raf = 0;
    const dt = Math.min(0.033, Math.max(0.001, (now - this.last) / 1000));
    this.last = now;
    this.time += dt;

    // Whole-artwork fade.
    const step = dt / TUNING.FADE;
    this.opacity += Math.sign(this.opacityTarget - this.opacity) * Math.min(step, Math.abs(this.opacityTarget - this.opacity));
    this.canvas.style.opacity = this.opacity.toFixed(3);

    this.simulate(dt);
    this.render();

    if (!this.visible && this.opacity <= 0) {
      this.onDone?.(); this.onDone = null;
      return; // fully hidden: stop the loop
    }
    this.raf = requestAnimationFrame(this.frame);
  };

  private simulate(dt: number) {
    const { cx, cy, scale, width, height } = this.layout;
    const t = this.time;
    const free = t < this.freeUntil;
    const k = free ? TUNING.SPRING * 0.08 : TUNING.SPRING;
    const damp = Math.exp(-(free ? TUNING.DAMPING * 0.35 : TUNING.DAMPING) * dt);

    // Tilt toward the cursor (or drift gently when idle).
    let targetY = 0, targetX = 0;
    if (this.pointer.active) {
      targetY = Math.max(-1, Math.min(1, (this.pointer.x - cx) / (width / 2))) * TUNING.TILT;
      targetX = -Math.max(-1, Math.min(1, (this.pointer.y - cy) / (height / 2))) * TUNING.TILT;
    } else if (!this.reducedMotion) {
      targetY = Math.sin(t * 0.31) * TUNING.TILT * 0.25;
      targetX = Math.cos(t * 0.23) * TUNING.TILT * 0.15;
    }
    this.tiltY += (targetY - this.tiltY) * TUNING.TILT_EASE;
    this.tiltX += (targetX - this.tiltX) * TUNING.TILT_EASE;

    // Cursor in the cloud's flat space: inverse-rotate the screen point at z=0.
    const cY = Math.cos(this.tiltY), sY = Math.sin(this.tiltY);
    const cX = Math.cos(this.tiltX), sX = Math.sin(this.tiltX);
    let curX = 0, curY = 0;
    if (this.pointer.active) {
      const vx0 = this.pointer.x - cx, vy0 = this.pointer.y - cy;
      // Inverse of: rotateY then rotateX (see render) applied to (x, y, 0).
      const y1 = vy0 * cX, z1 = -vy0 * sX;          // undo rotateX
      const x2 = vx0 * cY - z1 * sY;                 // undo rotateY (x component)
      curX = cx + x2; curY = cy + y1;
    }
    const R = TUNING.CURSOR_RADIUS, R2 = R * R;
    // The wake fades once the cursor stops moving.
    const velDecay = Math.exp(-6 * dt);
    this.pointerVel.x *= velDecay; this.pointerVel.y *= velDecay;
    const wakeX = this.pointerVel.x * TUNING.CURSOR_DRAG, wakeY = this.pointerVel.y * TUNING.CURSOR_DRAG;

    const sway = this.reducedMotion ? 0 : TUNING.SWAY;
    const swX = sway * Math.sin(t * 0.55), swY = sway * 0.6 * Math.cos(t * 0.42);

    for (let i = 0; i < this.total; i++) {
      const hx = this.hx[i] + swX + sway * 0.35 * Math.sin(t * 0.8 + this.hy[i] * 0.012);
      const hy = this.hy[i] + swY + sway * 0.35 * Math.cos(t * 0.7 + this.hx[i] * 0.012);
      let ax = (hx - this.px[i]) * k, ay = (hy - this.py[i]) * k, az = (this.hz[i] - this.pz[i]) * k;
      if (this.pointer.active) {
        const dx = this.px[i] - curX, dy = this.py[i] - curY;
        const d2 = dx * dx + dy * dy;
        if (d2 < R2 && d2 > 0.01) {
          const d = Math.sqrt(d2);
          const fall = 1 - d / R;
          const f = TUNING.CURSOR_STRENGTH * fall * fall;
          const nx = dx / d, ny = dy / d;
          ax += (nx - ny * TUNING.CURSOR_SWIRL) * f + wakeX * fall * fall;
          ay += (ny + nx * TUNING.CURSOR_SWIRL) * f + wakeY * fall * fall;
          az += f * 0.25;
        }
      }
      this.vx[i] = (this.vx[i] + ax * dt) * damp;
      this.vy[i] = (this.vy[i] + ay * dt) * damp;
      this.vz[i] = (this.vz[i] + az * dt) * damp;
      this.px[i] += this.vx[i] * dt;
      this.py[i] += this.vy[i] * dt;
      this.pz[i] += this.vz[i] * dt;
    }

    // Ambient dots drift slowly and wrap; the cursor nudges them a little.
    if (!this.reducedMotion) {
      for (let i = 0; i < this.ambientCount; i++) {
        const o = i * 7;
        let ax = 0, ay = 0;
        if (this.pointer.active) {
          const dx = this.ambient[o] - this.pointer.x, dy = this.ambient[o + 1] - this.pointer.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < R2 && d2 > 0.01) { const d = Math.sqrt(d2); const f = TUNING.CURSOR_STRENGTH * 0.12 * (1 - d / R) ** 2; ax = dx / d * f; ay = dy / d * f; }
        }
        this.ambient[o + 2] = (this.ambient[o + 2] + ax * dt) * 0.98 + (Math.random() - 0.3) * 0.08;
        this.ambient[o + 3] = (this.ambient[o + 3] + ay * dt) * 0.98;
        this.ambient[o] += this.ambient[o + 2] * dt;
        this.ambient[o + 1] += this.ambient[o + 3] * dt;
        if (this.ambient[o] > width + 4) this.ambient[o] = -4; else if (this.ambient[o] < -4) this.ambient[o] = width + 4;
        if (this.ambient[o + 1] > height + 4) this.ambient[o + 1] = -4; else if (this.ambient[o + 1] < -4) this.ambient[o + 1] = height + 4;
      }
    }

    for (let d = 0; d < this.dustCount; d++) {
      const o = d * 8;
      this.dust[o + 5] += dt;
      if (this.dust[o + 5] >= this.dust[o + 6] || this.dust[o] > width + 20) { this.spawnDust(d, false); continue; }
      this.dust[o] += this.dust[o + 3] * dt;
      this.dust[o + 1] += (this.dust[o + 4] + Math.sin(t * 1.3 + d) * 6) * dt;
    }
    void scale;
  }

  private render() {
    const gl = this.gl;
    if (!gl) return;
    const { cx, cy, scale, width, height, dpr } = this.layout;
    const F = scale * TUNING.FOCAL;
    const cY = Math.cos(this.tiltY), sY = Math.sin(this.tiltY);
    const cX = Math.cos(this.tiltX), sX = Math.sin(this.tiltX);
    const v = this.vertices;
    const twinkle = this.reducedMotion ? 0 : TUNING.TWINKLE;
    const t = this.time;
    let n = 0;

    for (let i = 0; i < this.total; i++) {
      const x = this.px[i] - cx, y = this.py[i] - cy, z = this.pz[i];
      const halo = i >= this.count;
      // rotateY then rotateX
      const x1 = x * cY + z * sY, z1 = -x * sY + z * cY;
      const y2 = y * cX - z1 * sX, z2 = y * sX + z1 * cX;
      const persp = F / Math.max(F * 0.3, F - z2);
      const l = this.lum[i];
      const depthLight = 0.85 + 0.35 * (z2 / scale);
      const tw = 1 - twinkle * 0.5 * (1 + Math.sin(t * (1.4 + this.phase[i] * 1.8) + this.phase[i] * 40));
      const o = n * STRIDE;
      v[o] = cx + x1 * persp; v[o + 1] = cy + y2 * persp;
      v[o + 2] = TUNING.SIZE * (1 - TUNING.SIZE_BY_BRIGHTNESS * 0.5 + TUNING.SIZE_BY_BRIGHTNESS * l) * persp * (halo ? 0.7 : 1);
      v[o + 3] = this.col[i * 3]; v[o + 4] = this.col[i * 3 + 1]; v[o + 5] = this.col[i * 3 + 2];
      v[o + 6] = (halo ? 0.9 * l : 0.38 + 0.62 * Math.sqrt(l)) * depthLight * tw * this.opacity;
      n++;
    }
    for (let d = 0; d < this.dustCount; d++) {
      const q = d * 8;
      const x = this.dust[q] - cx, y = this.dust[q + 1] - cy, z = this.dust[q + 2];
      const x1 = x * cY + z * sY, z1 = -x * sY + z * cY;
      const y2 = y * cX - z1 * sX, z2 = y * sX + z1 * cX;
      const persp = F / Math.max(F * 0.3, F - z2);
      const life = this.dust[q + 5] / this.dust[q + 6];
      const env = Math.sin(Math.PI * life);
      const o = n * STRIDE;
      v[o] = cx + x1 * persp; v[o + 1] = cy + y2 * persp;
      v[o + 2] = this.dust[q + 7] * persp;
      const hl = this.shape?.highlight ?? [1, 1, 1];
      v[o + 3] = hl[0]; v[o + 4] = hl[1]; v[o + 5] = hl[2];
      v[o + 6] = 0.55 * env * this.opacity;
      n++;
    }

    // Ambient dots: flat (no tilt), faint, slow twinkle.
    const hl = this.shape?.highlight ?? [1, 1, 1];
    for (let i = 0; i < this.ambientCount; i++) {
      const q = i * 7;
      const tw = 1 - twinkle * 0.6 * (1 + Math.sin(t * (0.6 + this.ambient[q + 4]) + this.ambient[q + 4] * 30)) * 0.5;
      const o = n * STRIDE;
      v[o] = this.ambient[q]; v[o + 1] = this.ambient[q + 1];
      v[o + 2] = this.ambient[q + 5];
      v[o + 3] = hl[0]; v[o + 4] = hl[1]; v[o + 5] = hl[2];
      v[o + 6] = this.ambient[q + 6] * TUNING.AMBIENT_BRIGHTNESS * tw * this.opacity;
      n++;
    }

    gl.clear(gl.COLOR_BUFFER_BIT);

    // Accent glow behind everything.
    if (TUNING.ACCENT_GLOW > 0 && this.shape) {
      gl.useProgram(this.glowProgram);
      gl.disableVertexAttribArray(this.aSize);
      gl.disableVertexAttribArray(this.aColor);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.glowBuffer);
      gl.enableVertexAttribArray(this.aClip);
      gl.vertexAttribPointer(this.aClip, 2, gl.FLOAT, false, 0, 0);
      const [r, g, b] = this.shape.shadow;
      gl.uniform2f(this.uGlowCenter, cx * dpr, (height - cy) * dpr);
      gl.uniform1f(this.uGlowRadius, scale * TUNING.ACCENT_GLOW_RADIUS * dpr);
      gl.uniform3f(this.uGlowColor, r, g, b);
      gl.uniform1f(this.uGlowAlpha, TUNING.ACCENT_GLOW * this.opacity);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    // Particles.
    gl.useProgram(this.program);
    gl.uniform2f(this.uRes, width, height);
    gl.uniform1f(this.uDpr, dpr);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, v.subarray(0, n * STRIDE), gl.DYNAMIC_DRAW);
    const bytes = STRIDE * 4;
    gl.enableVertexAttribArray(this.aPos); gl.vertexAttribPointer(this.aPos, 2, gl.FLOAT, false, bytes, 0);
    gl.enableVertexAttribArray(this.aSize); gl.vertexAttribPointer(this.aSize, 1, gl.FLOAT, false, bytes, 8);
    gl.enableVertexAttribArray(this.aColor); gl.vertexAttribPointer(this.aColor, 4, gl.FLOAT, false, bytes, 12);
    gl.drawArrays(gl.POINTS, 0, n);
  }
}

/** Decode an image URL into a ParticleShape (RGBA pixels + palette). */
export async function loadShape(src: string, shadow: string, highlight: string, gamma = 1): Promise<ParticleShape> {
  const img = new Image();
  img.decoding = "async";
  img.src = src;
  await img.decode();
  const c = document.createElement("canvas");
  c.width = img.naturalWidth; c.height = img.naturalHeight;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  const { data } = ctx.getImageData(0, 0, c.width, c.height);
  return { width: c.width, height: c.height, data, shadow: hexToRgb(shadow), highlight: hexToRgb(highlight), gamma };
}
