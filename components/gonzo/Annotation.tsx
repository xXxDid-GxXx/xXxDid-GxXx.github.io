"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  rotation?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
};

// Derives a stable float in [-range, range] from a string seed.
// Uses useId() so the value is identical on SSR and client — no hydration mismatch.
function stableRandom(seed: string, range: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) & 0xffff;
  }
  return (h / 0xffff) * range * 2 - range;
}

export function Annotation({
  children,
  rotation,
  color = "var(--color-ink)",
  className,
  style,
}: Props) {
  const id = useId();
  const deg = rotation !== undefined ? rotation : stableRandom(id, 3);

  return (
    <span
      className={cn("font-hand font-bold text-lg leading-none select-none", className)}
      style={{ transform: `rotate(${deg}deg)`, color, display: "inline-block", ...style }}
    >
      {children}
    </span>
  );
}
