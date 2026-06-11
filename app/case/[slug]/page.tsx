import { getCaseBySlug, getAllCases } from "@/lib/cases";
import { CaseLayout } from "@/components/case/CaseLayout";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const cases = getAllCases();
  return cases.map((c) => ({ slug: c.slug }));
}

export default async function CasePage({ params }: Props) {
  const { slug } = await params;
  const result = getCaseBySlug(slug);
  if (!result) notFound();

  const { frontmatter } = result;

  return (
    <CaseLayout frontmatter={frontmatter}>
      <h1 className="text-3xl font-display leading-tight mb-2">{frontmatter.title}</h1>
      {frontmatter.subtitle && (
        <p className="text-lg font-body text-[var(--color-ink-soft)] mb-4">
          {frontmatter.subtitle}
        </p>
      )}
      <p className="text-sm font-body text-[var(--color-ink-soft)] mb-8">
        {frontmatter.role} · {frontmatter.company} · {frontmatter.year}
      </p>
      <div className="font-body text-base leading-relaxed">
        <p className="text-[var(--color-ink-soft)] italic">Content coming in Phase 1.</p>
      </div>
    </CaseLayout>
  );
}
