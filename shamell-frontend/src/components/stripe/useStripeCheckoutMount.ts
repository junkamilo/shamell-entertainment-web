"use client";

import { useEffect, type RefObject } from "react";

function getViewportHeight(): number {
  return window.visualViewport?.height ?? window.innerHeight;
}

function syncMountHeight(mountEl: HTMLElement): void {
  const iframe = mountEl.querySelector("iframe");
  if (!iframe) return;

  const viewportH = getViewportHeight();
  const inlineHeight = parseFloat(iframe.style.height);
  const stripeH = Number.isFinite(inlineHeight) && inlineHeight > 0
    ? inlineHeight
    : iframe.getBoundingClientRect().height;
  const targetH = Math.max(stripeH, viewportH);

  mountEl.style.height = `${targetH}px`;
  iframe.style.minHeight = `${targetH}px`;
}

/**
 * Ensures the Stripe iframe fills at least the viewport without observing iframe
 * resize (avoids feedback loops with Stripe.js height updates).
 */
export function useStripeCheckoutMount(
  mountRef: RefObject<HTMLElement | null>,
  enabled: boolean,
): void {
  useEffect(() => {
    if (!enabled) return;

    const mountEl = mountRef.current;
    if (!mountEl) return;

    let debounceId = 0;

    const scheduleSync = () => {
      window.clearTimeout(debounceId);
      debounceId = window.setTimeout(() => {
        syncMountHeight(mountEl);
      }, 150);
    };

    const scanForIframe = () => {
      if (mountEl.querySelector("iframe")) {
        syncMountHeight(mountEl);
      }
    };

    scanForIframe();

    const mutationObserver = new MutationObserver(() => {
      scanForIframe();
      scheduleSync();
    });
    mutationObserver.observe(mountEl, { childList: true, subtree: true });

    const onViewportResize = () => scheduleSync();
    window.visualViewport?.addEventListener("resize", onViewportResize);
    window.addEventListener("resize", onViewportResize);

    return () => {
      window.clearTimeout(debounceId);
      mutationObserver.disconnect();
      window.visualViewport?.removeEventListener("resize", onViewportResize);
      window.removeEventListener("resize", onViewportResize);
      mountEl.style.height = "";
      const iframe = mountEl.querySelector("iframe");
      if (iframe instanceof HTMLIFrameElement) {
        iframe.style.minHeight = "";
      }
    };
  }, [mountRef, enabled]);
}
