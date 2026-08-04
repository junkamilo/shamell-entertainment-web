import { useEffect, type RefObject } from "react";

type UseDismissOnOutsideOrEscapeArgs = {
  open: boolean;
  onClose: () => void;
  containerRef: RefObject<HTMLElement | null>;
};

/**
 * While `open`, closes on outside mousedown or Escape.
 */
export function useDismissOnOutsideOrEscape({
  open,
  onClose,
  containerRef,
}: UseDismissOnOutsideOrEscapeArgs) {
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const el = containerRef.current;
      if (el && !el.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, containerRef]);
}
