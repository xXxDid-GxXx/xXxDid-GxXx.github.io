import type { CaseFrontmatter } from "@/types/case";
import type { ReactNode } from "react";
import Link from "next/link";
import { ContactStrip } from "@/components/shell/ContactStrip";

type Props = {
  slug: string;
  nextCase: CaseFrontmatter;
  accentColor?: string;
  children: ReactNode;
};

export function CaseLayout({ slug, nextCase, accentColor, children }: Props) {
  return (
    <div
      className="min-h-screen bg-[var(--color-bg)]"
      style={accentColor ? ({ "--color-case-accent": accentColor } as React.CSSProperties) : undefined}
    >
      {/* Sticky header */}
      <header className="sticky top-0 z-10 bg-[var(--color-bg)] border-b border-[var(--color-divider)] px-[var(--space-gutter)] py-3">
        <Link
          href={`/?case=${slug}`}
          className="font-body text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] transition-colors"
        >
          ← back to the wheel
        </Link>
      </header>

      {/* Reading column */}
      <main className="max-w-[72ch] mx-auto px-[var(--space-gutter)] pt-[var(--space-section)] pb-16">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--color-divider)]">
        <div className="max-w-[72ch] mx-auto px-[var(--space-gutter)] py-[var(--space-section)] flex flex-col gap-10">
          <div>
            <p className="font-body text-xs uppercase tracking-widest text-[var(--color-ink-muted)] mb-3">
              next case
            </p>
            <Link
              href={`/case/${nextCase.slug}`}
              className="group inline-flex items-baseline gap-2 font-display text-2xl font-bold text-[var(--color-ink)] hover:text-[var(--color-case-accent,var(--color-ink-soft))] transition-colors"
            >
              <span>{nextCase.title}</span>
              <span className="inline-block transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>
            {nextCase.subtitle && (
              <p className="font-body text-sm text-[var(--color-ink-soft)] mt-1">
                {nextCase.subtitle}
              </p>
            )}
          </div>
          <ContactStrip />
        </div>
      </footer>
    </div>
  );
}
