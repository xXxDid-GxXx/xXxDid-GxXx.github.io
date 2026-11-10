'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import Image from 'next/image'
import { isMobileViewport } from '@/lib/breakpoints'

/** How long someone can sit on the hero without scrolling before the hint appears. */
const HINT_IDLE_MS = 5000

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
 * Act 1 — cinematic hero. Dark 55/45 grid: pinned for one screen of scroll with
 * no spacer, so the next act rises over it. The image on the left scales up
 * and travels to the screen's centre behind that curtain while the right
 * column (eyebrow / title / description) lifts and fades. Text staggers in on
 * load. Generalized from the tax-ocr hero — behavior is unchanged.
 */
export function CaseHeroCinematic({ image, alt, eyebrow, titleLines, description }: Props) {
  const sectionRef  = useRef<HTMLElement>(null)
  const stackRef    = useRef<HTMLDivElement>(null)
  const card1Ref    = useRef<HTMLDivElement>(null)
  const imageRef    = useRef<HTMLDivElement>(null)
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

      // The image settles in alongside: a slow fade with a touch of scale and
      // lift, on its own wrapper so it never fights the scroll-driven zoom on
      // the card. It waits for the image to have loaded, so it can't pop in
      // half-decoded; if it never loads, the wrapper is simply shown.
      const imageWrap = imageRef.current
      const img = imageWrap?.querySelector('img')
      let imageTween: ReturnType<typeof gsap.fromTo> | undefined
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const showImage = () => {
        if (!imageWrap) return
        if (reduce) { gsap.set(imageWrap, { opacity: 1 }); return }
        imageTween = gsap.fromTo(
          imageWrap,
          { opacity: 0, scale: 1.04, y: 14 },
          { opacity: 1, scale: 1, y: 0, duration: 1.3, ease: 'power2.out', delay: 0.1 },
        )
      }
      if (img && !img.complete) {
        img.addEventListener('load', showImage, { once: true })
        img.addEventListener('error', showImage, { once: true })
      } else {
        showImage()
      }
      const stopImage = () => {
        imageTween?.kill()
        img?.removeEventListener('load', showImage)
        img?.removeEventListener('error', showImage)
      }

      // Phones: no pinned zoom — the hero is a plain stacked section.
      if (isMobileViewport()) {
        cleanupFn = () => { entranceTl.kill(); stopImage() }
        return
      }

      let scrollTl: ReturnType<typeof gsap.timeline> | undefined
      let resizeTimer: ReturnType<typeof setTimeout>

      function buildScrollTimeline() {
        scrollTl?.kill()
        ScrollTrigger.getAll().forEach((t) => t.kill())
        gsap.set(card1!, { clearProps: 'transform,transformOrigin' })
        if (rightCol) gsap.set(rightCol, { clearProps: 'opacity,transform' })

        // Where the image sits inside the hero, so it can travel to the
        // hero's centre (= the screen's centre while pinned) as it grows.
        const rect = stack!.getBoundingClientRect()
        const host = section!.getBoundingClientRect()
        const dx = host.left + host.width / 2 - (rect.left + rect.width / 2)
        const dy = host.top + host.height / 2 - (rect.top + rect.height / 2)

        gsap.set(card1!, { transformOrigin: 'center center' })

        scrollTl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            pin: true,
            // No spacer: the hero stays put for one screen of scroll while the
            // next act rises over it like a curtain (the hero sits below it in
            // z-order). Its text never fades, so nothing is ever blank; by the
            // time the pin releases the hero is fully covered, so its snap
            // back into the page flow is invisible.
            pinSpacing: false,
            start: 'top top',
            end: '+=100%',
            scrub: true, // Lenis smooths the scroll; track it directly
          },
        })

        // [0 → 0.6] Image grows into the centre of the screen, behind the
        // rising curtain
        scrollTl.to(card1!, { scale: 1.45, x: dx, y: dy, ease: 'none', duration: 0.6 }, 0)
        // [0 → 0.35] Text lifts and fades out as soon as the page moves
        if (rightCol) scrollTl.to(rightCol, { opacity: 0, y: -28, ease: 'none', duration: 0.35 }, 0)
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
        stopImage()
        ScrollTrigger.getAll().forEach((t) => t.kill())
        window.removeEventListener('resize', onResize)
        clearTimeout(resizeTimer)
      }
    }

    init()
    return () => { destroyed = true; cleanupFn?.() }
  }, [])

  // Scroll hint. Nothing on the hero says the page continues, but a permanent
  // arrow is noise for people who scroll anyway. So it only appears once
  // someone has sat on the hero for a few seconds without scrolling: a small
  // "scroll" label trailing the cursor, like the homepage's "click me". If the
  // mouse has not moved yet it sits at the bottom centre. The first scroll
  // dismisses it for the rest of the visit. Touch devices never see it.
  const [hint, setHint] = useState({ x: 0, y: 0, on: false, fixed: true })
  useEffect(() => {
    // Touch devices get no hint: there the hero is a normal page section and
    // the content visibly continues below the fold.
    const touch = window.matchMedia('(hover: none)').matches
    if (touch) return
    let shown = false
    let done = false
    let pos = { x: -1, y: -1 }
    const dismiss = () => {
      if (done) return
      done = true
      clearTimeout(timer)
      setHint((h) => ({ ...h, on: false }))
    }
    const onMove = (e: PointerEvent) => {
      if (done) return
      pos = { x: e.clientX, y: e.clientY }
      if (shown) setHint({ x: pos.x, y: pos.y, on: true, fixed: false })
    }
    const onScroll = () => { if (window.scrollY > 20) dismiss() }
    const timer = setTimeout(() => {
      if (done || window.scrollY > 20) return
      shown = true
      if (pos.x < 0) setHint({ x: 0, y: 0, on: true, fixed: true })
      else setHint({ x: pos.x, y: pos.y, on: true, fixed: false })
    }, HINT_IDLE_MS)
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('wheel', dismiss, { passive: true })
    window.addEventListener('touchmove', dismiss, { passive: true })
    window.addEventListener('keydown', dismiss)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('wheel', dismiss)
      window.removeEventListener('touchmove', dismiss)
      window.removeEventListener('keydown', dismiss)
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative z-0 grid grid-cols-1 bg-[#0E0E0E] overflow-hidden md:h-[100dvh] md:grid-cols-[55fr_45fr]"
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
            {/* Entrance wrapper — hidden until the image has loaded, then
                eased in (see the effect above). */}
            <div ref={imageRef} className="absolute inset-0" style={{ opacity: 0 }}>
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
      </div>

      {/* ── Right: title + text ──────────────────────────────────────────── */}
      <div
        ref={rightColRef}
        className="order-1 flex flex-col justify-center gap-6 px-[var(--space-gutter)] pt-6 pb-10 md:order-2 md:gap-8 md:py-0"
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

      {/* ── Idle scroll hint (see the hook above) ───────────────────────── */}
      <span
        aria-hidden
        className={`pointer-events-none fixed z-40 inline-flex items-center gap-1.5 whitespace-nowrap font-body text-[11px] uppercase tracking-[0.2em] text-white/70 transition-opacity duration-700 ease-out motion-reduce:transition-none ${
          hint.fixed ? 'bottom-8 left-1/2 -translate-x-1/2' : 'left-0 top-0'
        }`}
        style={{
          transform: hint.fixed ? undefined : `translate(${hint.x + 18}px, ${hint.y + 22}px)`,
          opacity: hint.on ? 1 : 0,
          textShadow: '0 0 12px rgba(0,0,0,0.9)',
        }}
      >
        scroll
        <span className="scroll-cue-arrow inline-block text-sm leading-none text-white">↓</span>
      </span>
    </section>
  )
}
