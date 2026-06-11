"use client";

import type { PickerProps } from "@/types/case";

// Full implementation in Phase 1 (step 1.4)
export function Picker({ items, initialSlug = "glazd", onFocusChange }: PickerProps) {
  return (
    <nav aria-label="Case studies" role="listbox">
      <ol>
        {items.map((item) => (
          <li key={item.slug} role="option" aria-selected={item.slug === initialSlug}>
            <a href={`/case/${item.slug}`}>{item.title}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
