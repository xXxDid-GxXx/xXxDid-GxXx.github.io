import { getCaseBySlug, getAllCases, getNextCase } from "@/lib/cases";
import { buildCinematicCase } from "@/lib/case-story";
import { CaseCinematic } from "@/components/case/cinematic/CaseCinematic";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const cases = getAllCases();
  return cases.map((c) => ({ slug: c.slug }));
}

/**
 * Every case renders through the cinematic template. All content comes from
 * content/cases/<slug>.mdx — see content/cases/_template.mdx for the format.
 */
export default async function CasePage({ params }: Props) {
  const { slug } = await params;
  const result = getCaseBySlug(slug);
  if (!result) notFound();

  const { frontmatter, content } = result;

  return (
    <CaseCinematic
      slug={slug}
      accent={frontmatter.accentColor}
      data={buildCinematicCase(frontmatter, content)}
      nextCase={getNextCase(slug)}
    />
  );
}
