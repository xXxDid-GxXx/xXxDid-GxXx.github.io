'use client'

import { useEffect } from 'react'
import type Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { isMobileViewport } from '@/lib/breakpoints'

// The active instance, so overlays (the slideshow lightbox) can pause it.
let active: Lenis | null = null
export const getLenis = () => active

/**
 * Smooth wheel/trackpad scrolling for the desktop case pages (Lenis), driven by
 * GSAP's ticker so the pinned ScrollTrigger acts stay frame-perfect in sync.
 * Phones keep native scrolling, and so do visitors who prefer reduced motion.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (isMobileViewport()) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let destroyed = false
    let cleanup: (() => void) | undefined

    async function init() {
      const [{ default: LenisCtor }, { gsap }, { ScrollTrigger }] = await Promise.all([
        import('lenis'),
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ])
      if (destroyed) return
      gsap.registerPlugin(ScrollTrigger)

      const lenis = new LenisCtor({ lerp: 0.1, wheelMultiplier: 1, autoRaf: false })
      active = lenis
      lenis.on('scroll', ScrollTrigger.update)
      const tick = (time: number) => lenis.raf(time * 1000)
      gsap.ticker.add(tick)
      gsap.ticker.lagSmoothing(0)

      cleanup = () => {
        gsap.ticker.remove(tick)
        lenis.destroy()
        if (active === lenis) active = null
      }
    }

    init()
    return () => {
      destroyed = true
      cleanup?.()
    }
  }, [])

  return null
}
