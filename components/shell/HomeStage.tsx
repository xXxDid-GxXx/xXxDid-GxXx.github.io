"use client";

import { Suspense, useCallback, useState } from "react";
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
 * over it, and the text column. On load the wheel is already at rest on the
 * initial case and its particles fly in from a scatter to form the shape.
 */

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
  // Nothing but the artwork shows until the first shape has formed on load:
  // header, counter, contacts and the case column all fade in together then.
  // After that the case column alone hides whenever the wheel is in motion
  // and comes back once it has settled on a case.
  const [formed, setFormed] = useState(false);
  const chrome = `transition-opacity duration-700 ease-out ${formed ? "opacity-100" : "opacity-0"}`;
  const columnHidden = scrolling || !formed;

  return (
    <>
      {/* Picker — full-bleed: the wheel's cards fill the whole screen, so the
          focused case's preview covers the viewport edge to edge. */}
      <div className="absolute inset-0">
        <div className="relative h-full w-full">
          <Suspense>
            <PickerSection
              items={items}
              onScrollingChange={setScrolling}
              onFocusedCaseChange={handleFocusedCaseChange}
            />
          </Suspense>

          {/* Live particle artwork for the cases in lib/particle-cases.ts —
              covers the focused card once the wheel settles on one of them. */}
          <div className="absolute inset-0 z-10">
            <ParticleArtwork slug={particleSlug} entry="scatter" onFormed={() => setFormed(true)} />
          </div>
        </div>
      </div>

      {/* Left column — header at top, the focused case's preview in the
          middle, the contact strip at the bottom. Header/footer fade while the
          wheel moves; the preview text stays put and ROLLS through cases as the
          wheel spins, settling on the landed case in place. */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-20 flex w-full flex-col justify-between px-[var(--space-gutter)] py-[var(--space-loose)] md:w-auto md:max-w-[min(40vw,440px)]">
        <div className={`pointer-events-auto self-start ${chrome}`}>{header}</div>

        {/* Focused case — eyebrow, title, summary, role and the link to the
            case. The whole block fades out while the wheel turns and fades
            back once it settles, so text and button always move together.
            Pointer-transparent except for the link, so drags and swipes that
            start on the text still turn the wheel underneath. */}
        {focusedItem && (
          <div
            className={`pointer-events-none mt-auto mb-6 flex max-w-[36ch] flex-col items-start gap-5 self-start transition-opacity duration-300 ease-out md:my-0 md:gap-6 ${
              columnHidden ? "opacity-0" : "opacity-100"
            }`}
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
            {/* Meta — the role. */}
            <p className={T.meta}>
              <span className="text-box text-[var(--color-ink-soft)]">{focusedItem.role}</span>
            </p>
            {/* The way in — outlined, filling on hover. */}
            <Link
              href={`/case/${focusedItem.slug}`}
              aria-label={`See full case: ${focusedItem.title}`}
              tabIndex={columnHidden ? -1 : 0}
              className={`${BUTTON} ${columnHidden ? "pointer-events-none" : ""}`}
            >
              See full case
              <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
            </Link>
          </div>
        )}

        <footer className={`pointer-events-auto self-start ${chrome}`}>
          {contactStrip}
        </footer>
      </div>

      {/* Top right — case counter. Tracks the chrome: visible at rest, faded
          while the wheel spins centred. */}
      <div
        className={`pointer-events-none absolute right-[var(--space-gutter)] top-[var(--space-loose)] z-20 ${T.meta} ${chrome}`}
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
