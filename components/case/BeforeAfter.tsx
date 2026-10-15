"use client";

import Image from "next/image";
import { useState } from "react";

type Props = { before: string; after: string; beforeAlt?: string; afterAlt?: string };

export function BeforeAfter({ before, after, beforeAlt = "Before", afterAlt = "After" }: Props) {
  const [showAfter, setShowAfter] = useState(false);
  return (
    <div className="relative my-8">
      <div className="relative w-full aspect-video">
        <Image
          src={showAfter ? after : before}
          alt={showAfter ? afterAlt : beforeAlt}
          fill
          className="object-cover"
          sizes="100vw"
        />
      </div>
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => setShowAfter(false)}
          className={`text-xs font-body px-2 py-1 border ${!showAfter ? "bg-[var(--color-ink)] text-[var(--color-bg)]" : ""}`}
        >
          Before
        </button>
        <button
          onClick={() => setShowAfter(true)}
          className={`text-xs font-body px-2 py-1 border ${showAfter ? "bg-[var(--color-ink)] text-[var(--color-bg)]" : ""}`}
        >
          After
        </button>
      </div>
    </div>
  );
}
