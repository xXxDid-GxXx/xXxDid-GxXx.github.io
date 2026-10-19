import Image from "next/image";
import type { PickerItem as PickerItemType } from "@/types/case";

type Props = {
  item: PickerItemType;
  position: number;
  blurAmount?: number;
  cardHeight?: number;
  rounded?: boolean;
};

export function PickerItem({ item, blurAmount = 0, cardHeight = 560, rounded = false }: Props) {
  return (
    <div
      className={`relative w-full overflow-hidden select-none transition-[border-radius] duration-700 ${rounded ? "rounded-[20px]" : "rounded-none"}`}
      style={{
        height: cardHeight,
        filter: blurAmount > 0 ? `blur(${blurAmount}px)` : undefined,
      }}
    >
      {item.thumbnail ? (
        <Image src={item.thumbnail} alt={item.title} fill sizes="100vw" draggable={false} className="object-cover" style={{ objectPosition: item.thumbnailPosition }} />
      ) : (
        <div className="w-full h-full bg-[var(--color-bg-dark)]" />
      )}
    </div>
  );
}
