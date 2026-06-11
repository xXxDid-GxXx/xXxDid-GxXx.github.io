import type { PickerItem as PickerItemType } from "@/types/case";

type Props = {
  item: PickerItemType;
  position: number; // distance from focused (−3 to +3)
  onClick: () => void;
};

export function PickerItem({ item, position, onClick }: Props) {
  const absPos = Math.abs(position);
  const label = absPos <= 1 ? `${item.title} · ${item.role}` : item.title;
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left w-full truncate font-body"
      tabIndex={-1}
      aria-label={item.title}
    >
      {label}
    </button>
  );
}
