'use client'

import { useEffect, useRef } from 'react'
import type { CinematicRevealPanel } from '@/types/cinematic'
import { isMobileViewport } from '@/lib/breakpoints'
import { riseIn } from './CaseStorySlideshow'

interface Props {
  /** One or two panels: [dark] or [dark, light]. */
  panels: CinematicRevealPanel[]
}

/**
 * Act 2 — reveal panels. Panel 1 (dark, front) has its title + paragraphs
 * slide in right-to-left while it scrolls into view; then, pinned for 90% of
 * scroll, the whole panel slides right off-screen to uncover Panel 2 (light
 * "paper", behind) whose title + paragraphs drop in top-to-bottom. Generalized from the tax-ocr "before"
 * section — behavior is unchanged; paragraph counts are free to vary since the
 * timeline iterates over whatever animated elements each panel contains.
 *
 * Light-panel tone matches tax-ocr: first paragraph reads at --color-ink-soft,
 * the rest at --color-ink-muted. Dark-panel paragraphs are all white.
 *
 * With a single panel there is nothing to reveal: the dark panel's text slides
 * in as it arrives and the section is not pinned.
 */
export function CaseRevealPanels({ panels }: Props) {
  const [dark, light] = panels
  const wrapperRef = useRef<HTMLElement>(null)
  const panel1Ref  = useRef<HTMLDivElement>(null)
  const panel2Ref  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cleanupFn: (() => void) | undefined
    let destroyed = false

    async function init() {
      const { gsap }          = await import('gsap')
      const { ScrollTrigger } = await import('gsap/ScrollTrigger')
      if (destroyed) return
      gsap.registerPlugin(ScrollTrigger)

      const wrapper = wrapperRef.current
      const panel1  = panel1Ref.current
      const panel2  = panel2Ref.current
      if (!wrapper || !panel1) return

      // Phones: the panels are plain stacked sections; each line rises in
      // from the bottom-right as it scrolls into view.
      if (isMobileViewport()) {
        const risers = riseIn(gsap, Array.from(wrapper.querySelectorAll<HTMLElement>('[data-reveal-item]')))
        cleanupFn = () => risers.forEach((t) => t.kill())
        return
      }

      // Animated elements in document order (title first, then paragraphs).
      const text1 = Array.from(panel1.querySelectorAll<HTMLElement>('[data-reveal-item]'))
      const text2 = panel2
        ? Array.from(panel2.querySelectorAll<HTMLElement>('[data-reveal-item]'))
        : []

      let tl: ReturnType<typeof gsap.timeline> | undefined
      let entry: ReturnType<typeof gsap.timeline> | undefined
      let resizeTimer: ReturnType<typeof setTimeout>

      function build() {
        tl?.kill()
        entry?.kill()
        ScrollTrigger.getAll().filter((t) => t.trigger === wrapper).forEach((t) => t.kill())
        gsap.set(panel1!, { clearProps: 'transform,x' })
        gsap.set(text1, { x: 64, opacity: 0 })       // panel 1 → slides in right-to-left
        gsap.set(text2, { y: -28, opacity: 0 })      // panel 2 → drops in top-to-bottom

        // Panel 1's text slides in while the panel itself rises into view
        // behind the leaving hero, so there is never a blank dark screen to
        // scroll through: by the time the panel reaches the top it reads.
        entry = gsap.timeline({
          scrollTrigger: { trigger: wrapper, start: 'top 75%', end: 'top top', scrub: true },
        })
        text1.forEach((el, i) => {
          entry!.to(el, { x: 0, opacity: 1, ease: 'none', duration: 0.3 }, i * 0.1)
        })

        // A single panel has nothing to reveal, so it isn't pinned at all.
        if (!panel2) return

        // Pinned: a short hold on panel 1, then it slides right to uncover
        // panel 2, whose text drops in. Then the pin releases.
        tl = gsap.timeline({
          scrollTrigger: {
            trigger: wrapper,
            pin: true,
            pinSpacing: true,
            start: 'top top',
            end: '+=90%',
            scrub: true, // Lenis smooths the scroll; track it directly
          },
        })

        // [0.12 → 0.27] Panel 1 slides right, revealing panel 2
        tl.to(panel1!, { x: '100vw', ease: 'none', duration: 0.15 }, 0.12)

        // [0.3 → ~0.5] Panel 2 text drops in top-to-bottom, then pin releases
        text2.forEach((el, i) => {
          tl!.to(el, { y: 0, opacity: 1, ease: 'none', duration: 0.05 }, 0.3 + i * 0.02)
        })
      }

      build()

      const onResize = () => {
        clearTimeout(resizeTimer)
        resizeTimer = setTimeout(() => { build(); ScrollTrigger.refresh() }, 200)
      }
      window.addEventListener('resize', onResize)

      cleanupFn = () => {
        tl?.kill()
        entry?.kill()
        ScrollTrigger.getAll().filter((t) => t.trigger === wrapper).forEach((t) => t.kill())
        window.removeEventListener('resize', onResize)
        clearTimeout(resizeTimer)
      }
    }

    init()
    return () => { destroyed = true; cleanupFn?.() }
  }, [])

  return (
    <section
      ref={wrapperRef}
      className="relative z-10 flex flex-col bg-[#0E0E0E] md:block md:h-[100dvh] md:overflow-hidden"
      aria-label="Cinematic story panels"
    >
      {/* Panel 2 — light "paper", behind */}
      {light && (
        <div
          ref={panel2Ref}
          className="relative order-2 flex items-center justify-center bg-[var(--color-paper)] py-20 md:absolute md:inset-0 md:py-0"
          style={{ zIndex: 10 }}
        >
          <div className="flex flex-col gap-8 px-[var(--space-gutter)]" style={{ maxWidth: '56ch' }}>
            <h2
              data-reveal-item
              className="font-display font-black text-[var(--color-ink)] leading-[1.05] tracking-tight"
              style={{ fontSize: 'clamp(2.2rem, 4vw, 4rem)', opacity: 0 }}
            >
              {light.title}
            </h2>
            {light.paragraphs.map((para, i) => (
              <p
                key={i}
                data-reveal-item
                className={`font-body leading-[1.7] ${
                  i === 0 ? 'text-[var(--color-ink-soft)]' : 'text-[var(--color-ink-muted)]'
                }`}
                style={{ fontSize: 'clamp(0.88rem, 1.1vw, 1rem)', maxWidth: '52ch', opacity: 0 }}
              >
                {para}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Panel 1 — dark, front */}
      <div
        ref={panel1Ref}
        className="relative order-1 flex items-center justify-center bg-[#0E0E0E] py-20 md:absolute md:inset-0 md:py-0"
        style={{ willChange: 'transform', zIndex: 20 }}
      >
        <div className="flex flex-col gap-8 px-[var(--space-gutter)]" style={{ maxWidth: '56ch' }}>
          <h2
            data-reveal-item
            className="font-display font-black text-white leading-[1.05] tracking-tight"
            style={{ fontSize: 'clamp(2.2rem, 4vw, 4rem)', opacity: 0 }}
          >
            {dark.title}
          </h2>
          {dark.paragraphs.map((para, i) => (
            <p
              key={i}
              data-reveal-item
              className="font-body text-white leading-[1.7]"
              style={{ fontSize: 'clamp(0.88rem, 1.1vw, 1rem)', maxWidth: '52ch', opacity: 0 }}
            >
              {para}
            </p>
          ))}
        </div>
      </div>
    </section>
  )
}
