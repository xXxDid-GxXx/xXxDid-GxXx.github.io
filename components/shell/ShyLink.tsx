"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

// A link that playfully dodges the cursor as it approaches, but only by a small,
// capped amount — so it ducks away just enough to tease, while still staying
// catchable and clickable. The dodge is computed from the link's REST position
// (current rect minus the live offset) so the displacement can't feed back into
// itself and jitter.
const RADIUS = 110;     // start dodging once the cursor is within this many px
const MAX_OFFSET = 16;  // never run further than this, so it can always be caught

type Props = {
  href: string;
  className?: string;
  children: ReactNode;
};

export function ShyLink({ href, className, children }: Props) {
  const wrapRef = useRef<HTMLSpanElement>(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Respect users who prefer reduced motion — no dodging for them.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onMove = (e: MouseEvent) => {
      const el = wrapRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      // Rest centre = where the link sits with the current dodge removed.
      const cx = r.left + r.width / 2 - offsetRef.current.x;
      const cy = r.top + r.height / 2 - offsetRef.current.y;
      const dx = cx - e.clientX;
      const dy = cy - e.clientY;
      const dist = Math.hypot(dx, dy);

      let next = { x: 0, y: 0 };
      if (dist > 0 && dist < RADIUS) {
        // Closer cursor → bigger push, but clamped to MAX_OFFSET.
        const push = (1 - dist / RADIUS) * MAX_OFFSET;
        next = { x: (dx / dist) * push, y: (dy / dist) * push };
      }
      offsetRef.current = next;
      setOffset(next);
    };

    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <span
      ref={wrapRef}
      className="inline-block"
      style={{
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        transition: "transform 140ms ease-out",
        willChange: "transform",
      }}
    >
      <Link href={href} className={className}>
        {children}
      </Link>
    </span>
  );
}
