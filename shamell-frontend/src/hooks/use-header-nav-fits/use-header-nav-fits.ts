"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * Detects horizontal overflow on the desktop header row.
 * When true, the caller should fall back to the hamburger shell.
 */
export function useHeaderNavOverflow(
  rowRef: RefObject<HTMLElement | null>,
  enabled: boolean,
  remeasureKey = 0,
): boolean {
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setOverflows(false);
      return;
    }

    const measure = () => {
      const row = rowRef.current;
      if (!row) return;
      setOverflows(row.scrollWidth > row.clientWidth + 1);
    };

    measure();

    const row = rowRef.current;
    if (!row) return;

    const observer = new ResizeObserver(measure);
    observer.observe(row);
    window.addEventListener("resize", measure, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [rowRef, enabled, remeasureKey]);

  return overflows;
}
