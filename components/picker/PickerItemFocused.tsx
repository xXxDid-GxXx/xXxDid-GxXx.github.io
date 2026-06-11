import type { PickerItem } from "@/types/case";
import Image from "next/image";
import Link from "next/link";

type Props = { item: PickerItem };

export function PickerItemFocused({ item }: Props) {
  return (
    <div
      className="flex flex-col gap-2 px-4 py-3"
      style={{ borderLeft: `3px solid ${item.accentColor}` }}
    >
      {item.subtitle && (
        <span className="text-xs font-body text-[var(--color-ink-soft)]">
          {item.subtitle}
        </span>
      )}
      <h2 className="text-2xl font-display leading-tight">{item.title}</h2>
      <p className="text-sm font-body text-[var(--color-ink-soft)]">
        {item.role} · {item.year}
      </p>
      <p className="text-sm font-body leading-relaxed max-w-xs">{item.preview}</p>
      {item.thumbnail && (
        <div className="relative w-full h-32 mt-1 overflow-hidden rounded-sm">
          <Image
            src={item.thumbnail}
            alt={item.title}
            fill
            className="object-cover"
            sizes="300px"
          />
        </div>
      )}
      <Link
        href={`/case/${item.slug}`}
        className="text-sm font-body underline mt-1 self-start"
      >
        See full case →
      </Link>
    </div>
  );
}
