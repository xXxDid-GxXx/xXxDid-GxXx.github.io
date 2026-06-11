import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { CaseFrontmatter, PickerItem } from "@/types/case";

const CASES_DIR = path.join(process.cwd(), "content/cases");

export function getAllCases(): CaseFrontmatter[] {
  const files = fs.readdirSync(CASES_DIR).filter((f) => f.endsWith(".mdx"));
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
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  return { frontmatter: data as CaseFrontmatter, content };
}

export function casesToPickerItems(cases: CaseFrontmatter[]): PickerItem[] {
  return cases.map((c, i) => ({
    slug: c.slug,
    index: i,
    title: c.title,
    subtitle: c.subtitle,
    role: c.role,
    year: String(c.year),
    preview: c.preview.description,
    thumbnail: c.thumbnail,
    accentColor: c.accentColor,
  }));
}
