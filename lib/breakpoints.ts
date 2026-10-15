/**
 * Phone breakpoint for the case pages. Below it the cinematic acts drop their
 * pinned GSAP scroll timelines and fall back to plain, stacked sections (see the
 * `md:` classes in components/case/cinematic). Matches Tailwind's `md` (768px).
 */
export const MOBILE_QUERY = "(max-width: 767px)";

export function isMobileViewport(): boolean {
  return typeof window !== "undefined" && window.matchMedia(MOBILE_QUERY).matches;
}
