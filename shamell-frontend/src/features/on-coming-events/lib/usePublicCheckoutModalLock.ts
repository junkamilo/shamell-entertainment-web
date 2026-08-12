"use client";

import { useEffect } from "react";

const ATTR = "data-public-checkout-modal";

/**
 * While a public class/ticket checkout modal is open:
 * - lock body scroll
 * - mark body so floating chrome (WhatsApp, sticky purchase bar) hides via CSS
 */
export function usePublicCheckoutModalLock(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const { body } = document;
    const previousOverflow = body.style.overflow;
    const previousAttr = body.getAttribute(ATTR);

    body.style.overflow = "hidden";
    body.setAttribute(ATTR, "open");

    return () => {
      body.style.overflow = previousOverflow;
      if (previousAttr == null) body.removeAttribute(ATTR);
      else body.setAttribute(ATTR, previousAttr);
    };
  }, [enabled]);
}
