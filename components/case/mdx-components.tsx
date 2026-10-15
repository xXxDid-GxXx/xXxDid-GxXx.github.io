import type { MDXComponents } from "mdx/types";
import { CaseHero } from "./CaseHero";
import { CaseSection } from "./CaseSection";
import { CaseGallery } from "./CaseGallery";
import { CaseQuote } from "./CaseQuote";
import { BeforeAfter } from "./BeforeAfter";
import { VideoEmbed } from "./VideoEmbed";

export const mdxComponents: MDXComponents = {
  // ── Headings ── Bricolage Grotesque (font-display)
  h1: ({ children }) => (
    <h1 className="font-display text-3xl font-bold leading-tight mt-12 mb-4 first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="font-display text-2xl font-bold leading-tight mt-10 mb-3">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="font-display text-xl font-semibold leading-snug mt-8 mb-2">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="font-display text-base font-semibold mt-6 mb-2 uppercase tracking-wide">
      {children}
    </h4>
  ),

  // ── Body ── JetBrains Mono (font-body)
  p: ({ children }) => (
    <p className="font-body text-base leading-relaxed mb-5 text-[var(--color-ink)]">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="font-body text-base mb-5 space-y-3 list-none pl-0">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="font-body text-base mb-5 space-y-3 list-decimal pl-5">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="flex gap-2 leading-relaxed">
      <span
        className="text-[var(--color-ink-muted)] flex-shrink-0 select-none mt-0.5"
        aria-hidden
      >
        —
      </span>
      <span>{children}</span>
    </li>
  ),
  blockquote: ({ children }) => (
    <blockquote className="font-body border-l-2 border-[var(--color-case-accent,var(--color-divider))] pl-5 my-8 text-[var(--color-ink-soft)] italic">
      {children}
    </blockquote>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-[var(--color-ink)]">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  hr: () => (
    <hr className="border-t border-[var(--color-divider)] my-10" />
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      className="underline decoration-[var(--color-case-accent,var(--color-ink-muted))] underline-offset-2 hover:text-[var(--color-case-accent,var(--color-ink))] transition-colors"
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
    >
      {children}
    </a>
  ),
  code: ({ children }) => (
    <code className="font-body text-sm bg-[var(--color-bg-deep)] px-1.5 py-0.5 rounded-sm">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="font-body text-sm bg-[var(--color-bg-deep)] p-4 my-6 overflow-x-auto rounded-sm">
      {children}
    </pre>
  ),

  // ── Custom MDX components ──
  CaseHero,
  CaseSection,
  CaseGallery,
  CaseQuote,
  BeforeAfter,
  VideoEmbed,
};
