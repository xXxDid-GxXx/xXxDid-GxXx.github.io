import { compileMDX } from "next-mdx-remote/rsc";
import type { ReactElement } from "react";

export async function parseMDX(source: string): Promise<{
  content: ReactElement;
  frontmatter: Record<string, unknown>;
}> {
  const { content, frontmatter } = await compileMDX({
    source,
    options: { parseFrontmatter: true },
  });
  return { content, frontmatter };
}
