"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  lockHomeHashScroll,
  readHomeHashSectionId,
  scrollWindowToHomeSection,
  syncHomeSectionHash,
} from "@/components/shared/site/lib/site-header-nav";

/**
 * On `/` with a section hash, scroll once to that block after navigation.
 * Stops immediately on user scroll intent so retries never fight the wheel.
 */
export default function HomeSectionHashScroll() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/") return;

    const sectionId = readHomeHashSectionId();
    if (!sectionId) return;

    // Top of home: keep URL clean (`/`) — no forced scroll.
    if (sectionId === "hero") {
      syncHomeSectionHash("hero");
      return;
    }

    lockHomeHashScroll(900);

    const previousRestoration =
      "scrollRestoration" in window.history
        ? window.history.scrollRestoration
        : null;
    if (previousRestoration != null) {
      window.history.scrollRestoration = "manual";
    }

    let cancelled = false;
    let foundOnce = false;
    const timers: number[] = [];
    let frame = 0;

    const stop = () => {
      if (cancelled) return;
      cancelled = true;
      window.cancelAnimationFrame(frame);
      for (const id of timers) window.clearTimeout(id);
      lockHomeHashScroll(0);
    };

    const onUserScrollIntent = () => stop();

    window.addEventListener("wheel", onUserScrollIntent, { passive: true });
    window.addEventListener("touchmove", onUserScrollIntent, { passive: true });
    window.addEventListener("pointerdown", onUserScrollIntent, { passive: true });

    const attemptScroll = () => {
      if (cancelled) return;
      const ok = scrollWindowToHomeSection(sectionId);
      if (ok) foundOnce = true;
    };

    attemptScroll();
    frame = window.requestAnimationFrame(attemptScroll);

    // Few short retries only while the target section mounts / grows (lazy catalog).
    // Cancelled as soon as the user scrolls.
    for (const ms of [80, 220, 480]) {
      timers.push(
        window.setTimeout(() => {
          if (cancelled) return;
          attemptScroll();
          // After a successful scroll + last retry window, release the lock early.
          if (foundOnce && ms >= 480) lockHomeHashScroll(0);
        }, ms),
      );
    }

    // Hard stop so we never keep yanking the viewport.
    timers.push(window.setTimeout(stop, 700));

    return () => {
      stop();
      window.removeEventListener("wheel", onUserScrollIntent);
      window.removeEventListener("touchmove", onUserScrollIntent);
      window.removeEventListener("pointerdown", onUserScrollIntent);
      if (previousRestoration != null) {
        window.history.scrollRestoration = previousRestoration;
      }
    };
  }, [pathname]);

  return null;
}
