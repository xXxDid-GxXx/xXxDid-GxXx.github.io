import { cn } from "@/lib/utils";

type Props = { variant?: 1 | 2 | 3; className?: string };

export function Splatter({ variant = 1, className }: Props) {
  return (
    <svg
      aria-hidden="true"
      className={cn("absolute pointer-events-none", className)}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* SVG paths added in Phase 1 step 1.5 */}
      <circle cx="60" cy="60" r="30" fill="var(--color-red)" opacity="0.15" />
    </svg>
  );
}
