"use client";

import dynamic from "next/dynamic";
import { X } from "lucide-react";

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
  return (
    <div
      className="fixed inset-0 z-120 flex items-end justify-center bg-black/80 p-2 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      {closeOnBackdropClick && showCloseButton && onClose ? (
        <button
          type="button"
          className="absolute inset-0"
          aria-label="Close payment"
          onClick={onClose}
        />
      ) : (
        <div className="absolute inset-0" aria-hidden="true" />
      )}
      <div className="relative z-10 flex h-[min(92dvh,860px)] w-full max-w-[min(100vw-0.5rem,1120px)] flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-w-[min(100vw-1rem,1120px)] sm:rounded-xl">
        {showCloseButton && onClose ? (
          <div className="absolute right-2 top-2 z-20 sm:right-3 sm:top-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-white/90 p-2.5 text-neutral-500 shadow-sm transition hover:bg-neutral-100 hover:text-neutral-800"
              aria-label="Close"
            >
              <X className="h-5 w-5" strokeWidth={1.75} />
            </button>
          </div>
        ) : null}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-0 py-0">
          <VenueLayoutCheckoutStep clientSecret={clientSecret} />
        </div>
      </div>
    </div>
  );
}
