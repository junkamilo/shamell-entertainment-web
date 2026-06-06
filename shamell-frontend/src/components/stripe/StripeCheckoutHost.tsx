"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { StripeEmbeddedCheckout } from "./StripeEmbeddedCheckout";

type Props = {
  clientSecret: string;
  /** Mount in document.body above Shamell modals. Default true. */
  usePortal?: boolean;
  ariaLabel?: string;
};

function useStripeCheckoutBodyLock() {
  useEffect(() => {
    const scrollY = window.scrollY;
    const html = document.documentElement;
    const { body } = document;

    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    html.setAttribute("data-stripe-checkout-open", "true");
    body.setAttribute("data-stripe-checkout-open", "true");

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      html.removeAttribute("data-stripe-checkout-open");
      body.removeAttribute("data-stripe-checkout-open");
      window.scrollTo(0, scrollY);
    };
  }, []);
}

export function StripeCheckoutHost({
  clientSecret,
  usePortal = true,
  ariaLabel = "Secure payment",
}: Props) {
  const [mounted, setMounted] = useState(false);

  useStripeCheckoutBodyLock();

  useEffect(() => {
    setMounted(true);
  }, []);

  const host = (
    <div
      className="stripe-checkout-host"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      <StripeEmbeddedCheckout clientSecret={clientSecret} />
    </div>
  );

  if (!mounted) return null;

  if (usePortal) {
    return createPortal(host, document.body);
  }

  return host;
}
