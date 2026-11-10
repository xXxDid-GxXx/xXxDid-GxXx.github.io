"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
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
 * The homepage stage: the full-bleed case wheel, the live particle artwork
 * over it, and the text column (name, roles and contacts at the top, the
 * focused case in the middle). On load the wheel is already at rest on the
 * initial case and its particles fly in from a scatter to form the shape.
 */

// The stage reveals when the first artwork is ready, or after this long at the latest.
const READY_TIMEOUT_MS = 2500;
// How long someone can sit on the stage without turning the wheel before the
// scroll hint appears.
const HINT_IDLE_MS = 5000;

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

// Small square arrow buttons beside the counter (same family as the chips).
const ARROW =
  "inline-flex h-8 w-8 cursor-pointer items-center justify-center border border-white/35 bg-[#0E0E0E]/70 font-body text-sm leading-none text-white transition-[background-color,color,border-color,transform] duration-200 ease-out hover:border-white hover:bg-white hover:text-[var(--color-ink)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white motion-reduce:transition-colors";

// The button style on the stage: outlined, filling white on hover.
const BUTTON = `${T.action} group pointer-events-auto inline-flex cursor-pointer items-center gap-2 whitespace-nowrap border border-white/70 bg-transparent px-4 py-3 text-white transition-[background-color,color,transform,border-color,opacity] duration-200 ease-out hover:border-white hover:bg-white hover:text-[var(--color-ink)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black motion-reduce:transition-colors disabled:cursor-not-allowed`;

