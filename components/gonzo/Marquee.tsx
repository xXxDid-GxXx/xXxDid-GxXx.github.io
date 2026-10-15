"use client";

import { useRef, useState, useLayoutEffect } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  speed?: number;
  direction?: "left" | "right";
  className?: string;
};

export function Marquee({
  children,
  speed = 40,
  direction = "left",
  className,
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  // Duration is measured after mount; 10s is a safe visible fallback.
  const [duration, setDuration] = useState(10);
  const prefersReducedMotion = useReducedMotion() ?? false;

  // useLayoutEffect avoids the speed-correction flash: measurement happens
  // synchronously before the first paint so the animation starts correct.
  useLayoutEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    // scrollWidth = width of both copies; one copy = scrollWidth / 2
    const oneWidth = el.scrollWidth / 2;
    if (oneWidth > 0) setDuration(oneWidth / speed);
  }, [speed, children]);

  const itemClass =
    "flex items-center px-8 font-display text-4xl font-bold uppercase tracking-tight whitespace-nowrap";

  return (
    <div
      className={cn(
        "w-full overflow-hidden bg-[var(--color-ink)] text-[var(--color-bg)] py-3",
        className,
      )}
    >
      <div
        ref={trackRef}
        style={{
          display: "flex",
          width: "max-content",
          willChange: "transform",
          animationName: `marquee-${direction}`,
          animationDuration: `${duration}s`,
          animationTimingFunction: "linear",
          animationIterationCount: "infinite",
          // Pause instead of removing animation so it resumes at the correct offset
          // if the user later toggles reduced-motion off mid-session.
          animationPlayState: prefersReducedMotion ? "paused" : "running",
        }}
      >
        <span className={itemClass}>{children}</span>
        {/* Second copy makes the loop seamless — translateX(-50%) lands here */}
        <span className={itemClass} aria-hidden="true">{children}</span>
      </div>
    </div>
  );
}
