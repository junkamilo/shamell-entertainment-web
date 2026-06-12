"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { StripeEmbeddedCheckout } from "./StripeEmbeddedCheckout";
import { useStripeOverlayBodyLock } from "./useStripeOverlayBodyLock";

type Layout = "page" | "overlay";

type Props = {
  clientSecret: string;
  layout: Layout;
  ariaLabel?: string;
  className?: string;
};

export function StripeCheckoutHost({
  clientSecret,
  layout,
  ariaLabel = "Secure payment",
  className,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const isOverlay = layout === "overlay";

  useStripeOverlayBodyLock(isOverlay && mounted);

  useEffect(() => {
    setMounted(true);
  }, []);

  const hostClass = isOverlay ? "stripe-checkout-overlay" : "stripe-checkout-host";

  const host = (
    <div
      className={cn(hostClass, className)}
      data-stripe-checkout-overlay={isOverlay ? "" : undefined}
      role={isOverlay ? "dialog" : undefined}
      aria-modal={isOverlay ? true : undefined}
      aria-label={ariaLabel}
    >
      <StripeEmbeddedCheckout clientSecret={clientSecret} />
    </div>
  );

  if (isOverlay) {
    if (!mounted) return null;
    return createPortal(host, document.body);
  }

  return host;
}
