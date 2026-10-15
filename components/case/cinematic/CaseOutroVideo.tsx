'use client'

import { useEffect, useRef, useState } from 'react'
import type React from 'react'

/**
 * Act 4 — full-viewport outro video with the page footer overlaid at the bottom.
 *
 * Browsers refuse to autoplay video *with sound*, so it starts muted (always
 * allowed → visible and running) and sound is switched on when the video
 * scrolls into view, so audio never plays while you're on the sections above.
 * Generalized from the tax-ocr outro — behavior is unchanged; the video source
 * comes in as a prop.
 */
export function CaseOutroVideo({
  video,
  children,
}: {
  video: string
  children?: React.ReactNode
}) {
  const sectionRef = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const footerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  // set when the visitor explicitly mutes, so we don't auto-unmute over them
  const mutedByUserRef = useRef(false)
  const [muted, setMuted] = useState(true)
  // the video plays once; when it finishes we surface a replay button
  const [ended, setEnded] = useState(false)

  // playback + sound handling
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.muted = true
    void video.play().catch(() => {})

    let inView = false

    // Turn sound on — only succeeds if the browser has granted the page audio
    // playback (which needs a prior user gesture). Falls back to muted if the
    // browser still refuses, so the video keeps playing regardless.
    const enableSound = () => {
      if (!inView || mutedByUserRef.current) return
      video.muted = false
      video
        .play()
        .then(() => setMuted(false))
        .catch(() => {
          video.muted = true
          setMuted(true)
          void video.play().catch(() => {})
        })
    }

    // Browsers block autoplay-with-sound until the user interacts with the
    // page, and a gesture on the previous page doesn't carry across navigation.
    // Capture the first real interaction here so sound comes on as soon as the
    // video is in view. Ignore gestures on the mute button — it manages its own
    // state, and letting this also fire would fight its toggle.
    const gestureEvents = ['pointerdown', 'keydown', 'touchstart'] as const
    const onGesture = (e: Event) => {
      if (buttonRef.current?.contains(e.target as Node)) return
      enableSound()
    }
    gestureEvents.forEach((e) =>
      window.addEventListener(e, onGesture, { passive: true }),
    )

    // plays once → reveal the replay button when it finishes
    const onEnded = () => setEnded(true)
    video.addEventListener('ended', onEnded)

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // fresh visit → play once from the start and try sound again
          inView = true
          mutedByUserRef.current = false
          setEnded(false)
          video.currentTime = 0
          enableSound()
          void video.play().catch(() => {})
        } else {
          // left the viewport → mute, stop, and rewind so it plays again from
          // the top the next time it scrolls back in
          inView = false
          setEnded(false)
          video.muted = true
          setMuted(true)
          video.pause()
          video.currentTime = 0
        }
      },
      { threshold: 0.5 },
    )
    io.observe(video)

    return () => {
      io.disconnect()
      video.removeEventListener('ended', onEnded)
      gestureEvents.forEach((e) => window.removeEventListener(e, onGesture))
    }
  }, [])

  // entrance — echoes the hero: the visual scales in while the text fades up
  useEffect(() => {
    let destroyed = false
    let cleanup: (() => void) | undefined

    async function init() {
      const { gsap } = await import('gsap')
      const { ScrollTrigger } = await import('gsap/ScrollTrigger')
      if (destroyed) return
      gsap.registerPlugin(ScrollTrigger)

      const section = sectionRef.current
      const video = videoRef.current
      const footer = footerRef.current
      if (!section || !video) return

      gsap.set(video, { scale: 1.08, autoAlpha: 0, transformOrigin: 'center center' })
      if (footer) gsap.set(footer, { autoAlpha: 0, y: 28 })

      const tl = gsap.timeline({
        scrollTrigger: { trigger: section, start: 'top 70%', once: true },
      })
      tl.to(video, { scale: 1, autoAlpha: 1, duration: 1, ease: 'power2.out' }, 0)
      if (footer) {
        tl.to(footer, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' }, 0.2)
      }

      cleanup = () => {
        tl.scrollTrigger?.kill()
        tl.kill()
      }
    }

    init()
    return () => {
      destroyed = true
      cleanup?.()
    }
  }, [])

  const toggleMuted = () => {
    const video = videoRef.current
    if (!video) return
    // read the element, not React state, so a rapid press never toggles the
    // wrong way off a stale value
    const next = !video.muted
    video.muted = next
    mutedByUserRef.current = next
    if (!next) void video.play().catch(() => {})
    setMuted(next)
  }

  // replay from the top — this click is a user gesture, so playback (and the
  // current sound state) resumes cleanly
  const replay = () => {
    const video = videoRef.current
    if (!video) return
    setEnded(false)
    video.currentTime = 0
    void video.play().catch(() => {})
  }

  return (
    <section
      ref={sectionRef}
      className="relative h-[100dvh] w-full overflow-hidden bg-[#0E0E0E]"
    >
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-contain md:object-cover"
        src={video}
        autoPlay
        muted
        playsInline
        preload="auto"
      />

      <button
        ref={buttonRef}
        type="button"
        onClick={toggleMuted}
        aria-pressed={!muted}
        aria-label={muted ? 'Unmute video' : 'Mute video'}
        className="absolute top-16 right-4 z-20 flex md:top-6 md:right-6 items-center gap-2 rounded-full bg-black/55 px-4 py-2 text-white backdrop-blur-sm transition-colors hover:bg-black/75 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <span aria-hidden className="text-base leading-none">
          {muted ? '🔇' : '🔊'}
        </span>
        <span className="font-body text-xs uppercase tracking-wider">
          {muted ? 'Sound off' : 'Sound on'}
        </span>
      </button>

      {/* Replay — appears once the video has played through so it can be
          watched again. Wrapper ignores pointer events; only the button
          catches them, so the rest of the section stays interactive. */}
      {ended && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
          <button
            type="button"
            onClick={replay}
            aria-label="Play the video again"
            className="pointer-events-auto flex flex-col items-center gap-3 text-white transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-full"
          >
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-black/55 backdrop-blur-sm ring-1 ring-white/25">
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                className="ml-1 h-8 w-8 fill-current"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
            <span className="font-body text-xs uppercase tracking-widest">
              Watch again
            </span>
          </button>
        </div>
      )}

      {children && (
        <div
          ref={footerRef}
          className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/85 via-black/55 to-transparent pt-28 pb-10 px-[var(--space-gutter)]"
        >
          {children}
        </div>
      )}
    </section>
  )
}
