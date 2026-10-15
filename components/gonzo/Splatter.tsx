"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

type Props = {
  variant?: "a" | "b" | "c";
  size?: number;
  color?: string;
  rotation?: number;
  className?: string;
  style?: React.CSSProperties;
};

// One entry per variant: an array of SVG path `d` strings.
// First path = main blob; subsequent paths = satellites.
// viewBox is "0 0 120 120" for all variants.
// Hlib will hand-craft replacements — add new keys here to extend.
const SPLATTERS: Record<"a" | "b" | "c", string[]> = {
  // Variant a: central irregular blob + 5 satellite blobs
  a: [
    "M55,22 C72,12 96,18 106,38 C116,58 108,84 90,96 C72,108 46,110 28,98 C10,86 6,60 14,40 C22,20 38,10 55,22 Z",
    "M10,14 C14,8 22,10 22,18 C22,26 16,30 10,26 C4,22 6,20 10,14 Z",
    "M92,8 C96,2 104,6 105,14 C106,22 100,26 94,22 C88,18 88,14 92,8 Z",
    "M108,62 C112,56 118,60 118,68 C118,76 112,80 108,76 C104,72 104,68 108,62 Z",
    "M46,108 C50,102 58,106 58,114 C58,120 52,118 47,116 C42,114 42,114 46,108 Z",
    "M4,72 C8,66 14,70 14,78 C14,86 8,88 4,84 C0,80 0,78 4,72 Z",
  ],
  // Variant b: horizontal elongated blob with two drips + 3 satellites
  b: [
    "M20,50 C24,30 52,16 78,18 C104,20 118,38 116,60 C114,80 94,95 68,94 C42,93 18,78 16,62 C15,56 17,52 20,50 Z",
    "M60,94 C64,94 67,102 66,110 C65,118 61,120 58,118 C55,116 55,112 57,104 C59,96 56,94 60,94 Z",
    "M77,92 C81,92 84,100 82,108 C80,116 76,118 73,116 C70,114 71,110 73,103 C75,96 73,92 77,92 Z",
    "M8,26 C12,18 22,21 23,30 C24,39 17,44 10,40 C3,36 4,30 8,26 Z",
    "M98,10 C103,3 112,7 113,16 C114,25 108,29 102,25 C96,21 93,17 98,10 Z",
    "M112,72 C116,66 118,70 118,78 C118,86 114,88 110,84 C106,80 108,78 112,72 Z",
  ],
  // Variant c: rounder central blob + 8 scattered satellites of varying sizes
  c: [
    "M55,25 C72,14 98,22 106,44 C114,66 104,92 84,102 C64,112 36,108 22,90 C8,72 10,44 26,32 C34,26 44,24 55,25 Z",
    "M8,45 C12,38 20,41 21,49 C22,57 16,61 10,57 C4,53 4,50 8,45 Z",
    "M85,8 C90,2 99,5 100,13 C101,21 95,25 89,21 C83,17 80,14 85,8 Z",
    "M22,106 C26,100 35,103 36,111 C37,119 31,120 25,118 C19,114 18,112 22,106 Z",
    "M100,90 C105,84 112,88 112,96 C112,104 106,107 101,103 C96,99 95,96 100,90 Z",
    "M6,82 C10,76 16,79 17,86 C18,93 14,97 9,94 C4,91 4,88 6,82 Z",
    "M74,6 C79,0 88,3 88,11 C88,19 82,23 77,19 C72,15 70,12 74,6 Z",
    "M110,38 C115,32 118,36 118,44 C118,52 114,56 110,52 C106,48 108,44 110,38 Z",
    "M14,20 C18,14 26,17 26,24 C26,31 20,35 15,31 C10,27 10,26 14,20 Z",
  ],
};

function stableRandom(seed: string, range: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) & 0xffff;
  }
  return (h / 0xffff) * range * 2 - range;
}

export function Splatter({
  variant = "a",
  size = 200,
  color = "var(--color-ink)",
  rotation,
  className,
  style,
}: Props) {
  const id = useId();
  const deg = rotation !== undefined ? rotation : stableRandom(id, 10);
  const paths = SPLATTERS[variant];

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 120 120"
      width={size}
      height={size}
      style={{ transform: `rotate(${deg}deg)`, display: "block", color, ...style }}
      className={cn("pointer-events-none", className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      {paths.map((d, i) => (
        <path key={i} d={d} fill="currentColor" />
      ))}
    </svg>
  );
}
