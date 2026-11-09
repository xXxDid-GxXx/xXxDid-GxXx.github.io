import Image from "next/image";
import type { MotionValue } from "framer-motion";
import type { PickerItem as PickerItemType } from "@/types/case";
import { isParticleCase } from "@/lib/particle-cases";
import { ParticleCardArt } from "./ParticleCardArt";

type Props = {
  item: PickerItemType;
  position: number;
  blurAmount?: number;
  cardHeight?: number;
  rounded?: boolean;
  /** Drum speed (cases/s) — drives the particle cards' streaks. */
  velocity?: MotionValue<number>;
  /** Whether the card is on the visible part of the drum. */
  visible?: boolean;
};

export function PickerItem({ item, blurAmount = 0, cardHeight = 560, rounded = false, velocity, visible = true }: Props) {
  return (
    <div
      className={`relative w-full overflow-hidden select-none transition-[border-radius] duration-700 ${rounded ? "rounded-[20px]" : "rounded-none"}`}
      style={{
        height: cardHeight,
        filter: blurAmount > 0 ? `blur(${blurAmount}px)` : undefined,
      }}
    >
      {isParticleCase(item.slug) ? (
        <ParticleCardArt slug={item.slug} velocity={velocity} active={visible} />
      ) : item.thumbnail ? (
        <Image src={item.thumbnail} alt={item.title} fill sizes="100vw" draggable={false} className="object-cover" style={{ objectPosition: item.thumbnailPosition }} />
      ) : (
        <div className="w-full h-full bg-[var(--color-bg-dark)]" />
      )}
    </div>
  );
}
