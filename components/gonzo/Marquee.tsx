"use client";

import { cn } from "@/lib/utils";

type Props = { text: string; className?: string };

export function Marquee({ text, className }: Props) {
  return (
    <div
      className={cn("overflow-hidden whitespace-nowrap font-display text-4xl py-4", className)}
      aria-hidden="true"
    >
      {/* Animation added in Phase 1 step 1.5 */}
      <span>{text}</span>
    </div>
  );
}
