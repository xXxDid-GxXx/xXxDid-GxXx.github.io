"use client";

import { useEffect, useRef } from "react";

/**
 * Water-ripple layer for the homepage wheel: moving the cursor (or a finger)
 * leaves rings that spread, interfere and calm down, like dragging a fingertip
 * across water.
 *
 * - Physics: a classic two-buffer height-field wave simulation on a coarse grid
 *   (one cell per CELL_PX css pixels), run on the CPU — a few thousand cells,
 *   well under a millisecond per frame.
 * - Look: the height field is uploaded as a half-float texture and a WebGL2
 *   fragment shader turns its slopes into light (crests) and shade (troughs),
 *   composited over the wheel. It shades the image rather than refracting it.
 * - Cost: the loop sleeps as soon as the water is calm, so at rest it's free.
 *
 * Pointer-transparent; listens to pointer moves on the window so ripples follow
 * the cursor over the whole wheel, including during drags and touch swipes.
 * Disabled for reduced-motion users and where WebGL2 is unavailable.
 */
const CELL_PX   = 6;      // css px per simulation cell
const DAMPING   = 0.968;  // energy kept per step (lower = rings stay local, calm faster)
const SUBSTEPS  = 2;      // simulation steps per frame (wave speed)
const PUSH      = 0.6;    // depth of the dent a moving pointer makes
const PUSH_SPEED_GAIN = 0.01;  // extra depth per px moved since the last event
const PUSH_MAX  = 1.2;
const PUSH_RADIUS = 2;    // cells around the pointer that get pushed
const CALM      = 0.004;  // below this peak height the loop goes to sleep
const SHADE     = 3.0;    // slope → light/shade strength
const MAX_DPR   = 1.5;

const VERT = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  vUv.y = 1.0 - vUv.y; // grid row 0 is the top of the screen
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
uniform sampler2D uHeight;
uniform vec2 uTexel;
uniform float uShade;
in vec2 vUv;
out vec4 outColor;
void main() {
  float l = texture(uHeight, vUv - vec2(uTexel.x, 0.0)).r;
  float r = texture(uHeight, vUv + vec2(uTexel.x, 0.0)).r;
  float u = texture(uHeight, vUv - vec2(0.0, uTexel.y)).r;
  float d = texture(uHeight, vUv + vec2(0.0, uTexel.y)).r;
  vec2 slope = vec2(r - l, d - u);
  // Light from the upper left: slopes facing it brighten, the rest darken.
  float light = dot(slope, normalize(vec2(-0.6, -0.8))) * uShade;
  // A tight sparkle on the steepest crest faces.
  float sparkle = pow(clamp(light, 0.0, 1.0), 6.0) * 0.25;
  // Mostly light: crests brighten, troughs only darken faintly.
  float a = light > 0.0
    ? clamp(light * 0.35 + sparkle, 0.0, 0.22)
    : clamp(-light * 0.12, 0.0, 0.06);
  vec3 c = light > 0.0 ? vec3(1.0) : vec3(0.0);
  outColor = vec4(c * a, a); // premultiplied alpha
}`;

export function WaterRipple() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = canvasRef.current;
    const gl = canvas?.getContext("webgl2", { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!canvas || !gl) return;

    // ── GL setup ────────────────────────────────────────────────────────────
    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return sh;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); // half-float is filterable in WebGL2
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    const uTexel = gl.getUniformLocation(prog, "uTexel");
    gl.uniform1f(gl.getUniformLocation(prog, "uShade"), SHADE);
    gl.uniform1i(gl.getUniformLocation(prog, "uHeight"), 0);
    gl.clearColor(0, 0, 0, 0);

    // ── Simulation grid ─────────────────────────────────────────────────────
    let cols = 0, rows = 0;
    let cur = new Float32Array(0), prev = new Float32Array(0);
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const w = canvas.clientWidth, h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      cols = Math.max(2, Math.ceil(w / CELL_PX));
      rows = Math.max(2, Math.ceil(h / CELL_PX));
      cur = new Float32Array(cols * rows);
      prev = new Float32Array(cols * rows);
      gl.uniform2f(uTexel, 1 / cols, 1 / rows);
      gl.clear(gl.COLOR_BUFFER_BIT);
    };
    resize();

    const step = () => {
      // next = (sum of 4 neighbours) / 2 - previous, damped; edges stay flat.
      for (let y = 1; y < rows - 1; y++) {
        const row = y * cols;
        for (let x = 1; x < cols - 1; x++) {
          const i = row + x;
          prev[i] = ((cur[i - 1] + cur[i + 1] + cur[i - cols] + cur[i + cols]) * 0.5 - prev[i]) * DAMPING;
        }
      }
      const t = cur; cur = prev; prev = t;
    };

    const push = (px: number, py: number, strength: number) => {
      const cx = Math.round(px / CELL_PX), cy = Math.round(py / CELL_PX);
      for (let dy = -PUSH_RADIUS; dy <= PUSH_RADIUS; dy++) {
        for (let dx = -PUSH_RADIUS; dx <= PUSH_RADIUS; dx++) {
          const x = cx + dx, y = cy + dy;
          if (x < 1 || y < 1 || x >= cols - 1 || y >= rows - 1) continue;
          const fall = 1 - Math.hypot(dx, dy) / (PUSH_RADIUS + 1);
          if (fall > 0) cur[y * cols + x] -= strength * fall;
        }
      }
    };

    // ── Loop (sleeps when calm) ─────────────────────────────────────────────
    let raf = 0;
    let running = false;
    const frame = () => {
      for (let s = 0; s < SUBSTEPS; s++) step();
      let peak = 0;
      for (let i = 0; i < cur.length; i++) {
        const v = Math.abs(cur[i]);
        if (v > peak) peak = v;
      }
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, cols, rows, 0, gl.RED, gl.FLOAT, cur);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (peak < CALM) {
        cur.fill(0);
        prev.fill(0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        running = false;
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    const wake = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(frame);
    };

    // ── Input: dent the water along the pointer's path ──────────────────────
    let last: { x: number; y: number } | null = null;
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      if (last) {
        const dist = Math.hypot(x - last.x, y - last.y);
        const strength = Math.min(PUSH_MAX, PUSH + dist * PUSH_SPEED_GAIN);
        // stamp along the segment so fast moves leave a continuous wake
        const n = Math.max(1, Math.ceil(dist / CELL_PX));
        for (let k = 1; k <= n; k++) {
          push(last.x + ((x - last.x) * k) / n, last.y + ((y - last.y) * k) / n, strength / Math.sqrt(n));
        }
      } else {
        push(x, y, PUSH);
      }
      last = { x, y };
      wake();
    };
    const onLeave = () => { last = null; };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onMove, { passive: true });
    window.addEventListener("pointerup", onLeave);
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
      window.removeEventListener("pointerup", onLeave);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", resize);
      gl.deleteTexture(tex);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-10 h-full w-full"
    />
  );
}
