"use client";

import { useEffect, useRef, useState } from "react";

type UseInViewOptions = {
  rootMargin?: string;
  /** Intersection ratio threshold (0–1). Default 0. */
  threshold?: number | number[];
  /** When false, the observer is not attached and inView stays false. */
  enabled?: boolean;
};

/**
 * Continuous viewport tracking (enters and leaves). Use for gating heavy media;
 * prefer `use-in-view-load` for one-shot fetch deferral.
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(
  options?: UseInViewOptions,
) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  const enabled = options?.enabled ?? true;
  const rootMargin = options?.rootMargin ?? "200px";
  const threshold = options?.threshold ?? 0;

  useEffect(() => {
    if (!enabled) {
      setInView(false);
      return;
    }
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        setInView(entries.some((entry) => entry.isIntersecting));
      },
      { rootMargin, threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [enabled, rootMargin, threshold]);

  return { ref, inView };
}
