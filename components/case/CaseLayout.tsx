import type { CaseFrontmatter } from "@/types/case";
import type { ReactNode } from "react";
import Link from "next/link";

type Props = { frontmatter: CaseFrontmatter; children: ReactNode };

export function CaseLayout({ frontmatter, children }: Props) {
  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      <header className="sticky top-0 z-10 bg-[var(--color-paper)] border-b border-[var(--color-ink)]/10 px-[var(--space-gutter)] py-3">
        <Link href="/" className="text-sm font-body hover:underline">
          ← back to the wheel
        </Link>
      </header>
      <main className="max-w-3xl mx-auto px-[var(--space-gutter)] py-[var(--space-section)]">
        {children}
      </main>
    </div>
  );
}
