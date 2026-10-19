"use client";

import { useState, useCallback, useEffect, useRef, useMemo, useId } from "react";
import { useRouter } from "next/navigation";
import { motion, useMotionValue, useTransform, useVelocity, animate, useReducedMotion } from "framer-motion";
import type { MotionValue, PanInfo } from "framer-motion";
import type { PickerProps, PickerItem as PickerItemType } from "@/types/case";
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
                            // anything further back fades out so the wrap-around
                            // card never sweeps backward through the front
const DRUM_FADE     = 0.5;  // positions over which a card fades past DRUM_VISIBLE
const NEIGHBOUR_BLUR = 4;   // px of blur at one slot from centre (focused = sharp)
const PERSPECTIVE_K = 1.15; // perspective distance as a multiple of the radius

// Slot-machine intro
const INTRO_REVS       = 2;   // full revolutions before settling
const INTRO_SPIN_MS    = 900; // total wall-clock duration of the whole spin
const INTRO_SETTLE_HOLD_MS = 150; // brief pause after the spin stops before it scales up on centre

// Gamble spin (the "Press me to gamble!" button) — longer + more revolutions
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

// Smooth, free scrolling — modelled on Lenis as used by Codrops' "Atelier
// North" (duration-based cubic ease-out). The drum position is continuous:
// wheel and trackpad input move it proportionally, it eases towards the target
// and simply stops there — no snapping onto a case. The case nearest the
// centre is the active one. Deliberate jumps (keys, taps, spins) still land
// exactly on a case.
const WHEEL_PX_PER_CASE = 240;  // wheel delta (px) that turns the drum by one case
const WHEEL_EASE  = { type: "tween", duration: 0.9, ease: [0.33, 1, 0.68, 1] } as const; // cubic-out
const SETTLE_EASE = { type: "tween", duration: 0.6, ease: [0.33, 1, 0.68, 1] } as const;
const FLING_SECONDS = 0.3;      // drag release: glide on by velocity × this
const SPIN_EASE_INTRO  = [0.2, 0.7, 0.3, 1] as const;
const SPIN_EASE_GAMBLE = [0.15, 0.75, 0.25, 1] as const;

// Vertical motion blur while the drum moves: blur (px, along the direction of
// travel only) grows with the drum's speed (cases/second) up to a cap, and is
// switched off entirely below a small threshold so the wheel is sharp at rest.
const MOTION_BLUR_PER_SPEED = 2.2;  // px of blur per case/second
const MOTION_BLUR_MAX       = 18;   // px — reached during the fast part of a spin
const MOTION_BLUR_MIN       = 0.4;  // px — below this the filter is removed

const TWEEN_A11Y   = { type: "tween",  duration: 0.12, ease: "easeOut" } as const;
// Shrink from full-screen back to the contained wheel — smooth ease-out, no bounce.
const SETTLE_SCALE = { type: "tween",  duration: 0.75, ease: [0.22, 1, 0.36, 1] } as const;
const INSTANT      = { duration: 0 } as const;

const mod = (a: number, n: number) => ((a % n) + n) % n;
// Signed offset of a card from the drum's (continuous) centre, wrapped into
// [-n/2, n/2) so the drum is cyclic.
const wrapPos = (p: number, n: number) => mod(p + n / 2, n) - n / 2;

