import type { ReactNode } from "react";

type Props = { author: string; role: string; children: ReactNode };

export function CaseQuote({ author, role, children }: Props) {
  return (
    <blockquote className="border-l-2 border-[var(--color-ink)] pl-4 my-8 font-display italic text-lg">
      <p>{children}</p>
      <footer className="font-body text-sm not-italic mt-2 text-[var(--color-ink-soft)]">
        — {author}, {role}
      </footer>
    </blockquote>
  );
}
