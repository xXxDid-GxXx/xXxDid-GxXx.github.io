import type { ReactNode } from "react";

type Props = { title: string; children: ReactNode };

export function CaseSection({ title, children }: Props) {
  return (
    <section className="mt-[var(--space-section)]">
      <h2 className="text-xl font-display mb-4">{title}</h2>
      <div className="font-body text-base leading-relaxed">{children}</div>
    </section>
  );
}
