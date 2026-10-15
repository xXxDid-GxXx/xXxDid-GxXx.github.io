import Image from "next/image";
import type { PickerItem } from "@/types/case";

type Props = { item: PickerItem; cardHeight?: number; rounded?: boolean; centered?: boolean };

// The focused card is purely the preview image — all of its text/link now lives
// in the left column (see HomeStage). The image covers the whole card, which
// itself fills the whole screen.
export function PickerItemFocused({ item, cardHeight = 560 }: Props) {
  return (
    <div
      className="relative overflow-hidden"
      style={{ backgroundColor: "var(--color-bg-dark)", height: cardHeight }}
    >
      {item.thumbnail ? (
        <Image src={item.thumbnail} alt={item.title} fill sizes="100vw" className="object-cover object-center" style={{ objectPosition: item.thumbnailPosition }} priority />
      ) : null}
    </div>
  );
}
