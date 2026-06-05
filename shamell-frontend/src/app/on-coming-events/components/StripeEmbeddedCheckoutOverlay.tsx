"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const VenueLayoutCheckoutStep = dynamic(() => import("./VenueLayoutCheckoutStep"), {
  ssr: false,
});

type Props = {
  clientSecret: string;
  onClose?: () => void;
  ariaLabel?: string;
  showCloseButton?: boolean;
  /** When false, only the X button closes the overlay (backdrop clicks are ignored). */
  closeOnBackdropClick?: boolean;
};

export function StripeEmbeddedCheckoutOverlay({
  clientSecret,
  onClose,
  ariaLabel = "Secure payment",
  showCloseButton = true,
  closeOnBackdropClick = true,
}: Props) {
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.setAttribute("data-stripe-checkout-open", "true");
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.removeAttribute("data-stripe-checkout-open");
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-200 flex bg-[#0a0908] sm:items-center sm:justify-center sm:bg-black/80 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      {closeOnBackdropClick && showCloseButton && onClose ? (
        <button
          type="button"
          className="absolute inset-0 hidden sm:block"
          aria-label="Close payment"
          onClick={onClose}
        />
      ) : (
        <div className="absolute inset-0 hidden sm:block" aria-hidden="true" />
      )}
      <div
        className={cn(
          "relative z-10 flex w-full flex-col overflow-hidden bg-white",
          "h-dvh max-h-dvh rounded-none",
          "sm:h-auto sm:max-h-[min(92dvh,860px)] sm:max-w-[min(calc(100vw-1rem),1080px)] sm:rounded-xl sm:shadow-2xl",
        )}
      >
        {showCloseButton && onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-[max(0.75rem,env(safe-area-inset-right,0px))] top-[max(0.75rem,env(safe-area-inset-top,0px))] z-30 rounded-lg bg-black/55 p-2.5 text-white shadow-md backdrop-blur-sm transition hover:bg-black/70 sm:right-3 sm:top-3"
            aria-label="Close"
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        ) : null}
        <div className="stripe-checkout-overlay-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom,0px)]">
          <VenueLayoutCheckoutStep clientSecret={clientSecret} />
        </div>
      </div>
    </div>
  );
}
