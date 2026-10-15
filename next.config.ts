import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const withMDX = createMDX({
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
});

const nextConfig: NextConfig = {
  pageExtensions: ["js", "jsx", "mdx", "ts", "tsx"],
  // Static export for GitHub Pages (didportfolio.com): `next build` writes the
  // whole site to out/. Pages has no image optimizer, so images ship as-is.
  output: "export",
  images: { unoptimized: true },
  // Dev only: let phones on the local Wi-Fi load the dev server's scripts via
  // this Mac's LAN address (Next blocks non-localhost dev origins by default).
  // Update if the Mac's IP changes (System Settings → Wi-Fi → Details).
  allowedDevOrigins: ["192.168.1.30"],
};

export default withMDX(nextConfig);
