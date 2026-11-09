"use client";

import { useEffect, useRef } from "react";
import type { MotionValue } from "framer-motion";
import { TUNING, getCaseShape, sampleShapePoints, subjectLayout, type ShapePoint } from "@/lib/particle-engine";

type Props = {
  slug: string;
  /** Drum speed in cases per second (Picker's velocity MotionValue). */
  velocity?: MotionValue<number>;
  /** Render only while the card can be seen on the drum. */
  active?: boolean;
};

// Speed → streak length / jitter. Streaks are vertical, like the drum's motion
// blur, and the dots shake loose a little when the wheel spins fast.
const STREAK_PER_SPEED = 16;  // px of streak per case/second
const STREAK_MAX = 48;
const JITTER_MAX = 7;         // px of shake at full speed
const JITTER_SPEED = 3;       // cases/second considered "full speed"

/**
 * The particle case's wheel card. Draws the subject as a few thousand dots
 * (sampled from the same cut-out the live artwork uses, laid out in the same
 * place) so the card reads as the shape while the drum spins: the dots
 * twinkle, streak with the drum's speed and shake loose on a fast spin. When
 * the wheel lands, the full-screen artwork fades in exactly on top of it.
 */
export function ParticleCardArt({ slug, velocity, active = true }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const velocityRef = useRef(velocity);
  velocityRef.current = velocity;
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let points: ShapePoint[] = [];
    let colors: string[] = [];
    let layout = { cx: 0, cy: 0, scale: 1 };
    let width = 0, height = 0, dpr = 1;
    let raf = 0;
    let disposed = false;
    const start = performance.now();

    const measure = () => {
      width = canvas.clientWidth; height = canvas.clientHeight;
      dpr = Math.min(1.5, window.devicePixelRatio || 1);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      layout = subjectLayout(width, height);
      draw(performance.now());
    };

    const draw = (now: number) => {
      raf = 0;
      if (disposed || !points.length || !width) return;
      const t = (now - start) / 1000;
      const speed = Math.abs(velocityRef.current?.get() ?? 0);
      const streak = reduce ? 0 : Math.min(STREAK_MAX, speed * STREAK_PER_SPEED);
      const jitter = reduce ? 0 : Math.min(1, speed / JITTER_SPEED) * JITTER_MAX;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";
      const { cx, cy, scale } = layout;
      // Long streaks are drawn fainter so the total light stays even.
      const streakFade = 1 / (1 + streak / 5);
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const phase = p.u * 7 + p.v * 5 + i * 0.013;
        const twinkle = reduce ? 1 : 0.8 + 0.2 * Math.sin(t * 1.7 + phase * 40);
        const x = cx + p.u * scale + (jitter ? Math.sin(t * 9 + phase * 50) * jitter : 0);
        const y = cy + p.v * scale + (jitter ? Math.cos(t * 7 + phase * 30) * jitter * 0.6 : 0);
        const size = TUNING.SIZE * (1 - TUNING.SIZE_BY_BRIGHTNESS * 0.5 + TUNING.SIZE_BY_BRIGHTNESS * p.lum) * 0.8;
        ctx.globalAlpha = (0.35 + 0.65 * Math.sqrt(p.lum)) * twinkle * streakFade;
        ctx.fillStyle = colors[i];
        if (streak > 1) ctx.fillRect(x - size / 2, y - streak / 2, size, streak + size);
        else ctx.fillRect(x - size / 2, y - size / 2, size, size);
      }
      // Keep animating while the card is on the drum; an idle, hidden or
      // reduced-motion card settles after this frame.
      if (activeRef.current && !document.hidden && !(reduce && speed === 0)) raf = requestAnimationFrame(draw);
    };

    const ro = new ResizeObserver(measure);
    ro.observe(canvas);
    measure();

    getCaseShape(slug).then((shape) => {
      if (disposed) return;
      const count = window.innerWidth < 768 ? TUNING.CARD_DOTS_MOBILE : TUNING.CARD_DOTS_DESKTOP;
      points = sampleShapePoints(shape, count);
      colors = points.map((p) => `rgb(${Math.round(p.r * 255)},${Math.round(p.g * 255)},${Math.round(p.b * 255)})`);
      if (!raf) raf = requestAnimationFrame(draw);
    }).catch(() => { /* no cut-out: the card stays dark */ });

    // Resume the loop when the card becomes active again or the tab returns.
    const kick = () => { if (!raf && !disposed) raf = requestAnimationFrame(draw); };
    const poll = setInterval(() => { if (activeRef.current) kick(); }, 400);
    document.addEventListener("visibilitychange", kick);

    return () => {
      disposed = true;
      ro.disconnect();
      clearInterval(poll);
      document.removeEventListener("visibilitychange", kick);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [slug]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{ backgroundColor: "var(--color-bg-dark)" }}
    />
  );
}
