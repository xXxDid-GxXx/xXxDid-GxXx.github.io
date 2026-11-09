import Image from "next/image";
import type { MotionValue } from "framer-motion";
import type { PickerItem } from "@/types/case";
import { isParticleCase } from "@/lib/particle-cases";
import { ParticleCardArt } from "./ParticleCardArt";

type Props = { item: PickerItem; cardHeight?: number; rounded?: boolean; centered?: boolean; velocity?: MotionValue<number> };

// The focused card is purely the preview image — all of its text/link now lives
// in the left column (see HomeStage). The image covers the whole card, which
// itself fills the whole screen.
export function PickerItemFocused({ item, cardHeight = 560, velocity }: Props) {
  return (
    <div
      className="relative overflow-hidden"
      style={{ backgroundColor: "var(--color-bg-dark)", height: cardHeight }}
    >
      {isParticleCase(item.slug) ? (
        // Dotted shape while the wheel spins; the live artwork (HomeStage)
        // fades in exactly on top once the wheel lands.
        <ParticleCardArt slug={item.slug} velocity={velocity} />
      ) : item.thumbnail ? (
        <Image src={item.thumbnail} alt={item.title} fill sizes="100vw" draggable={false} className="object-cover object-center select-none" style={{ objectPosition: item.thumbnailPosition }} priority />
      ) : null}
    </div>
  );
}
