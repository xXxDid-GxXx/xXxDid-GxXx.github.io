'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import type { CinematicStorySlide } from '@/types/cinematic'
import { isMobileViewport } from '@/lib/breakpoints'
import { getLenis } from './SmoothScroll'

// Clickable screenshot — fills its positioned parent and opens the lightbox.
function StoryImage({
  src,
  alt,
  sizes,
  onOpen,
}: {
  src: string
  alt: string
  sizes: string
  onOpen: (src: string, alt: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(src, alt)}
      aria-label={`Open full view: ${alt}`}
      className="group absolute inset-0 cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ink)]"
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-contain transition-transform duration-300 ease-out group-hover:scale-[1.015]"
        sizes={sizes}
      />
    </button>
  )
}

interface Props {
  slides: CinematicStorySlide[]
}

/**
 * Act 3 — pinned story slideshow. Slides are stacked and cycle one at a time
 * across 75% of scroll per slide: the image fades in, the title and paragraphs
 * appear one by one, and the slide fades out before the next appears. Images open in a lightbox on click. The slide count is free
 * to vary (the timeline is built from whatever [data-slide] elements exist).
 */
export function CaseStorySlideshow({ slides }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const sectionRef = useRef<HTMLElement>(null)
  const [preview, setPreview] = useState<{ src: string; alt: string } | null>(null)

  // close on Escape + lock background scroll while the preview is open
  useEffect(() => {
    if (!preview) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreview(null)
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    getLenis()?.stop() // smooth scroll would otherwise keep moving the page behind
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      getLenis()?.start()
    }
  }, [preview])

  useEffect(() => {
    let cleanup: (() => void) | undefined
    let destroyed = false

    async function init() {
      const { gsap } = await import('gsap')
      const { ScrollTrigger } = await import('gsap/ScrollTrigger')
      if (destroyed) return
      gsap.registerPlugin(ScrollTrigger)

      const section = sectionRef.current
      if (!section) return

      const slideEls = Array.from(
        section.querySelectorAll<HTMLElement>('[data-slide]'),
      )
      if (!slideEls.length) return

      // Phones: slides are plain stacked blocks in the page flow — no pin, no
      // timeline. Reveal everything the desktop layout hides until GSAP runs.
      if (isMobileViewport()) {
        section
          .querySelectorAll<HTMLElement>('[data-slide-media], [data-slide-text]')
          .forEach((el) => {
            el.style.opacity = '1'
            el.style.visibility = 'visible'
          })
        return
      }

      let tl: ReturnType<typeof gsap.timeline> | undefined
      let resizeTimer: ReturnType<typeof setTimeout>

      function build() {
        tl?.kill()
        ScrollTrigger.getAll()
          .filter((t) => t.trigger === section)
          .forEach((t) => t.kill())

        const n = slideEls.length

        // Pin the section and cycle slides across n × 75% of scroll. Each
        // slide owns a 1.0 slot: the image fades in, then the title and each
        // paragraph appear one after another, everything holds, and the whole
        // slide fades out before the next one starts. No zooming or flying.
        tl = gsap.timeline({
          defaults: { ease: 'power1.out' },
          scrollTrigger: {
            trigger: section,
            pin: true,
            pinSpacing: true,
            start: 'top top',
            end: `+=${n * 75}%`,
            // Lenis already smooths the scroll, so the timeline tracks it
            // directly (no extra scrub lag, no snapping — free scrolling).
            scrub: true,
          },
        })

        const imageIn = 0.12   // image fade-in length
        const textFrom = 0.08  // when the title starts appearing
        const textUntil = 0.6  // last paragraph starts by ~here; all done before the fade-out
        const fadeOut = 0.15   // whole-slide fade-out length, at the slot's end

        slideEls.forEach((slide, i) => {
          const media = slide.querySelector<HTMLElement>('[data-slide-media]')
          const text = slide.querySelector<HTMLElement>('[data-slide-text]')
          // Title first, then each paragraph, in reading order.
          const lines = text
            ? Array.from(text.querySelectorAll<HTMLElement>('h2, p'))
            : []

          // Reset only animation styles from the initial render / an old build —
          // the title and paragraphs carry their font size as inline styles.
          ;[media, text, ...lines].forEach(
            (el) => el && gsap.set(el, { clearProps: 'opacity,visibility,transform' }),
          )
          gsap.set(slide, { autoAlpha: 0 })
          if (media) gsap.set(media, { autoAlpha: 0 })
          gsap.set(lines, { autoAlpha: 0, y: 14 })

          tl!.set(slide, { autoAlpha: 1 }, i)
          if (media) tl!.to(media, { autoAlpha: 1, duration: imageIn }, i)

          // Spread the lines evenly across the text window; each one takes a
          // generous share of it so the reveal reads as gradual, not a pop.
          const step = lines.length ? (textUntil - textFrom) / lines.length : 0
          lines.forEach((line, j) => {
            tl!.to(
              line,
              { autoAlpha: 1, y: 0, duration: step * 1.6 },
              i + textFrom + j * step,
            )
          })

          tl!.to(slide, { autoAlpha: 0, duration: fadeOut, ease: 'power1.in' }, i + 1 - fadeOut)
        })
      }

      build()

      // Images and fonts load after mount and shift layout, which can throw
      // off the pin's measured start. Recompute once everything settles so the
      // first slide's entrance isn't accidentally scrolled past on load.
      window.addEventListener('load', () => ScrollTrigger.refresh())
      if (document.fonts?.ready) {
        document.fonts.ready.then(() => ScrollTrigger.refresh())
      }

      const onResize = () => {
        clearTimeout(resizeTimer)
        resizeTimer = setTimeout(() => {
          build()
          ScrollTrigger.refresh()
        }, 200)
      }
      window.addEventListener('resize', onResize)

      cleanup = () => {
        tl?.kill()
        ScrollTrigger.getAll()
          .filter((t) => t.trigger === section)
          .forEach((t) => t.kill())
        window.removeEventListener('resize', onResize)
        clearTimeout(resizeTimer)
      }
    }

    init()
    return () => {
      destroyed = true
      cleanup?.()
    }
  }, [])

  return (
    <div ref={rootRef}>
      {/* Pinned slideshow — slides are stacked and cycle one at a time. */}
      <section
        ref={sectionRef}
        className="relative bg-[#0E0E0E] md:h-[100dvh] md:overflow-hidden"
      >
        {slides.map((slide, i) => {
          // image always on the left (55fr, like the hero), text always on the right
          const gridCols = 'md:grid-cols-[55fr_45fr]'
          // every slide uses the two-column text layout
          const twoCol = true
          return (
            <div
              key={i}
              data-slide
              className="relative flex items-center py-14 md:absolute md:inset-0 md:py-0"
            >
              <div
                className={`w-full px-[var(--space-gutter)] grid items-center gap-10 md:gap-16 ${
                  slide.image ? gridCols : ''
                }`}
              >
                {/* Image — matches hero sizing: large, capped at 72vh.
                    Sits above the text so it scales over it during the zoom. */}
                {slide.image && (
                  <div
                    data-slide-media
                    className="relative z-20 md:order-1"
                    // hidden until GSAP takes over, so stacked slides don't flash
                    style={i === 0 ? undefined : { opacity: 0, visibility: 'hidden' }}
                  >
                    <div
                      className="relative w-full"
                      style={{ aspectRatio: '16 / 10', maxHeight: '72vh' }}
                    >
                      <StoryImage
                        src={slide.image}
                        alt={slide.alt ?? slide.title}
                        sizes="(max-width: 768px) 92vw, 55vw"
                        onOpen={(src, alt) => setPreview({ src, alt })}
                      />
                    </div>
                  </div>
                )}

                {/* Title + text — layered beneath the image */}
                <div
                  data-slide-text
                  className={`relative z-10 mx-auto md:order-2 ${
                    slide.image ? 'max-w-[52ch]' : 'max-w-[90ch]'
                  }`}
                  style={i === 0 ? undefined : { opacity: 0, visibility: 'hidden' }}
                >
                  <h2
                    className="font-display font-black leading-[1.05] tracking-tight mb-5 text-white"
                    style={{ fontSize: 'clamp(1.8rem, 3.2vw, 3.2rem)' }}
                  >
                    {slide.title}
                  </h2>
                  <div
                    className={
                      twoCol ? 'columns-1 md:columns-2 md:gap-x-8' : 'flex flex-col gap-4'
                    }
                  >
                    {slide.body.map((para, j) => (
                      <p
                        key={j}
                        className={`font-body leading-[1.6] text-white ${
                          twoCol ? 'mb-4 last:mb-0 break-inside-avoid' : ''
                        }`}
                        style={{ fontSize: 'clamp(0.9rem, 0.95vw, 0.95rem)' }}
                      >
                        {para}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </section>

      {/* ── Lightbox preview ──────────────────────────────────────────────
          Click anywhere or press Escape to close. */}
      {preview && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
          onClick={() => setPreview(null)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 sm:p-10 cursor-zoom-out"
        >
          <button
            type="button"
            onClick={() => setPreview(null)}
            aria-label="Close preview"
            className="absolute top-4 right-5 sm:top-6 sm:right-8 text-white hover:text-white text-4xl leading-none transition-colors"
          >
            &times;
          </button>
          <div className="relative w-full h-full max-w-[94vw] max-h-[88vh]">
            <Image
              src={preview.src}
              alt={preview.alt}
              fill
              className="object-contain"
              sizes="94vw"
              priority
            />
          </div>
        </div>
      )}
    </div>
  )
}