export function Picker({ items, initialSlug = "healthcare-er", onFocusChange, intro = false, centered = false, gambleNonce = 0, onIntroEnd, onScrollingChange }: PickerProps) {
  const n = items.length;
  const initial = Math.max(0, items.findIndex((i) => i.slug === initialSlug));
  const [focusedIndex, setFocusedIndex] = useState(initial);
  // Latest focus, readable from inside timers and listeners without re-subscribing.
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

  // ── Continuous drum position ────────────────────────────────────────────
  // `scroll` is the drum's position in cases (unbounded; mod n gives the case).
  // Every input — wheel, drag, keys, taps, intro and gamble spins — animates it;
  // the focused case is whichever whole position it's nearest to.
  const scroll = useMotionValue(initial);
  const targetRef = useRef(initial); // where the current motion is heading
  const animRef = useRef<ReturnType<typeof animate> | null>(null);
  const goTo = useCallback((to: number, transition: object) => {
    targetRef.current = to;
    animRef.current?.stop();
    animRef.current = animate(scroll, to, prefersReducedMotion ? TWEEN_A11Y : transition);
    return animRef.current;
  }, [scroll, prefersReducedMotion]);

  // Motion blur — driven by the drum's velocity, written straight to the SVG
  // filter and the drum's style (no React re-renders per frame).
  const velocity = useVelocity(scroll);
  const motionBlurId = `drum-motion-blur-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const blurNodeRef = useRef<SVGFEGaussianBlurElement>(null);
  const drumRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (prefersReducedMotion) return;
    return velocity.on("change", (v) => {
      const blur = Math.min(MOTION_BLUR_MAX, Math.abs(v) * MOTION_BLUR_PER_SPEED);
      const drum = drumRef.current;
      if (!drum) return;
      if (blur < MOTION_BLUR_MIN) {
        drum.style.filter = "";
        return;
      }
      blurNodeRef.current?.setAttribute("stdDeviation", `0 ${blur.toFixed(2)}`);
      drum.style.filter = `url(#${motionBlurId})`;
    });
  }, [velocity, motionBlurId, prefersReducedMotion]);

  const introActiveRef = useRef(intro);
  introActiveRef.current = intro;
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const onFocusChangeRef = useRef(onFocusChange);
  onFocusChangeRef.current = onFocusChange;

  // Derive the focused case from the continuous position. Reported outward
  // (URL + preview text) on every change except during the intro spin; the
  // URL write is debounced downstream, so a fast spin only lands once.
  useEffect(() => {
    return scroll.on("change", (v) => {
      const idx = mod(Math.round(v), n);
      if (idx === focusedIndexRef.current) return;
      focusedIndexRef.current = idx;
      setFocusedIndex(idx);
      if (!introActiveRef.current) onFocusChangeRef.current?.(itemsRef.current[idx].slug);
    });
  }, [scroll, n]);

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
    goTo(Math.round(targetRef.current) + steps, SETTLE_EASE);
  }, [goTo]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (introActiveRef.current || gambleSpinningRef.current) return;
    if (e.key === "ArrowDown") { e.preventDefault(); advance(1);  }
    else if (e.key === "ArrowUp") { e.preventDefault(); advance(-1); }
    else if (e.key === "Enter")   { e.preventDefault(); navigate(); }
  }, [advance, navigate]);

  // Drag / touch swipe: the drum follows the finger 1:1; on release it keeps
  // gliding with the release velocity and eases to a stop wherever that ends.
  const panStartRef = useRef(0);
  const handlePanStart = useCallback(() => {
    if (introActiveRef.current || gambleSpinningRef.current) return;
    animRef.current?.stop();
    panStartRef.current = scroll.get();
  }, [scroll]);
  const handlePan = useCallback((_: PointerEvent, info: PanInfo) => {
    if (introActiveRef.current || gambleSpinningRef.current) return;
    scroll.set(panStartRef.current - info.offset.y / slotHeight);
  }, [scroll, slotHeight]);
  const handlePanEnd = useCallback((_: PointerEvent, info: PanInfo) => {
    if (introActiveRef.current || gambleSpinningRef.current) return;
    goTo(scroll.get() - (info.velocity.y / slotHeight) * FLING_SECONDS, WHEEL_EASE);
  }, [scroll, slotHeight, goTo]);

  // Tapping a neighbour brings it into focus. Tapping the focused card does
  // nothing — the case only opens from the "See full case" button.
  const handleItemTap = useCallback((position: number) => {
    if (position === 0 || introActiveRef.current || gambleSpinningRef.current) return;
    goTo(Math.round(targetRef.current) + position, SETTLE_EASE);
  }, [goTo]);

  // Wheel / trackpad: move the drum proportionally to the delta with a smooth
  // ease-out, and leave it wherever the input stops.
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (introActiveRef.current || gambleSpinningRef.current) return;
      // Normalise line/page wheel modes to pixels.
      const dy = e.deltaY * (e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? window.innerHeight : 1);
      if (dy === 0) return;
      goTo(targetRef.current + dy / WHEEL_PX_PER_CASE, WHEEL_EASE);
    };
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [goTo]);

  // Slot-machine intro: when `intro` turns on, spin the drum through a few
  // whole revolutions with a strong ease-out so it lands back on `initial`,
  // hold a beat, then hand control back (onIntroEnd) so the wheel can shrink to
  // its contained size. Writes nothing to the URL (focus reports are muted
  // while `intro` is on).
  const introStartedRef = useRef(false);
  const onIntroEndRef = useRef(onIntroEnd);
  onIntroEndRef.current = onIntroEnd;
  const introLandingRef = useRef(initial + INTRO_REVS * n);
  useEffect(() => {
    if (!intro || introStartedRef.current) return;
    introStartedRef.current = true;

    let landed = false;
    let holdTimer: ReturnType<typeof setTimeout> | undefined;
    const startTimer = setTimeout(() => {
      goTo(introLandingRef.current, { type: "tween", duration: INTRO_SPIN_MS / 1000, ease: SPIN_EASE_INTRO })
        .then(() => {
          landed = true;
          holdTimer = setTimeout(() => onIntroEndRef.current?.(), INTRO_SETTLE_HOLD_MS);
        });
    }, INTRO_ENTRANCE_MS);
    return () => {
      clearTimeout(startTimer);
      if (holdTimer) clearTimeout(holdTimer);
      // Cancelled before landing (e.g. React's dev double-mount, which runs the
      // cleanup straight after the first setup) — allow the next run to start
      // the spin again, or the wheel stays locked in the intro forever.
      if (!landed) {
        animRef.current?.stop();
        introStartedRef.current = false;
      }
    };
  }, [intro, goTo]);

  // Gamble spin: bumping `gambleNonce` spins the drum through several
  // revolutions and decelerates to a stop on a RANDOM case (slot machine). The
  // preview text rolls through the cases as it spins; the landing is reported
  // outward (URL + preview) like any other focus change.
  //
  // The effect is keyed on gambleNonce ONLY, with everything else read through
  // refs: the landing's URL write re-renders the page with a fresh `items`
  // identity, and a dep on it would re-run this effect mid-hold — its cleanup
  // clearing the pending timer and stranding the wheel scaled down.
  const gambleNonceRef = useRef(0);
  const goToRef = useRef(goTo);
  goToRef.current = goTo;
  useEffect(() => {
    if (!gambleNonce || gambleNonce === gambleNonceRef.current) return;
    gambleNonceRef.current = gambleNonce;

    const n = itemsRef.current.length;
    const from = Math.round(targetRef.current);
    const target = Math.floor(Math.random() * n);
    const offset = mod(target - mod(from, n), n);
    const to = from + GAMBLE_REVS * n + offset; // lands on `target`

    gambleSpinningRef.current = true;
    // Shrink the wheel to the centre first; the spin only starts once the
    // scale-down has landed.
    setGambleScaled(true);
    let holdTimer: ReturnType<typeof setTimeout> | undefined;
    const startTimer = setTimeout(() => {
      // Mark the post-landing hold up front: the last focus change happens just
      // before the tween resolves, and the "scrolling" idle check needs to know
      // the hold is coming so the chrome stays faded until the wheel grows back.
      gambleHoldUntilRef.current = performance.now() + GAMBLE_SPIN_MS + GAMBLE_HOLD_MS;
      goToRef.current(to, { type: "tween", duration: GAMBLE_SPIN_MS / 1000, ease: SPIN_EASE_GAMBLE })
        .then(() => {
          // Landed — hold a beat so the selected case reads (still small, chrome
          // still faded), then grow back to full screen.
          holdTimer = setTimeout(() => {
            gambleSpinningRef.current = false;
            setGambleScaled(false);
          }, GAMBLE_HOLD_MS);
        });
    }, GAMBLE_SHRINK_MS);
    return () => {
      clearTimeout(startTimer);
      if (holdTimer) clearTimeout(holdTimer);
    };
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
    {/* Vertical-only Gaussian blur used as the drum's motion blur. */}
    <svg aria-hidden width="0" height="0" className="absolute">
      <filter id={motionBlurId} x="0" y="-20%" width="100%" height="140%">
        <feGaussianBlur ref={blurNodeRef} stdDeviation="0 0" />
      </filter>
    </svg>
    <motion.div
      ref={drumRef}
      tabIndex={0}
      role="listbox"
      aria-label="Case studies"
      aria-orientation="vertical"
      onKeyDown={handleKeyDown}
      onPanStart={handlePanStart}
      onPan={handlePan}
      onPanEnd={handlePanEnd}
      style={{
        height: "100%",
        // The page never scrolls behind the wheel, so let pans reach us on touch.
        touchAction: "none",
        // No overflow clip here: the page (main) already clips at the viewport,
        // and clipping inside would cut the neighbour cards off above/below
        // while the wheel is scaled down (the clip is applied pre-scale).
        perspective: `${perspective}px`,
        perspectiveOrigin: "50% 50%",
      }}
      className={`relative outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ink)] focus-visible:ring-offset-2${prefersReducedMotion ? "" : " cursor-grab active:cursor-grabbing"}`}
    >
      <div aria-live="polite" aria-atomic="true" className="sr-only">{liveText}</div>

      {items.map((item, arrayIndex) => {
        // Whole-case offset from the focused card — drives focus, hit-testing
        // and which image component renders. The visual rotation below uses
        // the continuous position instead.
        const position = Math.round(wrapPos(arrayIndex - focusedIndex, n));
        return (
          <DrumCard
            key={item.slug}
            item={item}
            arrayIndex={arrayIndex}
            n={n}
            scroll={scroll}
            position={position}
            radius={radius}
            slotHeight={slotHeight}
            cardHeight={cardHeight}
            centered={centered}
            onTap={() => handleItemTap(position)}
          />
        );
      })}
    </motion.div>
    </motion.div>
  );
}

