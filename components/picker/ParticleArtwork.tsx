"use client";

import { useEffect, useRef, useState } from "react";
import { PARTICLE_CASES } from "@/lib/particle-cases";
import { ParticleEngine, getCaseShape, subjectLayout } from "@/lib/particle-engine";

type Props = {
  /** Slug of the particle case to show, or null to hide (dissolve + fade). */
  slug: string | null;
  /** How a shape arrives when nothing is on screen yet: flying in from a
   *  scatter, or already in place (after the wheel spun with the dotted card
   *  showing, so the artwork simply takes over). */
  entry?: "scatter" | "home";
  /** Fires when a revealed shape has formed (fly-in settled), and when the
   *  artwork is told to hide — so the page can show text in step with the art. */
  onFormed?: () => void;
  /** Fires once, the moment the first artwork is about to appear (its shape is
   *  decoded and the fly-in starts) — or at once if nothing will be drawn. The
   *  page keeps the stage black until then, so nothing half-loaded shows. */
  onReveal?: () => void;
  className?: string;
};

// Taps shorter than this and moving less than this count as a click → burst.
const TAP_MS = 350;
const TAP_PX = 8;
// Phone tilt: degrees of lean that give the full tilt, and how fast the
// "neutral" holding angle follows the phone (so any comfortable grip is the
// rest position and only movement away from it tilts the artwork).
const TILT_FULL_DEG = 22;
const TILT_REST_FOLLOW = 0.012;
// Cursor hint ("click me"): appears a moment after the cursor settles over the
// subject, stays briefly, fades. Shown until the visitor bursts the shape once.
const HINT_DELAY_MS = 500;
const HINT_SHOW_MS = 2600;
const HINT_REST_PX = 14;  // cursor movement per frame above this counts as "moving"

/**
 * Full-stage particle artwork layered over the homepage wheel. It is
 * pointer-transparent (so the wheel still drags and the buttons still click)
 * and listens to the window for the cursor, taps and touch. One WebGL context
 * lives for the page; the shape swaps (morphs) with the focused case.
 */
