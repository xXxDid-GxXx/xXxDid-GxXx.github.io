import { cn } from "@/lib/utils";

type Direction =
  | "up" | "down" | "left" | "right"
  | "up-left" | "up-right" | "down-left" | "down-right";

type Props = {
  direction?: Direction;
  length?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
};

// Rotation (degrees) for each compass direction.
// Base arrow points right; SVG group is rotated around viewBox center (50, 50).
const DIRECTION_DEG: Record<Direction, number> = {
  right:       0,
  "down-right": 45,
  down:        90,
  "down-left": 135,
  left:        180,
  "up-left":   225,
  up:          270,
  "up-right":  315,
};

export function Arrow({
  direction = "right",
  length = 80,
  color = "var(--color-ink)",
  className,
  style,
}: Props) {
  const deg = DIRECTION_DEG[direction];

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 100"
      width={length}
      height={length}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", color, ...style }}
      className={cn("pointer-events-none", className)}
    >
      <g transform={`rotate(${deg} 50 50)`} strokeLinecap="round" strokeLinejoin="round">
        {/* Wobbly shaft: cubic bezier with off-axis control points for hand-drawn feel */}
        <path
          d="M8,50 C28,47 55,53 87,50"
          stroke="currentColor"
          strokeWidth="2"
        />
        {/* Arrowhead: open chevron at tip */}
        <path
          d="M75,42 L89,50 L75,58"
          stroke="currentColor"
          strokeWidth="2"
        />
      </g>
    </svg>
  );
}
