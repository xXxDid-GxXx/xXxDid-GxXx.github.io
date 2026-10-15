"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, useMotionValue, animate, useReducedMotion } from "framer-motion";
import type { PanInfo } from "framer-motion";
import type { PickerProps } from "@/types/case";
import { PickerItem } from "./PickerItem";
import { PickerItemFocused } from "./PickerItemFocused";

// Cards are full-bleed: each one fills the measured container (the whole
// screen), so the focused preview covers the viewport edge to edge.

// Drum geometry — items ride the surface of a vertical cylinder, exactly like
// the iOS Clock alarm picker. Each item rotates around an axis sitting one
// "radius" behind it (via originZ), so it curves back over the top/bottom edge
// instead of shrinking on a flat plane. No scaling: perspective foreshortening
// alone makes the rows compress as they turn away. radius = cardHeight / angle
// keeps neighbouring rows roughly one card-height apart along the arc.
const ANGLE_DEG     = 26;   // degrees of arc between adjacent items
const DRUM_VISIBLE  = 1;    // front-facing items shown on each side of centre —
                            // anything further back is hidden so the wrap-around
                            // card never sweeps backward through the front
const PERSPECTIVE_K = 1.15; // perspective distance as a multiple of the radius

// Slot-machine intro
const INTRO_REVS       = 2;   // full revolutions before settling
const INTRO_MIN_DELAY  = 36;  // relative step weight at full speed
const INTRO_MAX_DELAY  = 300; // relative step weight for the final, slow steps
const INTRO_SPIN_MS    = 900; // total wall-clock duration of the whole spin
const INTRO_SETTLE_HOLD_MS = 150; // brief pause after the spin stops before it scales up on centre

// Gamble spin (the "Press me for gamble!" button) — longer + more revolutions
// than the intro for slot-machine suspense, landing on a random case. The
// choreography mirrors the intro: the wheel shrinks to the centre of the
// viewport, spins, then grows back to full screen once it settles.
const GAMBLE_REVS      = 4;
const GAMBLE_SPIN_MS   = 2400;
const GAMBLE_SHRINK_MS = 750;  // wait for the shrink (SETTLE_SCALE) before spinning
const GAMBLE_HOLD_MS   = 1000; // pause on the landed case (still small) before growing back
// The wheel spins noticeably smaller while centred, then grows to its full size
// (1) on the scale-up step — a bigger jump so the wheel clearly enlarges.
const INTRO_FILL_SCALE = 0.4;
// The spin starts on the first visible frame so the wheel is already spinning as
// it fades up from black — nothing on screen, then a spinning wheel appears.
const INTRO_ENTRANCE_MS = 50;

const SPRING       = { type: "spring", stiffness: 300, damping: 30, mass: 0.8 } as const;
const TWEEN_A11Y   = { type: "tween",  duration: 0.12, ease: "easeOut"       } as const;
// Shrink from full-screen back to the contained wheel — smooth ease-out, no bounce.
const SETTLE_SCALE = { type: "tween",  duration: 0.75, ease: [0.22, 1, 0.36, 1] } as const;
const INSTANT      = { duration: 0 } as const;

// Wheel input → exactly one case per gesture.
// Mouse wheels send discrete notches (big integer deltas, or line/page mode):
// one notch = one case, with a short lock so a single click can't double-fire.
// Trackpads and smooth-scrolling mice send a stream of small deltas plus an
// inertia tail: accumulate to a threshold, step once, then stay locked until
// the stream goes quiet so the momentum can't carry on to the next case.
const MOUSE_NOTCH_MIN    = 50;   // |deltaY| at or above this (integer) reads as a mouse notch
const MOUSE_LOCK_MS      = 280;  // min gap between mouse-notch steps
const TRACKPAD_THRESHOLD = 30;   // accumulated |deltaY| that triggers one step
const TRACKPAD_QUIET_MS  = 200;  // stream must pause this long before the next swipe counts

