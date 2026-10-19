'use client'

import { Fragment, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import Image from 'next/image'
import { isMobileViewport } from '@/lib/breakpoints'

interface Props {
  image: string
  alt: string
  /** Small stacked label lines above the title. */
  eyebrow: string[]
  /** Title split into explicit lines, joined with <br/>. */
  titleLines: string[]
  description: ReactNode
}

/**
 * Act 1 — cinematic hero. Dark 55/45 grid: a single image on the left scales up
 * and slides down off-screen across ~80% of pinned scroll while the right column
 * (eyebrow / title / description) fades out. Text staggers in on
 * load. Generalized from the tax-ocr hero — behavior is unchanged.
 */
export function CaseHeroCinematic({ image, alt, eyebrow, titleLines, description }: Props) {
  const sectionRef  = useRef<HTMLElement>(null)
  const stackRef    = useRef<HTMLDivElement>(null)
  const card1Ref    = useRef<HTMLDivElement>(null)
  const rightColRef = useRef<HTMLDivElement>(null)
  const metaRef     = useRef<HTMLDivElement>(null)
  const titleRef    = useRef<HTMLHeadingElement>(null)
  const descRef     = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    let cleanupFn: (() => void) | undefined
    let destroyed = false

    async function init() {
      const { gsap }          = await import('gsap')
      const { ScrollTrigger } = await import('gsap/ScrollTrigger')
      if (destroyed) return
      gsap.registerPlugin(ScrollTrigger)

      const section  = sectionRef.current
      const stack    = stackRef.current
      const card1    = card1Ref.current
      const rightCol = rightColRef.current
      const meta     = metaRef.current
      const title    = titleRef.current
      const desc     = descRef.current
      if (!section || !stack || !card1) return

      // Load-time entrance — text fades + slides up
      const textEls = [meta, title, desc].filter(Boolean)
      const entranceTl = gsap.timeline({ delay: 0.2 })
      entranceTl.fromTo(
        textEls,
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.1, duration: 0.6, ease: 'power2.out' },
      )

      // Phones: no pinned zoom — the hero is a plain stacked section.
      if (isMobileViewport()) {
        cleanupFn = () => entranceTl.kill()
        return
      }

      let scrollTl: ReturnType<typeof gsap.timeline> | undefined
      let resizeTimer: ReturnType<typeof setTimeout>

      function buildScrollTimeline() {
        scrollTl?.kill()
        ScrollTrigger.getAll().forEach((t) => t.kill())
        gsap.set(card1!, { clearProps: 'transform,transformOrigin' })

        const rect = stack!.getBoundingClientRect()
        const vh   = window.innerHeight

        gsap.set(card1!, { transformOrigin: 'top center' })
        const targetScale = ((vh - rect.top) / rect.height) * 2.2
        const shiftY      = vh - rect.top + 40

        scrollTl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            pin: true,
            pinSpacing: true,
            start: 'top top',
            end: '+=80%',
            scrub: true, // Lenis smooths the scroll; track it directly
          },
        })

        // [0 → 1] Image exits downward
        scrollTl.to(card1!, { scale: targetScale, y: shiftY, ease: 'none', duration: 1 }, 0)
        // Right column fades out as image grows
        if (rightCol) scrollTl.to(rightCol, { opacity: 0, ease: 'none', duration: 0.4 }, 0)
      }

      buildScrollTimeline()

      const onResize = () => {
        clearTimeout(resizeTimer)
        resizeTimer = setTimeout(() => {
          buildScrollTimeline()
          ScrollTrigger.refresh()
        }, 200)
      }
      window.addEventListener('resize', onResize)

      cleanupFn = () => {
        scrollTl?.kill()
        entranceTl.kill()
        ScrollTrigger.getAll().forEach((t) => t.kill())
        window.removeEventListener('resize', onResize)
        clearTimeout(resizeTimer)
      }
    }

    init()
    return () => { destroyed = true; cleanupFn?.() }
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative grid grid-cols-1 bg-[#0E0E0E] overflow-hidden md:h-[100dvh] md:grid-cols-[55fr_45fr]"
      aria-label="Project hero"
    >
      {/* ── Left: single hero image ──────────────────────────────────────── */}
      <div className="relative order-2 flex items-center justify-center px-[var(--space-gutter)] pb-16 md:order-1 md:p-10">
        <div
          ref={stackRef}
          className="relative w-full"
          style={{ aspectRatio: '16 / 10', maxHeight: '72vh' }}
        >
          <div
            ref={card1Ref}
            className="absolute inset-0"
            style={{ willChange: 'transform' }}
          >
            <Image
              src={image}
              alt={alt}
              fill
              className="object-contain"
              sizes="55vw"
              priority
            />
          </div>
        </div>
      </div>

      {/* ── Right: title + text ──────────────────────────────────────────── */}
      <div
        ref={rightColRef}
        className="order-1 flex flex-col justify-center gap-6 px-[var(--space-gutter)] pt-28 pb-10 md:order-2 md:gap-8 md:py-0"
      >
        <div ref={metaRef} className="flex flex-col gap-1.5" style={{ opacity: 0 }}>
          {eyebrow.map((line, i) => (
            <p
              key={i}
              className="font-body uppercase tracking-[0.32em] text-white"
              style={{ fontSize: 'clamp(0.65rem, 0.9vw, 0.7rem)' }}
            >
              {line}
            </p>
          ))}
        </div>

        <h1
          ref={titleRef}
          className="font-display font-black text-white leading-[0.92] tracking-tight"
          style={{ fontSize: 'clamp(2.6rem, 5.2vw, 5.5rem)', opacity: 0 }}
        >
          {titleLines.map((line, i) => (
            <Fragment key={i}>
              {i > 0 && <br />}
              {line}
            </Fragment>
          ))}
        </h1>

        <p
          ref={descRef}
          className="font-body text-white leading-[1.65]"
          style={{ fontSize: 'clamp(0.85rem, 1.15vw, 1rem)', maxWidth: '30ch', opacity: 0 }}
        >
          {description}
        </p>
      </div>
    </section>
  )
}