type DrumCardProps = {
  item: PickerItemType;
  arrayIndex: number;
  n: number;
  scroll: MotionValue<number>;
  position: number;
  radius: number;
  slotHeight: number;
  cardHeight: number;
  centered: boolean;
  onTap: () => void;
};

// One card on the drum. Its rotation, fade, blur and stacking follow the
// continuous drum position frame by frame (no per-card springs), so wheel and
// drag input glide instead of stepping. A card's offset from centre is pure
// rotation around the shared axis one radius behind the wheel (originZ), so
// neighbours curve back over the top/bottom edge — perspective alone makes them
// recede, exactly like a real spinning drum.
function DrumCard({ item, arrayIndex, n, scroll, position, radius, slotHeight, cardHeight, centered, onTap }: DrumCardProps) {
  const pos = useTransform(scroll, (s) => wrapPos(arrayIndex - s, n));
  const rotateX = useTransform(pos, (p) => -p * ANGLE_DEG);
  const opacity = useTransform(pos, (p) => Math.max(0, Math.min(1, 1 - (Math.abs(p) - DRUM_VISIBLE) / DRUM_FADE)));
  const filter = useTransform(pos, (p) => {
    const b = Math.min(1, Math.abs(p)) * NEIGHBOUR_BLUR;
    return b < 0.05 ? "none" : `blur(${b.toFixed(2)}px)`;
  });
  const zIndex = useTransform(pos, (p) => Math.round(10 - Math.abs(p) * 3));

  const isFocused = position === 0;
  const isVisible = Math.abs(position) <= DRUM_VISIBLE;

  return (
    <motion.div
      role="option"
      aria-selected={isFocused}
      style={{
        position: "absolute",
        top: "50%",
        marginTop: -(slotHeight / 2),
        left: 0,
        right: 0,
        rotateX,
        opacity,
        filter,
        zIndex,
        pointerEvents: isVisible ? "auto" : "none",
        cursor: isVisible && !isFocused ? "pointer" : "default",
        originX: 0.5,
        originY: 0.5,
        originZ: -radius,
        backfaceVisibility: "hidden",
      }}
      onTap={onTap}
    >
      {isFocused
        ? <PickerItemFocused item={item} cardHeight={cardHeight} centered={centered} />
        : <PickerItem item={item} position={position} cardHeight={cardHeight} />
      }
    </motion.div>
  );
}
