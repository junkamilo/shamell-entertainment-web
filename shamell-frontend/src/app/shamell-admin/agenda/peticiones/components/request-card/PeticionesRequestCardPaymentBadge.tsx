"use client";

import {
  paymentCardBadge,
  type PaymentCardVisual,
} from "../../lib/peticionesPaymentCardState";

type Props = {
  bookingPaymentVisual: PaymentCardVisual | null;
  isReserved: boolean;
  isCancelled: boolean;
};

export default function PeticionesRequestCardPaymentBadge({
  bookingPaymentVisual,
  isReserved,
  isCancelled,
}: Props) {
  const bookingBadge =
    bookingPaymentVisual != null ? paymentCardBadge(bookingPaymentVisual) : null;

  if (bookingBadge) {
    return <span className={bookingBadge.className}>{bookingBadge.label}</span>;
  }

  if (isReserved) {
    return (
      <span className="rounded border border-emerald-400/45 px-2 py-0.5 font-brand text-[10px] tracking-widest text-emerald-200 sm:text-xs">
        RESERVED
      </span>
    );
  }

  if (isCancelled) {
    return (
      <span className="rounded border border-red-400/45 px-2 py-0.5 font-brand text-[10px] tracking-widest text-red-200 sm:text-xs">
        CANCELED
      </span>
    );
  }

  return (
    <span className="rounded border border-gold/40 px-2 py-0.5 font-brand text-[10px] tracking-widest text-gold sm:text-xs">
      NEW
    </span>
  );
}
