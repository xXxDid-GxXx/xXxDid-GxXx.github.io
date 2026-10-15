"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import type { PickerItem } from "@/types/case";
import { PickerSection } from "@/components/picker/PickerSection";
import { LiquidButton } from "@/components/shell/LiquidButton";

type Props = {
  items: PickerItem[];
  header: ReactNode;
  contactStrip: ReactNode;
};

/**
 * Orchestrates the homepage intro: the wheel starts full-screen and spins like
 * a slot machine, then settles on the initial case and shrinks to its contained
 * size while the header and contact strip fade in.
 *
 * The full-screen state is rendered from the first frame (no zoom-in), so the
 * default phase is "intro". Reduced-motion users drop straight to "done".
 */
// How long the wheel sits scaled-up on centre before it transfers to the right.
const TRANSFER_DELAY_MS = 800;

// The intro spin plays once per real page load. This module-level flag survives
// client-side navigation (so returning from a case page skips the intro and
// lands straight on the resting layout) but resets on a hard reload / first
// visit, when the module is re-evaluated.
let hasPlayedIntro = false;

export function HomeStage({ items, header, contactStrip }: Props) {
  // intro: spinning, scaled down, centred. scaled: spun, scaled up, still
  // centred. done: transferred to the right resting position.
  const [phase, setPhase] = useState<"intro" | "scaled" | "done">(
    hasPlayedIntro ? "done" : "intro"
  );
  const [scrolling, setScrolling] = useState(false);
  // True from the moment the gamble button is pressed until the spin settles, so
  // only the button fades out for the duration of the gamble (the rest of the
  // chrome stays put).
  const [gambling, setGambling] = useState(false);
  // Tracks the wheel live; the preview text rolls through cases as it changes
  // (slot-machine) and settles on the landed case in place.
  const [focusedSlug, setFocusedSlug] = useState("healthcare-er");
  // Bumped on each gamble press to trigger a random slot-machine spin.
  const [gambleNonce, setGambleNonce] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) setPhase("done");
    // From now on the intro has been seen this page-load; later mounts (back
    // navigation) skip it.
    hasPlayedIntro = true;
  }, []);

  const intro = phase === "intro";
  // The wheel stays horizontally centred through the spin and the scaled-up hold;
  // it only leaves centre when it transfers right (phase "done").
  const centered = phase !== "done";
  // The left column (header / preview / footer) is hidden only while the wheel
  // is centred (spin + hold); it stays visible while the user scrolls the wheel.
  const chromeHidden = centered;

  // After the spin scales up on centre, wait, then transfer to the right.
  useEffect(() => {
    if (phase !== "scaled") return;
    const t = setTimeout(() => setPhase("done"), TRANSFER_DELAY_MS);
    return () => clearTimeout(t);
  }, [phase]);

  // Clear the gamble fade once the spin settles: `scrolling` is held true while
  // the wheel is in motion and flips back to idle a beat after it stops.
  const wasScrolling = useRef(false);
  useEffect(() => {
    if (wasScrolling.current && !scrolling) setGambling(false);
    wasScrolling.current = scrolling;
  }, [scrolling]);

  const focusedItem = items.find((i) => i.slug === focusedSlug) ?? items[0];

  return (
    <>
      {/* Picker — full-bleed: the wheel's cards fill the whole screen, so the
          focused case's preview image covers the viewport edge to edge. The
          intro spins slightly scaled down, then settles up to full size. */}
      <div className="absolute inset-0">
        <div className="relative h-full w-full">
          <Suspense>
            <PickerSection
              items={items}
              intro={intro}
              centered={centered}
              gambleNonce={gambleNonce}
              onIntroEnd={() => setPhase("scaled")}
              onScrollingChange={setScrolling}
              onFocusedCaseChange={setFocusedSlug}
            />
          </Suspense>

          {/* "See full case" (round liquid button) with the gamble action as a
              small rectangle underneath — one stacked column centred on screen
              over the full-screen preview. Both hide while the wheel spins. */}
          <div
            className={`absolute left-1/2 top-[40%] z-30 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-6 md:top-1/2 md:gap-8 transition-opacity duration-300 ease-out ${
              centered || gambling ? "pointer-events-none opacity-0" : "opacity-100"
            }`}
          >
            {focusedItem && (
              <LiquidButton
                href={`/case/${focusedItem.slug}`}
                disabled={centered || gambling}
                ariaLabel={`See full case: ${focusedItem.title}`}
              >
                See full
                <br />
                case →
              </LiquidButton>
            )}
            <button
              type="button"
              onClick={() => {
                setGambleNonce((g) => g + 1);
                setGambling(true);
              }}
              disabled={centered || gambling}
              aria-label="Press me to gamble — spin the wheel to a random case"
              // Hover: inverts to ink, tilts a touch like a tossed card and drops
              // the underline; press squashes it. Motion is skipped for users who
              // prefer reduced motion.
              className="group whitespace-nowrap bg-white px-2 py-1 font-display text-base font-bold text-[var(--color-ink)] cursor-pointer transition-[background-color,color,transform] duration-200 ease-out hover:-rotate-2 hover:bg-[var(--color-ink)] hover:text-white active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black motion-reduce:transition-colors motion-reduce:hover:rotate-0 disabled:cursor-not-allowed"
            >
              <span className="text-box underline decoration-2 underline-offset-2 transition-[background-color,text-underline-offset] duration-200 group-hover:bg-[var(--color-ink)]! group-hover:underline-offset-4">Press me to gamble!</span>
            </button>
          </div>
        </div>
      </div>

      {/* Left column — header at top, the focused case's short preview in the
          middle, the contact strip at the bottom. Header/footer fade while the
          wheel moves; the preview text stays put and ROLLS through cases as the
          wheel spins, settling on the landed case in place. */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-20 flex w-full flex-col justify-between px-[var(--space-gutter)] py-[var(--space-loose)] md:w-auto md:max-w-[min(40vw,440px)]">
        <div
          className={`pointer-events-auto self-start transition-opacity duration-300 ease-out ${
            chromeHidden ? "opacity-0" : "opacity-100"
          }`}
        >
          {header}
        </div>

        {/* Focused case — text/link lives here. The slot fades only during the
            intro (centred); after that it stays and the inner block rolls on
            every focus change, so it "spins" with the wheel and lands in place. */}
        {focusedItem && (
          <div
            className={`pointer-events-auto mt-auto mb-6 self-start overflow-hidden transition-opacity duration-300 ease-out md:my-0 ${
              centered ? "opacity-0" : "opacity-100"
            }`}
          >
            <motion.div
              key={focusedSlug}
              initial={{ y: 22 }}
              animate={{ y: 0 }}
              transition={{ type: "tween", duration: 0.2, ease: "easeOut" }}
              className="flex max-w-[34ch] flex-col items-start gap-5"
            >
              {/* Eyebrow — project name + year reads as a small label so the
                  tagline can be the deliberate hero (fixes the scale inversion). */}
              <p className="font-body text-xs uppercase tracking-[0.2em] leading-none">
                <span className="text-box">{focusedItem.title} · {focusedItem.year}</span>
              </p>
              {/* Hero statement — the largest element in the column. */}
              <p className="max-w-[24ch] font-display text-2xl font-medium leading-[1.35] md:text-3xl">
                <span className="text-box">{focusedItem.tagline}</span>
              </p>
              {/* Meta */}
              <p className="font-body text-sm">
                <span className="text-box text-[var(--color-ink-soft)]">{focusedItem.role}</span>
              </p>
            </motion.div>
          </div>
        )}

        <footer
          className={`pointer-events-auto self-start transition-opacity duration-300 ease-out ${
            chromeHidden ? "opacity-0" : "opacity-100"
          }`}
        >
          {contactStrip}
        </footer>
      </div>

      {/* Wheel affordances — case counter + scroll hint. Both track the chrome:
          visible at rest, hidden while the wheel is spinning. */}
      <div
        className={`pointer-events-none absolute right-[var(--space-gutter)] top-[var(--space-loose)] z-20 font-body text-sm transition-opacity duration-300 ease-out ${
          chromeHidden ? "opacity-0" : "opacity-100"
        }`}
      >
        <span className="text-box tabular-nums">
          {String(Math.max(0, items.findIndex((i) => i.slug === focusedSlug)) + 1).padStart(2, "0")}
          {" / "}
          {String(items.length).padStart(2, "0")}
        </span>
      </div>
    </>
  );
}
