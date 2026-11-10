import Link from 'next/link'
import type React from 'react'
import type { CinematicCase } from '@/types/cinematic'
import type { CaseFrontmatter } from '@/types/case'
import { ContactStrip } from '@/components/shell/ContactStrip'
import { CaseHeroCinematic } from './CaseHeroCinematic'
import { CaseRevealPanels } from './CaseRevealPanels'
import { CaseStorySlideshow } from './CaseStorySlideshow'
import { CaseOutroVideo } from './CaseOutroVideo'
import { ReloadOnBreakpoint } from './ReloadOnBreakpoint'
import { SmoothScroll } from './SmoothScroll'

interface Props {
  slug: string
  accent: string
  data: CinematicCase
  nextCase: CaseFrontmatter
}

/**
 * Renders a cinematic case from its content model. The structure and sequence
 * are fixed (hero → intro → story → outro); only `data` changes per case, and
 * the intro and story acts are skipped when empty. The
 * outro footer (next-case link + contact strip) is assembled here from
 * `nextCase`, so content files never carry it.
 */
export function CaseCinematic({ slug, accent, data, nextCase }: Props) {
  return (
    <div
      className="min-h-screen"
      style={{ '--color-case-accent': accent } as React.CSSProperties}
    >
      <ReloadOnBreakpoint />
      <SmoothScroll />

      {/* ── Floating back nav ──────────────────────────────────────────────
          mix-blend-difference lets a single white text work on both
          the dark hero (#0E0E0E) and the light reading canvas (#FAFAFA):
          — on dark: |#FFF − #0E0E0E| ≈ white  → stays white
          — on light: |#FFF − #FAFAFA| ≈ black  → inverts to near-black
          On phones it is a sticky bar: it stays reachable while reading, and
          unlike a fixed bar (which iOS Chrome leaves hanging mid-screen when
          its address bar collapses and the page grows up under it) a sticky
          one lives in the page flow and keeps to the real top of the page. */}
      <nav
        className="sticky top-0 z-50 bg-[#0E0E0E]/90 px-[var(--space-gutter)] py-4 backdrop-blur-sm md:pointer-events-none md:fixed md:top-0 md:left-0 md:right-0 md:bg-transparent md:backdrop-blur-none md:mix-blend-difference"
        aria-label="Case navigation"
      >
        <Link
          href={`/?case=${slug}`}
          className="-mx-3 -my-2 inline-block px-3 py-2 font-body text-sm text-white md:pointer-events-auto hover:opacity-60 transition-opacity"
        >
          ← back
        </Link>
      </nav>

      {/* Act 1 — cinematic hero */}
      <CaseHeroCinematic
        image={data.hero.image}
        alt={data.hero.alt}
        eyebrow={data.hero.eyebrow}
        titleLines={data.hero.titleLines}
        description={data.hero.description}
      />

      {/* Act 2 — intro panels (dark, optionally wiping to light) */}
      {data.intro.length > 0 && <CaseRevealPanels panels={data.intro} />}

      {/* ── Reading content ───────────────────────────────────────────────
          Light canvas matches other cases; holds the story slideshow and the
          outro video with the footer overlaid on it.                        */}
      <div className="relative z-10 bg-[var(--color-bg)]">
        <main>
          {/* Act 3 — story slideshow */}
          {data.slides.length > 0 && <CaseStorySlideshow slides={data.slides} />}

          {/* Act 4 — outro video with the footer overlaid */}
          <CaseOutroVideo video={data.outroVideo}>
            <footer className="max-w-[72ch] mx-auto flex flex-col gap-8">
              <div>
                <p className="font-body text-xs uppercase tracking-widest text-white mb-3">
                  next case
                </p>
                <Link
                  href={`/case/${nextCase.slug}`}
                  className="group inline-flex items-baseline gap-2 font-display text-2xl font-bold text-white hover:text-[var(--color-case-accent)] transition-colors"
                >
                  <span>{nextCase.title}</span>
                  <span className="inline-block transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </Link>
                {nextCase.subtitle && (
                  <p className="font-body text-sm text-white mt-1">
                    {nextCase.subtitle}
                  </p>
                )}
              </div>
              <ContactStrip />
            </footer>
          </CaseOutroVideo>
        </main>
      </div>
    </div>
  )
}
