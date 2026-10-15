'use client'

import { useEffect } from 'react'
import { MOBILE_QUERY } from '@/lib/breakpoints'

/**
 * The cinematic acts pick desktop (pinned, scroll-scrubbed) or phone (stacked,
 * static) behaviour once, on mount. If the window is resized across the
 * breakpoint, reload so the GSAP timelines and the layout agree again.
 */
export function ReloadOnBreakpoint() {
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY)
    const onChange = () => window.location.reload()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return null
}
