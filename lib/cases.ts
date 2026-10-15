import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { CaseFrontmatter, PickerItem } from "@/types/case";

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
    thumbnail: c.thumbnail,
    thumbnailPosition: c.thumbnailPosition,
    accentColor: c.accentColor,
  }));
}
