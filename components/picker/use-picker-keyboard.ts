import { useEffect } from "react";

type UsePickerKeyboardOptions = {
  onUp: () => void;
  onDown: () => void;
  onSelect: () => void;
  enabled: boolean;
};

export function usePickerKeyboard({
  onUp,
  onDown,
  onSelect,
  enabled,
}: UsePickerKeyboardOptions) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") { e.preventDefault(); onUp(); }
      if (e.key === "ArrowDown") { e.preventDefault(); onDown(); }
      if (e.key === "Enter") { e.preventDefault(); onSelect(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onUp, onDown, onSelect, enabled]);
}
