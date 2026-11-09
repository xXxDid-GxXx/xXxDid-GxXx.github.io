import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { CaseFrontmatter, PickerItem } from "@/types/case";
import { isParticleCase } from "@/lib/particle-cases";

const CASES_DIR = path.join(process.cwd(), "content/cases");

export function getAllCases(): CaseFrontmatter[] {
  // Files starting with "_" (e.g. _template.mdx) are not published.
  const files = fs
    .readdirSync(CASES_DIR)
    .filter((f) => f.endsWith(".mdx") && !f.startsWith("_"));
  const cases = files.map((filename) => {
    const raw = fs.readFileSync(path.join(CASES_DIR, filename), "utf-8");
    const { data } = matter(raw);
    return data as CaseFrontmatter;
  });
  return cases.sort((a, b) => a.order - b.order);
}

export function getCaseBySlug(
  slug: string
): { frontmatter: CaseFrontmatter; content: string } | null {
  const filePath = path.join(CASES_DIR, `${slug}.mdx`);
  if (slug.startsWith("_") || !fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  return { frontmatter: data as CaseFrontmatter, content };
}

export function getNextCase(slug: string): CaseFrontmatter {
  const cases = getAllCases();
  const idx = cases.findIndex((c) => c.slug === slug);
  return cases[(idx + 1) % cases.length] ?? cases[0];
}

/** The first sentence of a paragraph (up to the first . ! or ? followed by a space or the end). */
export function firstSentence(text: string): string {
  const flat = text.replace(/\s+/g, " ").trim();
  const m = flat.match(/^.*?[.!?](?=\s|$)/);
  return m ? m[0] : flat;
}

export function casesToPickerItems(cases: CaseFrontmatter[]): PickerItem[] {
  return cases.map((c, i) => ({
    slug: c.slug,
    index: i,
    title: c.title,
    subtitle: c.subtitle,
    tagline: c.preview.short,
    role: c.role,
    year: String(c.year),
    preview: c.preview.description,
    summary: firstSentence(c.preview.description),
    // Particle cases (lib/particle-cases.ts) have no card image: the wheel card
    // stays dark and the live particle artwork (HomeStage) is all that shows.
    thumbnail: isParticleCase(c.slug) ? "" : c.thumbnail,
    thumbnailPosition: c.thumbnailPosition,
    accentColor: c.accentColor,
    tools: c.tools ?? [],
    company: c.company,
    status: c.status,
  }));
}
