"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { PickerItem } from "@/types/case";
import { PickerSection } from "@/components/picker/PickerSection";
import { ParticleArtwork } from "@/components/picker/ParticleArtwork";
import { isParticleCase } from "@/lib/particle-cases";

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

// Type scale for the homepage chrome. Everything on the stage picks from
// these so the hierarchy stays consistent: one display size for the title,
// one body size for the summary, one mono size for labels, one for chips.
const T = {
  title: "font-display text-[2rem] font-bold leading-[1.05] tracking-[-0.01em] md:text-[2.5rem]",
  summary: "font-body text-sm leading-[1.6] md:text-base",
  eyebrow: "font-body text-xs uppercase tracking-[0.2em] leading-none",
  meta: "font-body text-sm leading-none",
  action: "font-display text-sm font-bold leading-none",
};

// The button style on the stage: outlined, filling white on hover.
const BUTTON = `${T.action} group pointer-events-auto inline-flex cursor-pointer items-center gap-2 whitespace-nowrap border border-white/70 bg-transparent px-4 py-3 text-white transition-[background-color,color,transform,border-color,opacity] duration-200 ease-out hover:border-white hover:bg-white hover:text-[var(--color-ink)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black motion-reduce:transition-colors disabled:cursor-not-allowed`;

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
  // Tracks the wheel live; the preview text rolls through cases as it changes
  // (slot-machine) and settles on the landed case in place. `dir` is the way the
  // wheel moved to reach it (1 = to the next case, -1 = to the previous one), so
  // the text rolls in the same direction as the wheel.
  const [focus, setFocus] = useState({ slug: "healthcare-er", dir: 1 });
  const focusedSlug = focus.slug;
  const handleFocusedCaseChange = useCallback((slug: string) => {
    setFocus((prev) => {
      if (prev.slug === slug) return prev;
      const n = items.length;
      const from = items.findIndex((i) => i.slug === prev.slug);
      const to = items.findIndex((i) => i.slug === slug);
      // Shortest way round the cyclic wheel decides the direction.
      const step = (((to - from) % n) + n) % n;
      return { slug, dir: step === 0 ? prev.dir : step <= n / 2 ? 1 : -1 };
    });
  }, [items]);

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
  const edgeChromeHidden = chromeHidden;

  // After the spin scales up on centre, wait, then transfer to the right.
  useEffect(() => {
    if (phase !== "scaled") return;
    const t = setTimeout(() => setPhase("done"), TRANSFER_DELAY_MS);
    return () => clearTimeout(t);
  }, [phase]);

  // Which case's particle artwork is live. It follows the focused case even
  // while the wheel scrolls — the particles morph from one shape to the next
  // and dissolve when a photo case comes into focus — and only hides for the
  // centred intro spin, when the wheel is small.
  const spinning = centered;
  const particleSlug = !spinning && isParticleCase(focusedSlug) ? focusedSlug : null;
  // How the artwork arrives: after a spin the card already shows the dotted
  // shape, so the artwork starts in place; after scrolling in from a photo
  // case it flies in from a scatter.
  const [entry, setEntry] = useState<"scatter" | "home">("home");
  useEffect(() => {
    if (spinning) setEntry("home");
    else if (scrolling) setEntry("scatter");
  }, [spinning, scrolling]);

  const focusedItem = items.find((i) => i.slug === focusedSlug) ?? items[0];
  const focusedIndex = Math.max(0, items.findIndex((i) => i.slug === focusedSlug));
  // Actions step aside whenever the wheel is in motion and come back once it
  // has settled on a case.
  const buttonsHidden = centered || scrolling;

  return (
    <>
      {/* Picker — full-bleed: the wheel's cards fill the whole screen, so the
          focused case's preview covers the viewport edge to edge. The intro
          spins slightly scaled down, then settles up to full size. */}
      <div className="absolute inset-0">
        <div className="relative h-full w-full">
          <Suspense>
            <PickerSection
              items={items}
              intro={intro}
              centered={centered}
              onIntroEnd={() => setPhase("scaled")}
              onScrollingChange={setScrolling}
              onFocusedCaseChange={handleFocusedCaseChange}
            />
          </Suspense>

          {/* Live particle artwork for the cases in lib/particle-cases.ts —
              covers the focused card once the wheel settles on one of them. */}
          <div className="absolute inset-0 z-10">
            <ParticleArtwork slug={particleSlug} entry={entry} />
          </div>
        </div>
      </div>

      {/* Left column — header at top, the focused case's preview in the
          middle, the contact strip at the bottom. Header/footer fade while the
          wheel moves; the preview text stays put and ROLLS through cases as the
          wheel spins, settling on the landed case in place. */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-20 flex w-full flex-col justify-between px-[var(--space-gutter)] py-[var(--space-loose)] md:w-auto md:max-w-[min(40vw,440px)]">
        <div
          className={`self-start transition-opacity duration-300 ease-out ${
            edgeChromeHidden ? "pointer-events-none opacity-0" : "pointer-events-auto opacity-100"
          }`}
        >
          {header}
        </div>

        {/* Focused case — eyebrow, tagline, description, meta and the link to
            the case. The slot fades only during the intro (centred); after
            that it stays and the inner block rolls on every focus change, so
            it "spins" with the wheel and lands in place — from below when the
            wheel moves on to the next case, from above when it moves back.
            Pointer-transparent except for the link, so drags and swipes that
            start on the text still turn the wheel underneath. */}
        {focusedItem && (
          <div
            className={`pointer-events-none mt-auto mb-6 self-start overflow-hidden transition-opacity duration-300 ease-out md:my-0 ${
              centered ? "opacity-0" : "opacity-100"
            }`}
          >
            <motion.div
              key={focusedSlug}
              initial={{ y: 22 * focus.dir }}
              animate={{ y: 0 }}
              transition={{ type: "tween", duration: 0.2, ease: "easeOut" }}
              className="flex max-w-[36ch] flex-col items-start gap-5 md:gap-6"
            >
              {/* Type scale for the column (see the top of this file):
                  eyebrow → title → summary → meta → chips → action. */}
              <p className={T.eyebrow}>
                <span className="text-box">{String(focusedIndex + 1).padStart(2, "0")} · {focusedItem.year} · {focusedItem.company}</span>
              </p>
              {/* The project name is the hero. */}
              <h2 className={`m-0 ${T.title}`}>
                <span className="text-box">{focusedItem.title}</span>
              </h2>
              {/* One sentence on what it is. */}
              <p className={`max-w-[34ch] ${T.summary}`}>
                <span className="text-box-solid">{focusedItem.summary}</span>
              </p>
              {/* Meta — the role. */}
              <p className={T.meta}>
                <span className="text-box text-[var(--color-ink-soft)]">{focusedItem.role}</span>
              </p>
              {/* The way in — outlined, filling on hover. */}
              <Link
                href={`/case/${focusedItem.slug}`}
                aria-label={`See full case: ${focusedItem.title}`}
                tabIndex={buttonsHidden ? -1 : 0}
                className={`${BUTTON} ${
                  buttonsHidden ? "pointer-events-none opacity-0" : "opacity-100"
                }`}
              >
                See full case
                <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
              </Link>
            </motion.div>
          </div>
        )}

        <footer
          className={`self-start transition-opacity duration-300 ease-out ${
            edgeChromeHidden ? "pointer-events-none opacity-0" : "pointer-events-auto opacity-100"
          }`}
        >
          {contactStrip}
        </footer>
      </div>

      {/* Top right — case counter. Tracks the chrome: visible at rest, faded
          while the wheel spins centred. */}
      <div
        className={`pointer-events-none absolute right-[var(--space-gutter)] top-[var(--space-loose)] z-20 ${T.meta} transition-opacity duration-300 ease-out ${
          edgeChromeHidden ? "opacity-0" : "opacity-100"
        }`}
      >
        <span className="text-box tabular-nums">
          {String(focusedIndex + 1).padStart(2, "0")}
          {" / "}
          {String(items.length).padStart(2, "0")}
        </span>
      </div>

    </>
  );
}