export function HomeStage({ items, header, contactStrip }: Props) {
  // True while the wheel is turning; the text column steps aside meanwhile.
  const [scrolling, setScrolling] = useState(false);
  // The case the wheel is on (or nearest to), tracked live.
  const [focusedSlug, setFocusedSlug] = useState("healthcare-er");
  const handleFocusedCaseChange = useCallback((slug: string) => setFocusedSlug(slug), []);

  // Which case's particle artwork is live. It follows the focused case even
  // while the wheel scrolls — the particles morph from one shape to the next
  // and dissolve when a photo case comes into focus. On first load, and when
  // arriving from a photo case, the shape flies in from a scatter.
  const particleSlug = isParticleCase(focusedSlug) ? focusedSlug : null;

  const focusedItem = items.find((i) => i.slug === focusedSlug) ?? items[0];
  const focusedIndex = Math.max(0, items.findIndex((i) => i.slug === focusedSlug));
  // Previous / next buttons beside the counter: turn the wheel one case.
  const [jump, setJump] = useState<{ slug: string; nonce: number } | null>(null);
  const step = (d: number) => {
    const next = items[(focusedIndex + d + items.length) % items.length];
    if (next) setJump({ slug: next.slug, nonce: Date.now() });
  };
  // The page is plain black until the first artwork is ready to appear (its
  // shape decoded, fly-in about to start). Then the whole stage — wheel,
  // dotted card, live particles, header, counter, contacts and the case
  // column — fades in together, so nothing half-loaded ever shows. After that
  // the case column alone hides whenever the wheel is in motion and comes
  // back once it has settled on a case.
  const [ready, setReady] = useState(false);
  // Safety net: whatever happens to the artwork (a stalled image, a browser
  // quirk, a script error inside the engine), the page must never stay black.
  useEffect(() => {
    const t = setTimeout(() => setReady(true), READY_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, []);
  const chrome = `transition-opacity duration-700 ease-out ${ready ? "opacity-100" : "opacity-0"}`;
  const columnHidden = scrolling || !ready;

  // Scroll hint. Nothing says the stage is a wheel, but a permanent cue is
  // noise for people who scroll anyway. So once the stage is up, if nobody has
  // turned the wheel for a few seconds, a small "scroll" label trails the
  // cursor (below the artwork's own "click me", which sits closer to it). With
  // no cursor — touch, or a mouse that never moved — the "next" arrow nods
  // instead. The first wheel tick, swipe, key or turn dismisses it for good.
  const [hint, setHint] = useState({ x: 0, y: 0, on: false, cursor: false });
  const hintDoneRef = useRef(false);
  useEffect(() => {
    if (!ready) return;
    const touch = window.matchMedia("(hover: none)").matches;
    let shown = false;
    let pos = { x: -1, y: -1 };
    const dismiss = () => {
      if (hintDoneRef.current) return;
      hintDoneRef.current = true;
      clearTimeout(timer);
      setHint((h) => ({ ...h, on: false }));
    };
    const onMove = (e: PointerEvent) => {
      if (touch || hintDoneRef.current) return;
      pos = { x: e.clientX, y: e.clientY };
      if (shown) setHint({ x: pos.x, y: pos.y, on: true, cursor: true });
    };
    const timer = setTimeout(() => {
      if (hintDoneRef.current) return;
      shown = true;
      const cursor = !touch && pos.x >= 0;
      setHint({ x: pos.x, y: pos.y, on: true, cursor });
    }, HINT_IDLE_MS);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("wheel", dismiss, { passive: true });
    window.addEventListener("touchmove", dismiss, { passive: true });
    window.addEventListener("keydown", dismiss);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("wheel", dismiss);
      window.removeEventListener("touchmove", dismiss);
      window.removeEventListener("keydown", dismiss);
    };
  }, [ready]);
  // Any turn of the wheel (including the arrows) counts as "they got it".
  useEffect(() => {
    if (!scrolling) return;
    hintDoneRef.current = true;
    setHint((h) => (h.on ? { ...h, on: false } : h));
  }, [scrolling]);
  const nudgeArrow = hint.on && !hint.cursor;

  return (
    <>
      {/* Picker — full-bleed: the wheel's cards fill the whole screen, so the
          focused case's preview covers the viewport edge to edge. */}
      <div className={`absolute inset-0 transition-opacity duration-700 ease-out ${ready ? "opacity-100" : "opacity-0"}`}>
        <div className="relative h-full w-full">
          <Suspense>
            <PickerSection
              items={items}
              jumpTo={jump}
              onScrollingChange={setScrolling}
              onFocusedCaseChange={handleFocusedCaseChange}
            />
          </Suspense>

          {/* Live particle artwork for the cases in lib/particle-cases.ts —
              covers the focused card once the wheel settles on one of them. */}
          <div className="pointer-events-none absolute inset-0 z-10">
            <ParticleArtwork slug={particleSlug} entry="scatter" onReveal={() => setReady(true)} />
          </div>
        </div>
      </div>

      {/* Left column — name, roles and contacts at the top (one "business
          card" block), the focused case's preview in the middle. The preview
          text ROLLS through cases as the wheel spins, settling on the landed
          case in place. */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-20 flex w-full flex-col justify-between px-[var(--space-gutter)] py-[max(var(--space-loose),var(--space-gutter))] md:w-auto md:max-w-[min(40vw,440px)]">
        <div className={`pointer-events-auto flex flex-col items-start gap-5 self-start ${chrome}`}>
          {header}
          {contactStrip}
        </div>

        {/* Focused case — eyebrow, title, summary, role and the link to the
            case. The block is unmounted while the wheel turns and mounted
            again, as fresh DOM (keyed by case), once it settles — never
            swapping text in place. iOS WebKit otherwise repaints cached tiles
            of the previous case's text over the new one ("ghost" labels).
            Pointer-transparent except for the link, so drags and swipes that
            start on the text still turn the wheel underneath. */}
        {focusedItem && !columnHidden && (
          <div
            key={focusedItem.slug}
            className="pointer-events-none mt-auto mb-6 flex max-w-[36ch] animate-[column-in_300ms_ease-out_both] flex-col items-start gap-4 self-start md:my-0 md:gap-6"
          >
            {/* Type scale for the column (see the top of this file):
                eyebrow → title → summary → meta → action. */}
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
            {/* Meta — the role. Dropped on phones to keep the stack short. */}
            <p className={`hidden md:block ${T.meta}`}>
              <span className="text-box text-[var(--color-ink-soft)]">{focusedItem.role}</span>
            </p>
            {/* The way in — outlined, filling on hover. */}
            <Link
              href={`/case/${focusedItem.slug}`}
              aria-label={`See full case: ${focusedItem.title}`}
              className={BUTTON}
            >
              See full case
              <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
            </Link>
          </div>
        )}

        {/* Keeps the case column centred between the top block and the
            bottom edge (the column is justified "between" the three). */}
        <div aria-hidden />
      </div>

      {/* Counter and previous / next arrows, as one block: the counter above,
          the arrows under it, right-aligned. Top-right on larger screens,
          where the counter also carries the focused case's name — it tracks
          the wheel live, reading out the cases while the case column is
          hidden. On phones the top is the header's, so the block sits
          bottom-right, level with the "See full case" button. The arrows
          point the way the wheel turns, doubling as the swipe hint. */}
      <div
        className={`absolute right-[var(--space-gutter)] bottom-[calc(max(var(--space-loose),var(--space-gutter))+1.5rem)] z-20 flex flex-col items-end gap-2 md:bottom-auto md:top-[max(var(--space-loose),var(--space-gutter))] ${chrome}`}
      >
        <span className={`pointer-events-none text-box tabular-nums ${T.meta}`}>
          <span className="hidden md:inline">{focusedItem?.title} · </span>
          {String(focusedIndex + 1).padStart(2, "0")}
          {" / "}
          {String(items.length).padStart(2, "0")}
        </span>
        <div className="pointer-events-auto flex gap-2">
          <button type="button" onClick={() => step(-1)} aria-label="Previous case" className={ARROW}>
            ↑
          </button>
          <button type="button" onClick={() => step(1)} aria-label="Next case" className={ARROW}>
            <span className={nudgeArrow ? "scroll-cue-arrow inline-block" : "inline-block"}>↓</span>
          </button>
        </div>
      </div>

      {/* Idle scroll hint, trailing the cursor (see the hook above). */}
      <span
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-40 inline-flex items-center gap-1.5 whitespace-nowrap font-body text-[11px] uppercase tracking-[0.2em] text-white/70 transition-opacity duration-700 ease-out motion-reduce:transition-none"
        style={{
          transform: `translate(${hint.x + 18}px, ${hint.y + 40}px)`,
          opacity: hint.on && hint.cursor ? 1 : 0,
          textShadow: "0 0 12px rgba(0,0,0,0.9)",
        }}
      >
        scroll
        <span className="scroll-cue-arrow inline-block text-sm leading-none text-white">↓</span>
      </span>

    </>
  );
}
