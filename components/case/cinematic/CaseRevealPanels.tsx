'use client'

import { useEffect, useRef } from 'react'
import type { CinematicRevealPanel } from '@/types/cinematic'
import { isMobileViewport } from '@/lib/breakpoints'

interface Props {
  /** One or two panels: [dark] or [dark, light]. */
  panels: CinematicRevealPanel[]
}

/**
 * Act 2 — reveal panels. Pinned for 140% of scroll. Panel 1 (dark, front) has
 * its title + paragraphs slide in right-to-left, then the whole panel slides
 * right off-screen to uncover Panel 2 (light "paper", behind) whose title +
 * paragraphs drop in top-to-bottom. Generalized from the tax-ocr "before"
 * section — behavior is unchanged; paragraph counts are free to vary since the
 * timeline iterates over whatever animated elements each panel contains.
 *
 * Light-panel tone matches tax-ocr: first paragraph reads at --color-ink-soft,
 * the rest at --color-ink-muted. Dark-panel paragraphs are all white.
 *
 * With a single panel there is nothing to reveal: the dark panel's text slides
 * in and the pin releases after a shorter hold.
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

      // Phones: the panels are plain stacked sections — just show the text.
      if (isMobileViewport()) {
        wrapper.querySelectorAll<HTMLElement>('[data-reveal-item]').forEach((el) => {
          el.style.opacity = '1'
        })
        return
      }

      // Animated elements in document order (title first, then paragraphs).
      const text1 = Array.from(panel1.querySelectorAll<HTMLElement>('[data-reveal-item]'))
      const text2 = panel2
        ? Array.from(panel2.querySelectorAll<HTMLElement>('[data-reveal-item]'))
        : []

      let tl: ReturnType<typeof gsap.timeline> | undefined
      let resizeTimer: ReturnType<typeof setTimeout>

      function build() {
        tl?.kill()
        ScrollTrigger.getAll().filter((t) => t.trigger === wrapper).forEach((t) => t.kill())
        gsap.set(panel1!, { clearProps: 'transform,x' })
        gsap.set(text1, { x: 64, opacity: 0 })       // panel 1 → slides in right-to-left
        gsap.set(text2, { y: -28, opacity: 0 })      // panel 2 → drops in top-to-bottom

        tl = gsap.timeline({
          scrollTrigger: {
            trigger: wrapper,
            pin: true,
            pinSpacing: true,
            start: 'top top',
            end: panel2 ? '+=140%' : '+=80%',
            scrub: true, // Lenis smooths the scroll; track it directly
          },
        })

        // [0 → ~0.27] Panel 1 text slides in right-to-left
        text1.forEach((el, i) => {
          tl!.to(el, { x: 0, opacity: 1, ease: 'none', duration: 0.06 }, i * 0.045)
        })

        if (!panel2) {
          // Single panel — hold the text a beat, then the pin releases.
          tl.to({}, { duration: 0.2 }, text1.length * 0.045 + 0.06)
          return
        }

        // [0.3 → 0.45] Panel 1 slides right, revealing panel 2
        tl.to(panel1!, { x: '100vw', ease: 'none', duration: 0.15 }, 0.3)

        // [0.5 → ~0.77] Panel 2 text drops in top-to-bottom, then pin releases
        text2.forEach((el, i) => {
          tl!.to(el, { y: 0, opacity: 1, ease: 'none', duration: 0.06 }, 0.5 + i * 0.045)
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
      className="relative flex flex-col bg-[#0E0E0E] md:block md:h-[100dvh] md:overflow-hidden"
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
