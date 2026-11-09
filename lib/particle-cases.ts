/**
 * Cases whose homepage preview is a live particle artwork instead of a photo.
 * The subject image is a pre-cut RGBA PNG (transparent background) made by
 * `node scripts/particle-prep.mjs` — see that file for how to add a new one.
 *
 * `shadow` tints the dark/sparse particles, `highlight` the bright/dense ones;
 * the source image's own colour is blended in on top (see SOURCE_COLOR_MIX in
 * lib/particle-engine.ts), so the frog stays green and the ambulance orange.
 */
export type ParticleCaseConfig = {
  /** RGBA cut-out of the subject, served from /public. */
  src: string;
  /** Tint for the darkest particles (usually the case's accent colour). */
  shadow: string;
  /** Tint for the brightest particles. */
  highlight: string;
  /** Brightness curve: 1 = as in the image, 0.5 lifts mid-tones (dark subjects). */
  gamma?: number;
};

export const PARTICLE_CASES: Record<string, ParticleCaseConfig> = {
  "healthcare-er": {
    // Two surgeons over a patient, cut from a dim operating-room photo with
    // scripts/subject-mask.swift; lifted so the scrubs read, lights stay brightest.
    src: "/images/cases/healthcare-er/particle.png",
    shadow: "#2A5D7C",
    highlight: "#F3F1FF",
    gamma: 0.7,
  },
  "ai-orchestration": {
    src: "/images/cases/ai-orchestration/particle.png",
    shadow: "#4A2C6B",
    highlight: "#F3F1FF",
  },
  "linear-marketplace": {
    src: "/images/cases/linear-marketplace/particle.png",
    shadow: "#00C2A8",
    highlight: "#F3F1FF",
    // The frog is mid-green all over: lift it so the body reads, eyes stay brightest.
    gamma: 0.45,
  },
  glazd: {
    // A couple kissing against a sign pole on a sunlit street, with their dog.
    src: "/images/cases/glazd/particle.png",
    shadow: "#FF0033",
    highlight: "#F3F1FF",
    gamma: 0.7,
  },
  "ai-workflow": {
    // The two hands from the Sistine ceiling. The case accent is near-black,
    // so the mist takes a warm fresco tone instead.
    src: "/images/cases/ai-workflow/particle.png",
    shadow: "#7A5A38",
    highlight: "#F3F1FF",
  },
  "tax-ocr": {
    // Person buried in sticky notes at a laptop, cut from a photo with
    // scripts/subject-mask.swift.
    src: "/images/cases/tax-ocr/particle.png",
    shadow: "#6B5B3A",
    highlight: "#F3F1FF",
    gamma: 0.8,
  },
};

export const isParticleCase = (slug: string | undefined | null): slug is string =>
  !!slug && slug in PARTICLE_CASES;