export function Picker({ items, initialSlug = "healthcare-er", onFocusChange, intro = false, centered = false, gambleNonce = 0, onIntroEnd, onScrollingChange }: PickerProps) {
  const n = items.length;
  const initial = Math.max(0, items.findIndex((i) => i.slug === initialSlug));
  const [focusedIndex, setFocusedIndex] = useState(initial);
  // Latest focus, readable from inside spin timers without re-subscribing.
  const focusedIndexRef = useRef(focusedIndex);
  focusedIndexRef.current = focusedIndex;
  // True while a gamble spin is in flight, so user input is ignored.
  const gambleSpinningRef = useRef(false);
  // True from the gamble press until the spin settles — the wheel renders
  // scaled down (centred) for the whole gamble, like the intro.
  const [gambleScaled, setGambleScaled] = useState(false);
  // Timestamp until which the post-spin hold runs; keeps the "scrolling" state
  // asserted (chrome faded) while the landed case sits small on centre.
  const gambleHoldUntilRef = useRef(0);
  const router = useRouter();

  const prefersReducedMotion = useReducedMotion() ?? false;
  const transition = prefersReducedMotion ? TWEEN_A11Y : SPRING;

  // Responsive geometry — cards fill the measured container height (the whole
  // screen). Start with a sane default so SSR and the first client render
  // agree, then measure the real height after hydration.
  const rootRef = useRef<HTMLDivElement>(null);
  const [containerH, setContainerH] = useState(540);
  useEffect(() => {
    const measure = () => {
      if (rootRef.current) setContainerH(rootRef.current.clientHeight);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const { cardHeight, slotHeight, radius, perspective } = useMemo(() => {
    const ch = containerH;
    const r  = Math.round(ch / ((ANGLE_DEG * Math.PI) / 180));
    return {
      cardHeight: ch,
      slotHeight: ch,
      radius: r,
      perspective: Math.round(r * PERSPECTIVE_K),
    };
  }, [containerH]);

  const containerY = useMotionValue(0);

  // Section 3.6: debounced live region
  const [liveText, setLiveText] = useState("");
  const liveTimer = useRef<NodeJS.Timeout | null>(null);
  const skipFirstLiveRef = useRef(true);

  useEffect(() => {
    if (skipFirstLiveRef.current) { skipFirstLiveRef.current = false; return; }
    if (liveTimer.current) clearTimeout(liveTimer.current);
    liveTimer.current = setTimeout(() => {
      setLiveText(`Case ${focusedIndex + 1} of ${n}: ${items[focusedIndex]?.title ?? ""}`);
    }, 300);
    return () => { if (liveTimer.current) clearTimeout(liveTimer.current); };
  }, [focusedIndex, n, items]);

  const navigate = useCallback(() => {
    const slug = items[focusedIndex]?.slug;
    if (slug) router.push(`/case/${slug}`);
  }, [router, items, focusedIndex]);

  const advance = useCallback((steps: number) => {
    const prev = focusedIndexRef.current;
    const next = (prev + steps + n) % n;
    if (next === prev) return;
    setFocusedIndex(next);
    // Report outward AFTER the updater, not inside it: a setState run during the
    // updater fires "Cannot update a component while rendering a different one".
    onFocusChange?.(items[next].slug);
  }, [n, items, onFocusChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (introActiveRef.current || gambleSpinningRef.current) return;
    if (e.key === "ArrowDown") { e.preventDefault(); advance(1);  }
    else if (e.key === "ArrowUp") { e.preventDefault(); advance(-1); }
    else if (e.key === "Enter")   { e.preventDefault(); navigate(); }
  }, [advance, navigate]);

  const handleDragEnd = useCallback((_: PointerEvent, info: PanInfo) => {
    const offset = containerY.get();
    const projected = offset + info.velocity.y * 0.3;
    // At most one case per swipe — a fast flick used to skip several.
    const slots = Math.max(-1, Math.min(1, -Math.round(projected / slotHeight)));
    if (slots !== 0) {
      const prev = focusedIndexRef.current;
      const next = (prev + slots + n) % n;
      if (next !== prev) {
        setFocusedIndex(next);
        onFocusChange?.(items[next].slug);
      }
    }
    animate(containerY, 0, prefersReducedMotion ? TWEEN_A11Y : SPRING);
  }, [containerY, n, items, onFocusChange, prefersReducedMotion, slotHeight]);

  // Tapping a neighbour brings it into focus. Tapping the focused card does
  // nothing — the case only opens from the "See full case" button.
  const handleItemTap = useCallback((arrayIndex: number, position: number) => {
    if (position === 0) return;
    setFocusedIndex(arrayIndex);
    onFocusChange?.(items[arrayIndex].slug);
  }, [items, onFocusChange]);

  const advanceRef = useRef(advance);
  advanceRef.current = advance;

  useEffect(() => {
    let lockedUntil = 0; // no steps before this timestamp
    let accumulated = 0; // trackpad delta gathered towards the next step
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (introActiveRef.current || gambleSpinningRef.current) return;
      const dy = e.deltaY;
      if (dy === 0) return;
      const now = performance.now();
      const isMouseNotch =
        e.deltaMode !== 0 || (Math.abs(dy) >= MOUSE_NOTCH_MIN && Number.isInteger(dy));

      if (isMouseNotch) {
        if (now < lockedUntil) return;
        lockedUntil = now + MOUSE_LOCK_MS;
        accumulated = 0;
        advanceRef.current(Math.sign(dy));
        return;
      }

      // Trackpad / smooth stream: while locked, every event (incl. inertia)
      // pushes the lock out, so one swipe = one step.
      if (now < lockedUntil) {
        lockedUntil = now + TRACKPAD_QUIET_MS;
        return;
      }
      // A direction change starts a fresh accumulation.
      if (Math.sign(dy) !== Math.sign(accumulated)) accumulated = 0;
      accumulated += dy;
      if (Math.abs(accumulated) < TRACKPAD_THRESHOLD) return;
      advanceRef.current(Math.sign(accumulated));
      accumulated = 0;
      lockedUntil = now + TRACKPAD_QUIET_MS;
    };
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Slot-machine intro: when `intro` turns on, spin the wheel through a few
  // revolutions and decelerate to a stop on the initial case, then hand control
  // back (onIntroEnd) so the wheel can shrink to its contained size. The spin
  // runs an exact whole number of revolutions, so it ends on `initial`
  // (healthcare-er by default),
  // and writes nothing to the URL (onFocusChange is skipped).
  const introStartedRef = useRef(false);
  const onIntroEndRef = useRef(onIntroEnd);
  onIntroEndRef.current = onIntroEnd;
  const introActiveRef = useRef(intro);
  introActiveRef.current = intro;
  useEffect(() => {
    if (!intro || introStartedRef.current) return;
    introStartedRef.current = true;

    const steps = INTRO_REVS * n; // lands back on `initial`
    // Ease-out step weights (slower toward the end), normalised so the whole
    // spin lasts exactly INTRO_SPIN_MS regardless of how many steps there are.
    const weights = Array.from({ length: steps }, (_, k) => {
      const t = steps > 1 ? k / (steps - 1) : 0; // 0 → 1
      return INTRO_MIN_DELAY + (INTRO_MAX_DELAY - INTRO_MIN_DELAY) * t * t;
    });
    const wSum = weights.reduce((a, b) => a + b, 0) || 1;
    const delays = weights.map((w) => (w / wSum) * INTRO_SPIN_MS);

    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    const step = () => {
      setFocusedIndex((prev) => (prev + 1) % n);
      i += 1;
      if (i < steps) {
        timer = setTimeout(step, delays[i]);
      } else {
        // Landed — hold a beat (wheel sits centred), then hand control back so
        // it slides to its right-hand resting position.
        timer = setTimeout(() => onIntroEndRef.current?.(), INTRO_SETTLE_HOLD_MS);
      }
    };
    timer = setTimeout(step, INTRO_ENTRANCE_MS);
    return () => {
      clearTimeout(timer);
      // Cancelled before landing (e.g. React's dev double-mount, which runs the
      // cleanup straight after the first setup) — allow the next run to start
      // the spin again, or the wheel stays locked in the intro forever.
      if (i < steps) introStartedRef.current = false;
    };
  }, [intro, n]);

  // Gamble spin: bumping `gambleNonce` spins the wheel through several
  // revolutions and decelerates to a stop on a RANDOM case (slot machine). The
  // final landing reports outward (URL + preview) via onFocusChange.
  //
  // The effect is keyed on gambleNonce ONLY, with everything else read through
  // refs: the landing's URL write re-renders the page with a fresh `items`
  // identity, and a dep on it would re-run this effect mid-hold — its cleanup
  // clearing the pending timer and stranding the wheel scaled down.
  const gambleNonceRef = useRef(0);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const onFocusChangeRef = useRef(onFocusChange);
  onFocusChangeRef.current = onFocusChange;
  useEffect(() => {
    if (!gambleNonce || gambleNonce === gambleNonceRef.current) return;
    gambleNonceRef.current = gambleNonce;

    const n = itemsRef.current.length;
    const current = focusedIndexRef.current;
    const target = Math.floor(Math.random() * n);
    const offset = (target - current + n) % n;
    const steps = GAMBLE_REVS * n + offset; // lands on `target`

    const weights = Array.from({ length: steps }, (_, k) => {
      const t = steps > 1 ? k / (steps - 1) : 0; // 0 → 1, ease-out
      return INTRO_MIN_DELAY + (INTRO_MAX_DELAY - INTRO_MIN_DELAY) * t * t;
    });
    const wSum = weights.reduce((a, b) => a + b, 0) || 1;
    const delays = weights.map((w) => (w / wSum) * GAMBLE_SPIN_MS);

    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    gambleSpinningRef.current = true;
    // Shrink the wheel to the centre first; the spin only starts once the
    // scale-down has landed.
    setGambleScaled(true);
    const step = () => {
      const next = (focusedIndexRef.current + 1) % n;
      setFocusedIndex(next);
      // Report every step so the preview text rolls through the cases as the
      // wheel spins (the URL write is debounced downstream, so only the final
      // landing actually changes the URL). Reported after the updater, never
      // inside it, to avoid setState-during-render on the parent.
      onFocusChangeRef.current?.(itemsRef.current[next].slug);
      i += 1;
      if (i < steps) {
        timer = setTimeout(step, delays[i]);
      } else {
        // Landed — hold a beat so the selected case reads (still small, chrome
        // still faded), then grow back to full screen.
        gambleHoldUntilRef.current = performance.now() + GAMBLE_HOLD_MS;
        timer = setTimeout(() => {
          gambleSpinningRef.current = false;
          setGambleScaled(false);
        }, GAMBLE_HOLD_MS);
      }
    };
    timer = setTimeout(step, GAMBLE_SHRINK_MS + (delays[0] ?? 16));
    return () => clearTimeout(timer);
  }, [gambleNonce]);

  // Report "scrolling" while the focused case is changing (intro spin, wheel,
  // drag or keyboard) and flip back to idle a beat after it settles. The host
  // uses this to hide the header/footer while the wheel is in motion.
  const onScrollingRef = useRef(onScrollingChange);
  onScrollingRef.current = onScrollingChange;
  const scrollIdleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollFirstRef = useRef(true);
  useEffect(() => {
    if (scrollFirstRef.current) { scrollFirstRef.current = false; return; }
    onScrollingRef.current?.(true);
    if (scrollIdleTimer.current) clearTimeout(scrollIdleTimer.current);
    // A gamble landing extends the idle flip through the post-spin hold, so
    // the chrome stays faded until the wheel starts growing back.
    const holdLeft = Math.max(0, gambleHoldUntilRef.current - performance.now());
    scrollIdleTimer.current = setTimeout(() => onScrollingRef.current?.(false), Math.max(450, holdLeft));
  }, [focusedIndex]);

  return (
    <motion.div
      ref={rootRef}
      className="h-full w-full"
      style={{
        transformOrigin: "center center",
        pointerEvents: centered ? "none" : "auto",
      }}
      initial={prefersReducedMotion || !intro ? false : { opacity: 0 }}
      animate={{ opacity: 1, scale: intro || gambleScaled ? INTRO_FILL_SCALE : 1 }}
      transition={
        prefersReducedMotion
          ? INSTANT
          : { opacity: { duration: 0.9, ease: "easeInOut" }, scale: SETTLE_SCALE }
      }
    >
    <motion.div
      tabIndex={0}
      role="listbox"
      aria-label="Case studies"
      aria-orientation="vertical"
      onKeyDown={handleKeyDown}
      drag={prefersReducedMotion ? false : "y"}
      style={{
        y: containerY,
        height: "100%",
        // No overflow clip here: the page (main) already clips at the viewport,
        // and clipping inside would cut the neighbour cards off above/below
        // while the wheel is scaled down (the clip is applied pre-scale).
        perspective: `${perspective}px`,
        perspectiveOrigin: "50% 50%",
      }}
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      className={`relative outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ink)] focus-visible:ring-offset-2${prefersReducedMotion ? "" : " cursor-grab active:cursor-grabbing"}`}
    >
      <div aria-live="polite" aria-atomic="true" className="sr-only">{liveText}</div>

      {items.map((item, arrayIndex) => {
        const rawPos = arrayIndex - focusedIndex;
        let position = rawPos;
        if (position > n / 2) position -= n;
        else if (position < -n / 2) position += n;

        const absPos    = Math.abs(position);
        const isVisible = absPos <= DRUM_VISIBLE;
        const isFocused = position === 0;

        // Drum: a card's offset from centre is pure rotation around the shared
        // axis one radius behind the wheel (originZ), so the previous/next
        // cards curve back over the top/bottom edge — no translation or
        // scaling; perspective foreshortening alone makes them recede, exactly
        // like a real spinning drum.
        const animatedRotateX = -position * ANGLE_DEG;
        const animatedOpacity = isVisible ? 1 : 0;

        return (
          <motion.div
            key={item.slug}
            role="option"
            aria-selected={isFocused}
            style={{
              position: "absolute",
              top: "50%",
              marginTop: -(slotHeight / 2),
              left: 0,
              right: 0,
              zIndex: isFocused ? 10 : Math.max(1, 4 - absPos),
              pointerEvents: isVisible ? "auto" : "none",
              cursor: isVisible && !isFocused ? "pointer" : "default",
              originY: 0.5,
              originZ: -radius,
              backfaceVisibility: "hidden",
            }}
            animate={{ y: 0, rotateX: animatedRotateX, scale: 1, opacity: animatedOpacity, originX: 0.5 }}
            transition={transition}
            onTap={() => handleItemTap(arrayIndex, position)}
          >
            {isFocused
              ? <PickerItemFocused item={item} cardHeight={cardHeight} centered={centered} />
              : <PickerItem item={item} position={position} cardHeight={cardHeight} blurAmount={4} />
            }
          </motion.div>
        );
      })}
    </motion.div>
    </motion.div>
  );
}
