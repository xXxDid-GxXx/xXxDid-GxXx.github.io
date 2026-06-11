import { cn } from "@/lib/utils";

type Props = { className?: string; direction?: "left" | "right" | "up" | "down" };

export function Arrow({ className, direction = "right" }: Props) {
  return (
    <svg
      aria-hidden="true"
      className={cn("absolute pointer-events-none", className)}
      viewBox="0 0 60 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* SVG paths added in Phase 1 step 1.5 */}
      <path d="M0 10 L50 10 M40 2 L50 10 L40 18" stroke="var(--color-ink)" strokeWidth="2" />
    </svg>
  );
}
