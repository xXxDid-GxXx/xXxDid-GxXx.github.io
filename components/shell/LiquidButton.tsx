"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";

// Either a link (`href`) or a button (`onClick`).
type Props = {
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
  children: ReactNode;
};

// Liquid button — an original canvas implementation of the surface-tension
// "liquid" effect: points around the pill perimeter are sprung back to their
// rest position (tension), relaxed toward their neighbours (viscosity), gently
// idle-wobbled, and pushed into a bulge by the cursor. The canvas is larger
// than the button by MARGIN on every side, so the liquid can bulge beyond the
// pill without being clipped.
const COLOR = "#FFFFFF"; // single white liquid
const TENSION = 0.1; // spring back to rest
const VISCOSITY = 0.15; // neighbour smoothing
const DAMPING = 0.88;
const MARGIN = 40; // extra canvas room around the pill for the liquid to bulge into
const IDLE_AMP = 2; // idle wobble amplitude (px)
const IDLE_SPEED = 0.05; // idle wobble speed (rad/frame)
const MOUSE_RADIUS = 85;
const MOUSE_FORCE = 7;
const PRESS_IMPULSE = 24; // velocity kick on press — dents the liquid in, then it rebounds
const PRESS_RADIUS = 220; // falloff radius of the press impulse

type Pt = {
  ix: number; iy: number; // rest position
  nx: number; ny: number; // outward normal
  x: number; y: number; vx: number; vy: number;
  phase: number;
};

function drawBlob(ctx: CanvasRenderingContext2D, pts: Pt[], color: string) {
  const n = pts.length;
  if (!n) return;
  ctx.beginPath();
  ctx.moveTo((pts[n - 1].x + pts[0].x) / 2, (pts[n - 1].y + pts[0].y) / 2);
  for (let i = 0; i < n; i++) {
    const cur = pts[i];
    const next = pts[(i + 1) % n];
    ctx.quadraticCurveTo(cur.x, cur.y, (cur.x + next.x) / 2, (cur.y + next.y) / 2);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

/** Round white "liquid" call-to-action — renders a Next link when given `href`. */
export function LiquidButton({ href, onClick, disabled, ariaLabel, children }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const btnRef = useRef<HTMLElement>(null);
  const mouse = useRef({ x: -9999, y: -9999, inside: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    const btn = btnRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !btn || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0; // canvas size (button + 2*MARGIN)
    let h = 0;
    let pts: Pt[] = [];

    const build = () => {
      const rect = btn.getBoundingClientRect();
      const bw = rect.width;
      const bh = rect.height;
      if (bw === 0 || bh === 0) return;
      w = bw + 2 * MARGIN;
      h = bh + 2 * MARGIN;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      canvas.style.left = `${-MARGIN}px`;
      canvas.style.top = `${-MARGIN}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Round button: distribute points around an ellipse (a circle when the
      // button is square). cx/cy is the centre, rx/ry the radii.
      const cx = bw / 2;
      const cy = bh / 2;
      const rx = bw / 2;
      const ry = bh / 2;
      const circumference = Math.PI * (rx + ry); // Ramanujan-ish approximation
      const count = Math.max(48, Math.round(circumference / 6));
      pts = Array.from({ length: count }, (_, i) => {
        const ang = (i / count) * Math.PI * 2;
        const cos = Math.cos(ang);
        const sin = Math.sin(ang);
        const x = cx + rx * cos;
        const y = cy + ry * sin;
        // Offset by MARGIN so the disc sits centred inside the oversized canvas.
        return { ix: x + MARGIN, iy: y + MARGIN, nx: cos, ny: sin, x: x + MARGIN, y: y + MARGIN, vx: 0, vy: 0, phase: ang };
      });
    };

    let raf = 0;
    let t = 0;
    const frame = () => {
      t++;
      const m = mouse.current;
      for (const p of pts) {
        const idle = Math.sin(t * IDLE_SPEED + p.phase) * IDLE_AMP;
        let ax = (p.ix + p.nx * idle - p.x) * TENSION;
        let ay = (p.iy + p.ny * idle - p.y) * TENSION;
        if (m.inside) {
          const dx = p.x - m.x;
          const dy = p.y - m.y;
          const dist = Math.hypot(dx, dy) || 1;
          if (dist < MOUSE_RADIUS) {
            const f = (1 - dist / MOUSE_RADIUS) * MOUSE_FORCE;
            ax += (dx / dist) * f;
            ay += (dy / dist) * f;
          }
        }
        p.vx = (p.vx + ax) * DAMPING;
        p.vy = (p.vy + ay) * DAMPING;
        p.x += p.vx;
        p.y += p.vy;
      }
      const n = pts.length;
      for (let i = 0; i < n; i++) {
        const prev = pts[(i - 1 + n) % n];
        const next = pts[(i + 1) % n];
        const p = pts[i];
        p.x += ((prev.x + next.x) / 2 - p.x) * VISCOSITY;
        p.y += ((prev.y + next.y) / 2 - p.y) * VISCOSITY;
      }
      ctx.clearRect(0, 0, w, h);
      drawBlob(ctx, pts, COLOR);
      raf = requestAnimationFrame(frame);
    };

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.current.x = e.clientX - rect.left;
      mouse.current.y = e.clientY - rect.top;
    };
    const onEnter = () => { mouse.current.inside = true; };
    const onLeave = () => { mouse.current.inside = false; mouse.current.x = -9999; mouse.current.y = -9999; };
    const onPress = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      for (const p of pts) {
        const dx = px - p.x;
        const dy = py - p.y;
        const dist = Math.hypot(dx, dy) || 1;
        const f = PRESS_IMPULSE * Math.max(0, 1 - dist / PRESS_RADIUS);
        p.vx += (dx / dist) * f; // kick toward the press point → squish in, then rebound
        p.vy += (dy / dist) * f;
      }
    };

    btn.addEventListener("mousemove", onMove);
    btn.addEventListener("mouseenter", onEnter);
    btn.addEventListener("mouseleave", onLeave);
    btn.addEventListener("pointerdown", onPress);
    window.addEventListener("resize", build);

    build();
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      btn.removeEventListener("mousemove", onMove);
      btn.removeEventListener("mouseenter", onEnter);
      btn.removeEventListener("mouseleave", onLeave);
      btn.removeEventListener("pointerdown", onPress);
      window.removeEventListener("resize", build);
    };
  }, []);

  const className =
    "relative isolate inline-flex aspect-square w-32 cursor-pointer items-center justify-center rounded-full text-center font-display text-base font-bold leading-tight transition-transform active:scale-95 md:w-40 md:text-lg";
  const content = (
    <>
      <canvas ref={canvasRef} aria-hidden className="pointer-events-none absolute -z-10" />
      <span className="relative">{children}</span>
    </>
  );

  if (href) {
    return (
      <Link
        ref={btnRef as React.Ref<HTMLAnchorElement>}
        href={href}
        className={className}
        style={{ color: "var(--color-ink)" }}
        aria-label={ariaLabel}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : undefined}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      ref={btnRef as React.Ref<HTMLButtonElement>}
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${className} disabled:cursor-not-allowed disabled:opacity-60`}
      style={{ color: "var(--color-ink)" }}
      aria-label={ariaLabel}
    >
      {content}
    </button>
  );
}
