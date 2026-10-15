import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Bricolage Grotesque — variable font, weight 200–800 (display voice)
const bricolageGrotesque = localFont({
  src: "../public/fonts/bricolage-grotesque-variable.woff2",
  variable: "--font-display",
  display: "swap",
  weight: "200 800",
});

// JetBrains Mono — variable font, weight 100–800 (body / typewriter voice)
const jetbrainsMono = localFont({
  src: "../public/fonts/jetbrains-mono-variable.woff2",
  variable: "--font-body",
  display: "swap",
  weight: "100 800",
});

// Caveat — weight 700 only (marginalia / hand-drawn voice)
const caveat = localFont({
  src: "../public/fonts/caveat-700.woff2",
  variable: "--font-hand",
  display: "swap",
  weight: "700",
});

export const metadata: Metadata = {
  title: "Hlib Didkovskyi — Product Designer & Product Owner",
  description:
    "Portfolio of Hlib Didkovskyi, Product Designer and Product Owner.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bricolageGrotesque.variable} ${jetbrainsMono.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="min-h-full" suppressHydrationWarning>{children}</body>
    </html>
  );
}
