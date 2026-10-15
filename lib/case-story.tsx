import fs from "fs";
import path from "path";
import { createElement, Fragment, type ReactNode } from "react";
import type { CaseFrontmatter } from "@/types/case";
import type { CinematicCase, CinematicRevealPanel, CinematicStorySlide } from "@/types/cinematic";

/** Played at the end of any case that doesn't set its own `outroVideo`. */
export const DEFAULT_OUTRO_VIDEO = "/videos/tax-ocr-outro.mp4";

/**
 * Turns a case's Markdown file into the cinematic page content.
 *
 * Body conventions (see content/cases/_template.mdx):
 *   ## Heading (intro)   → intro panel (first is dark, second is light; max two)
 *   ## Heading           → story slide
 *   ![alt](/images/...)  → the slide's image (first image in the section)
 *   blank line           → new paragraph
 *   ==highlight== *em* **strong** `code` [link](url) → inline formatting
 *
 * Text before the first `##` becomes a slide titled with the case title. A `#`
 * heading is ignored (the hero already shows the title). Missing image or video
 * files fall back gracefully instead of rendering broken media.
 */
export function buildCinematicCase(fm: CaseFrontmatter, body: string): CinematicCase {
  const sections = parseSections(body);
  const intro: CinematicRevealPanel[] = [];
  const slides: CinematicStorySlide[] = [];

  for (const s of sections) {
    const paragraphs = s.paragraphs.map((text, i) => renderInline(text, i));
    if (s.intro && intro.length < 2) {
      intro.push({ title: s.title ?? fm.title, paragraphs });
      continue;
    }
    if (!s.title && !paragraphs.length && !s.image) continue;
    const image = s.image && publicFileExists(s.image.src) ? s.image : undefined;
    slides.push({
      title: s.title ?? fm.title,
      image: image?.src,
      alt: image?.alt || s.title || fm.title,
      body: paragraphs,
    });
  }

  const heroImage = [fm.heroImage, fm.thumbnail].find((src) => src && publicFileExists(src)) ?? fm.thumbnail;
  const outroVideo =
    fm.outroVideo && publicFileExists(fm.outroVideo) ? fm.outroVideo : DEFAULT_OUTRO_VIDEO;

  return {
    hero: {
      image: heroImage,
      alt: `${fm.title} — hero`,
      eyebrow: [fm.role, `${fm.company} · ${fm.timeline}`],
      titleLines: fm.heroTitle?.length ? fm.heroTitle : [fm.title],
      description: renderInline(fm.preview.description.trim().replace(/\s*\n\s*/g, " ")),
    },
    intro,
    slides,
    outroVideo,
  };
}

type Section = {
  title?: string;
  intro: boolean;
  image?: { src: string; alt: string };
  paragraphs: string[];
};

const IMAGE_LINE = /^!\[([^\]]*)\]\(([^)\s]+)\)$/;

function parseSections(body: string): Section[] {
  const sections: Section[] = [];
  let current: Section = { intro: false, paragraphs: [] };
  let para: string[] = [];

  const flushPara = () => {
    const text = para.join(" ").trim();
    para = [];
    if (!text) return;
    const img = text.match(IMAGE_LINE);
    if (img) {
      current.image ??= { alt: img[1], src: img[2] };
    } else {
      current.paragraphs.push(text);
    }
  };

  for (const raw of body.split(/\r?\n/)) {
    const line = raw.trim();
    if (line.startsWith("## ")) {
      flushPara();
      sections.push(current);
      const heading = line.slice(3).trim();
      const intro = /\(intro\)\s*$/i.test(heading);
      current = {
        title: heading.replace(/\(intro\)\s*$/i, "").trim(),
        intro,
        paragraphs: [],
      };
    } else if (line.startsWith("# ") || line.startsWith("<!--")) {
      flushPara();
    } else if (!line) {
      flushPara();
    } else {
      para.push(line);
    }
  }
  flushPara();
  sections.push(current);
  return sections;
}

function publicFileExists(src: string): boolean {
  if (!src.startsWith("/")) return true; // external URL — trust it
  return fs.existsSync(path.join(process.cwd(), "public", decodeURI(src)));
}

const INLINE = /==([^=]+)==|\*\*([^*]+)\*\*|\*([^*]+)\*|_([^_]+)_|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)/g;

/** Minimal inline Markdown → React: ==highlight==, **strong**, *em*, `code`, [link](url). */
function renderInline(text: string, key?: number): ReactNode {
  const out: ReactNode[] = [];
  let last = 0;
  let k = 0;
  for (const m of text.matchAll(INLINE)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const [, mark, strong, em1, em2, code, linkText, href] = m;
    if (mark) out.push(<mark key={k++} className="case-highlight">{mark}</mark>);
    else if (strong) out.push(<strong key={k++} className="font-semibold">{strong}</strong>);
    else if (em1 || em2) out.push(<em key={k++} className="italic">{em1 ?? em2}</em>);
    else if (code) out.push(<span key={k++} className="font-mono" style={{ fontSize: "0.87em" }}>{code}</span>);
    else if (linkText) {
      const external = href.startsWith("http");
      out.push(
        <a
          key={k++}
          href={href}
          className="underline underline-offset-2 hover:opacity-70 transition-opacity"
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
        >
          {linkText}
        </a>
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  // Spread as children so plain-text pieces don't need keys.
  return createElement(Fragment, { key }, ...out);
}