export function ParticleArtwork({ slug, entry = "scatter", onFormed, onReveal, className = "" }: Props) {
  const onFormedRef = useRef(onFormed);
  onFormedRef.current = onFormed;
  const onRevealRef = useRef(onReveal);
  onRevealRef.current = onReveal;
  const revealedRef = useRef(false);
  const reveal = () => {
    if (revealedRef.current) return;
    revealedRef.current = true;
    onRevealRef.current?.();
  };
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ParticleEngine | null>(null);
  const slugRef = useRef(slug);
  slugRef.current = slug;
  const entryRef = useRef(entry);
  entryRef.current = entry;

  // Cursor hint state: where it sits and whether it is showing.
  const [hint, setHint] = useState<{ x: number; y: number; on: boolean }>({ x: 0, y: 0, on: false });
  const hintRef = useRef({ done: false, timer: 0 as ReturnType<typeof setTimeout> | 0, shownAt: 0, lastX: 0, lastY: 0 });
  const hideHint = () => {
    const h = hintRef.current;
    if (h.timer) { clearTimeout(h.timer); h.timer = 0; }
    setHint((s) => (s.on ? { ...s, on: false } : s));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = new ParticleEngine(canvas);
    engineRef.current = engine;
    // Dev only: lets the headless checks read the engine's state.
    if (process.env.NODE_ENV !== "production") (window as unknown as { __particleEngine?: ParticleEngine }).__particleEngine = engine;
    // No WebGL: nothing will ever form, so let the page show at once.
    if (!engine.supported) { reveal(); onFormedRef.current?.(); return; }
    engine.onFormed = () => onFormedRef.current?.();

    const rm = window.matchMedia("(prefers-reduced-motion: reduce)");
    engine.reducedMotion = rm.matches;
    const onRm = () => { engine.reducedMotion = rm.matches; };
    rm.addEventListener("change", onRm);

    // Warm the image cache so the first reveal is instant.
    Object.keys(PARTICLE_CASES).forEach(getCaseShape);

    const measure = () => engine.resize(canvas.clientWidth, canvas.clientHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(canvas);

    // Pointer: track on the window since the canvas never receives events.
    let downX = 0, downY = 0, downT = 0;
    const toLocal = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onMove = (e: PointerEvent) => {
      const { x, y } = toLocal(e);
      engine.setPointer(x, y, true);
      if (e.pointerType !== "mouse") return;
      // Hint: only over the subject, only while an artwork is up, only until
      // the first burst. It waits for the cursor to come to rest.
      const h = hintRef.current;
      if (h.done || !slugRef.current) return;
      const { cx, cy, scale } = subjectLayout(canvas.clientWidth, canvas.clientHeight);
      const over = Math.abs(x - cx) < scale * 0.9 && Math.abs(y - cy) < scale * 0.9;
      const moved = Math.hypot(x - h.lastX, y - h.lastY);
      h.lastX = x; h.lastY = y;
      if (!over) { hideHint(); return; }
      if (moved > HINT_REST_PX) {
        // Still moving: restart the wait (and keep a showing hint following).
        if (h.timer) { clearTimeout(h.timer); h.timer = 0; }
        setHint((s) => (s.on ? { x, y, on: true } : s));
        if (!h.shownAt) {
          h.timer = setTimeout(() => {
            h.timer = 0; h.shownAt = performance.now();
            setHint({ x: h.lastX, y: h.lastY, on: true });
            h.timer = setTimeout(() => { h.timer = 0; h.shownAt = 0; setHint((s) => ({ ...s, on: false })); }, HINT_SHOW_MS);
          }, HINT_DELAY_MS);
        }
      } else {
        setHint((s) => (s.on ? { x, y, on: true } : s));
      }
    };
    const onDown = (e: PointerEvent) => {
      const { x, y } = toLocal(e);
      downX = x; downY = y; downT = performance.now();
      engine.setPointer(x, y, true);
    };
    const onUp = (e: PointerEvent) => {
      const { x, y } = toLocal(e);
      const target = e.target as Element | null;
      const isControl = !!target?.closest?.("button, a, input, textarea, select");
      if (!isControl && performance.now() - downT < TAP_MS && Math.hypot(x - downX, y - downY) < TAP_PX) {
        engine.burst(x, y);
        // They found it: no more hints this page load.
        hintRef.current.done = true;
        hideHint();
      }
      // A finger lifting leaves no hover: release the cursor on touch.
      if (e.pointerType !== "mouse") engine.setPointer(x, y, false);
    };
    const onLeave = () => { engine.setPointer(0, 0, false); hideHint(); };

    // Phone tilt → artwork tilt. Orientation events need a secure context,
    // and on iOS a permission that can only be requested from a tap, so the
    // request rides on the first touch; a refusal just leaves the drift.
    type OrientationCtor = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<"granted" | "denied"> };
    const touchDevice = window.matchMedia("(hover: none)").matches;
    let restBeta: number | null = null;
    let orientationOn = false;
    const onOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta == null || e.gamma == null || rm.matches) return;
      // Portrait: gamma leans left/right, beta tips toward/away. Landscape
      // swaps them (and flips with the side the phone is turned to).
      const angle = (screen.orientation?.angle ?? 0) % 360;
      let lean = e.gamma, tip = e.beta;
      if (angle === 90) { lean = e.beta; tip = -e.gamma; }
      else if (angle === 270) { lean = -e.beta; tip = e.gamma; }
      if (restBeta === null) restBeta = tip;
      restBeta += (tip - restBeta) * TILT_REST_FOLLOW;
      engine.setOrientation(lean / TILT_FULL_DEG, (tip - restBeta) / TILT_FULL_DEG, true);
    };
    const startOrientation = () => {
      if (orientationOn) return;
      orientationOn = true;
      window.addEventListener("deviceorientation", onOrientation, { passive: true });
    };
    const Ctor = (typeof DeviceOrientationEvent !== "undefined" ? DeviceOrientationEvent : undefined) as OrientationCtor | undefined;
    const needsPermission = !!Ctor?.requestPermission;
    let permissionAsked = false;
    const askOrientation = () => {
      if (permissionAsked || !Ctor?.requestPermission) return;
      permissionAsked = true;
      Ctor.requestPermission().then((state) => { if (state === "granted") startOrientation(); }).catch(() => {});
    };
    // Chrome also exposes requestPermission but grants it without a gesture;
    // iOS rejects until a tap, so a refusal here just defers to the first touch.
    if (touchDevice && Ctor && window.isSecureContext) {
      if (!needsPermission) startOrientation();
      else Ctor.requestPermission!().then((state) => { if (state === "granted") startOrientation(); }).catch(() => {});
    }
    const onDownOrientation = () => { if (touchDevice && needsPermission && window.isSecureContext && !orientationOn) askOrientation(); };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDownOrientation, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("pointercancel", onLeave);
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);

    return () => {
      rm.removeEventListener("change", onRm);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDownOrientation);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("deviceorientation", onOrientation);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onLeave);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
      engine.destroy();
      engineRef.current = null;
      hideHint();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show / morph / hide with the focused case.
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine?.supported) return;
    if (!slug) { engine.hide(); reveal(); onFormedRef.current?.(); return; }
    let cancelled = false;
    getCaseShape(slug).then((shape) => {
      // Only reveal if this is still the wanted case by the time it decoded.
      if (!cancelled && slugRef.current === slug) { reveal(); engine.show(shape, entryRef.current); }
    }).catch(() => { reveal(); onFormedRef.current?.(); /* image missing: the card stays dark */ });
    return () => { cancelled = true; };
  }, [slug]);

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden
        className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
        style={{ opacity: 0 }}
      />
      {/* Cursor hint — a faint label trailing the cursor, eased in and out. */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 z-30 whitespace-nowrap font-body text-[11px] uppercase tracking-[0.2em] text-white/70 transition-opacity duration-700 ease-out motion-reduce:transition-none"
        style={{
          transform: `translate(${hint.x + 18}px, ${hint.y + 22}px)`,
          opacity: hint.on ? 1 : 0,
          textShadow: "0 0 12px rgba(0,0,0,0.9)",
        }}
      >
        click me
      </span>
    </>
  );
}
