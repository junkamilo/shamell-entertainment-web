"use client";

import { useEffect, useRef, useState } from "react";

type UseInViewLoadOptions = {
  rootMargin?: string;
  /** When false, the observer is not attached and inView stays false. */
  enabled?: boolean;
};

/**
 * One-shot viewport gate for deferring below-the-fold work (fetches, heavy
 * media) until the element is near the viewport. Once it fires, it stays true.
 */
export function useInViewLoad<T extends HTMLElement = HTMLDivElement>(
  options?: UseInViewLoadOptions,
) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  const enabled = options?.enabled ?? true;

  useEffect(() => {
    if (!enabled || inView) return;
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: options?.rootMargin ?? "400px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [enabled, inView, options?.rootMargin]);

  return { ref, inView };
}
