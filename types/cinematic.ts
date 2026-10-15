import type { ReactNode } from "react";

/**
 * Content model for a case page. The page's structure and animation are fixed
 * (see components/case/cinematic/CaseCinematic.tsx); the content is built from
 * the case's Markdown file in content/cases/<slug>.mdx by lib/case-story.tsx.
 *
 * Counts are free to vary: zero to two intro panels, any number of slides. The
 * GSAP timelines iterate over whatever is rendered.
 */
export type CinematicStorySlide = {
  title: string;
  /** Optional — a slide without an image renders as a centred text slide. */
  image?: string;
  alt?: string;
  /** Rendered in a two-column layout, one <p> per entry. */
  body: ReactNode[];
};

export type CinematicRevealPanel = {
  title: string;
  paragraphs: ReactNode[];
};

export type CinematicCase = {
  /** Act 1 — dark hero: single image scales up + exits on scroll. */
  hero: {
    image: string;
    alt: string;
    /** Small stacked label lines above the title (e.g. role, company · years). */
    eyebrow: string[];
    /** Title split into explicit lines, joined with <br/>. */
    titleLines: string[];
    description: ReactNode;
  };
  /** Act 2 — optional intro panels: the first is dark; a second, light one is
   *  revealed by wiping the dark panel away. Empty → the act is skipped. */
  intro: CinematicRevealPanel[];
  /** Act 3 — pinned slides, image (click → lightbox) + two-column text. */
  slides: CinematicStorySlide[];
  /** Act 4 — full-viewport outro video (footer is added by the renderer). */
  outroVideo: string;
};
