"use client";

import { useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { PickerItem } from "@/types/case";
import { Picker } from "./Picker";

type Props = {
  items: PickerItem[];
  intro?: boolean;
  centered?: boolean;
  gambleNonce?: number;
  onIntroEnd?: () => void;
  onScrollingChange?: (scrolling: boolean) => void;
  onFocusedCaseChange?: (slug: string) => void;
};

export function PickerSection({ items, intro, centered, gambleNonce, onIntroEnd, onScrollingChange, onFocusedCaseChange }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasMountedRef = useRef(false);

  // Validate the ?case= param against known slugs; fall back to "healthcare-er".
  const validSlugs = new Set(items.map((i) => i.slug));
  const rawSlug = searchParams.get("case");
  const initialSlug = rawSlug && validSlugs.has(rawSlug) ? rawSlug : "healthcare-er";

  // Flip after first render so mount-time Picker initialization never writes the
  // URL, and seed the surrounding chrome with the initial focused case.
  useEffect(() => {
    hasMountedRef.current = true;
    onFocusedCaseChange?.(initialSlug);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const urlTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Cancel any pending debounced URL write when the page unmounts (e.g. tapping a
  // card mid-spin navigates to the case page). Otherwise the orphaned timer fires
  // a router.replace from an unmounted component, corrupting App Router history
  // and leaving back-navigation stuck on a pending load until a hard reload.
  useEffect(() => {
    return () => {
      if (urlTimer.current) clearTimeout(urlTimer.current);
    };
  }, []);
  const handleFocusChange = useCallback((slug: string) => {
    // Keep the surrounding column (preview text) in sync immediately so it rolls
    // through cases live as the wheel spins.
    onFocusedCaseChange?.(slug);
    if (!hasMountedRef.current) return;
    // Debounce the URL write: during a fast spin the focus changes many times,
    // but only the final landing should hit the router (and it avoids "Cannot
    // update Router while rendering Picker" by deferring out of reconciliation).
    if (urlTimer.current) clearTimeout(urlTimer.current);
    urlTimer.current = setTimeout(() => router.replace(`/?case=${slug}`, { scroll: false }), 250);
  }, [router, onFocusedCaseChange]);

  return (
    <div className="picker-section h-full">
      <Picker
        items={items}
        initialSlug={initialSlug}
        onFocusChange={handleFocusChange}
        intro={intro}
        centered={centered}
        gambleNonce={gambleNonce}
        onIntroEnd={onIntroEnd}
        onScrollingChange={onScrollingChange}
      />
    </div>
  );
}
