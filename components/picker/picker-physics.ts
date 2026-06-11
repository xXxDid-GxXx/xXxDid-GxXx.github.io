export const PICKER_SPRING = {
  type: "spring",
  stiffness: 300,
  damping: 30,
  mass: 0.8,
} as const;

export const SLOT_HEIGHT_DESKTOP = 96;
export const SLOT_HEIGHT_MOBILE = 80;

export function nearestIndex(offset: number, slotHeight: number, count: number): number {
  const raw = Math.round(-offset / slotHeight);
  return ((raw % count) + count) % count;
}

export function projectFinalOffset(
  currentOffset: number,
  velocity: number,
  slotHeight: number,
  count: number
): number {
  const projected = currentOffset + velocity * 0.15;
  const nearestIdx = nearestIndex(projected, slotHeight, count);
  return -(nearestIdx * slotHeight);
}
