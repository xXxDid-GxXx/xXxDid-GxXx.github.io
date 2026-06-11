import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Props = { children: ReactNode; className?: string };

export function Container({ children, className }: Props) {
  return (
    <div className={cn("px-[var(--space-gutter)] w-full mx-auto max-w-7xl", className)}>
      {children}
    </div>
  );
}
