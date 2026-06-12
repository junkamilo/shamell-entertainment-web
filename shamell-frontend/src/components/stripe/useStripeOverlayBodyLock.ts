"use client";

import { useEffect } from "react";

/**
 * Locks body scroll while the Stripe overlay is open.
 * Scroll happens on `.stripe-checkout-overlay` instead (avoids double scroll on mobile).
 */
export function useStripeOverlayBodyLock(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const scrollY = window.scrollY;
    const { body } = document;
    const previousOverflow = body.style.overflow;

    body.style.overflow = "hidden";

    return () => {
      body.style.overflow = previousOverflow;
      window.scrollTo(0, scrollY);
    };
  }, [enabled]);
}
