"use client";

import { ChevronDown, ChevronUp, Mail } from "lucide-react";
import { formatContactSubjectForAdmin } from "@/lib/adminContactDisplay";
import type { ContactRequest } from "@/hooks/use-admin-contact-requests";
import type { AdminBookingRow } from "@/hooks/use-admin-bookings";
import { formatRequestDate } from "../../lib/peticionesConstants";
import { privateClassTypeFromDetails } from "../../lib/privateClassBookingDetails";
import PeticionesRequestCardPaymentBadge from "./PeticionesRequestCardPaymentBadge";
import type { PaymentCardVisual } from "../../lib/peticionesPaymentCardState";

type Props = {
  expanded: boolean;
  onToggle: () => void;
  clientDisplayName: string;
  clientDisplayEmail: string;
  createdAt: string;
  contact: ContactRequest | null;
  booking: AdminBookingRow | null;
  bookingPaymentVisual: PaymentCardVisual | null;
  isReserved: boolean;
  isCancelled: boolean;
};

export default function PeticionesRequestCardHeader({
  expanded,
  onToggle,
  clientDisplayName,
  clientDisplayEmail,
  createdAt,
  contact,
  booking,
  bookingPaymentVisual,
  isReserved,
  isCancelled,
}: Props) {
  const privateClassType = privateClassTypeFromDetails(booking?.bookingDetails);

  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-start gap-3 text-left"
    >
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gold/25 bg-gold/10">
        <Mail className="h-4 w-4 text-gold" strokeWidth={1.5} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="font-brand text-base tracking-wide text-gold sm:text-lg">
            {clientDisplayName}
          </span>
          <PeticionesRequestCardPaymentBadge
            bookingPaymentVisual={bookingPaymentVisual}
            isReserved={isReserved}
            isCancelled={isCancelled}
          />
        </div>
        <p className="truncate text-sm text-foreground/60 sm:text-base">
          {clientDisplayEmail}
        </p>
        {!booking && !contact ? null : (
          <p className="mt-1 line-clamp-2 font-body text-sm text-foreground/70 sm:text-base">
            {contact
              ? formatContactSubjectForAdmin(contact.subject)
              : privateClassType
                ? `Private class — ${privateClassType}`
                : booking?.event?.name || "Admin booking"}
          </p>
        )}
        <p className="mt-1 font-brand text-xs tracking-widest text-foreground/45 sm:text-sm">
          {formatRequestDate(createdAt)}
        </p>
      </div>
      {expanded ? (
        <ChevronUp
          className="mt-1 h-4 w-4 shrink-0 text-gold/70"
          strokeWidth={1.5}
        />
      ) : (
        <ChevronDown
          className="mt-1 h-4 w-4 shrink-0 text-gold/70"
          strokeWidth={1.5}
        />
      )}
    </button>
  );
}
