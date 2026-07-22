"use client";

import Link from "next/link";
import { Loader2, Trash2, XCircle } from "lucide-react";
import type { ContactRequest } from "@/hooks/use-admin-contact-requests";
import type { AdminBookingRow } from "@/hooks/use-admin-bookings";
import { cn } from "@/lib/utils";
import { canSendInitialPaymentLink } from "../../lib/peticionesPaymentCardState";
import {
  contactIsBookingInquiry,
  contactIsConciergeInquiry,
} from "../../lib/peticionesContactUtils";
import type { UnifiedPeticionRow } from "../../types/peticiones.types";

type Props = {
  contactRow: Extract<UnifiedPeticionRow, { origin: "CONTACT" }> | null;
  contact: ContactRequest | null;
  booking: AdminBookingRow | null;
  manualAgendarHref: string;
  busy: boolean;
  reserving: boolean;
  isCancelled: boolean;
  onReserveFromContact: (row: ContactRequest) => void;
  onCancel: () => void;
  onCancelBooking: (row: AdminBookingRow) => void;
  onRemove: () => void;
  onRemoveBooking: (row: AdminBookingRow) => void;
  onOpenPaymentLink: () => void;
  onSendBalanceLink: (row: AdminBookingRow) => void;
};

export default function PeticionesRequestCardActions({
  contactRow,
  contact,
  booking,
  manualAgendarHref,
  busy,
  reserving,
  isCancelled,
  onReserveFromContact,
  onCancel,
  onCancelBooking,
  onRemove,
  onRemoveBooking,
  onOpenPaymentLink,
  onSendBalanceLink,
}: Props) {
  const sendPaymentLinkAllowed = booking != null && canSendInitialPaymentLink(booking);

  return (
    <>
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-stretch">
        {contactRow ? (
          <button
            type="button"
            disabled={
              busy ||
              reserving ||
              contactRow.state !== "PENDING" ||
              Boolean(contactRow.hasLinkedBooking)
            }
            onClick={(e) => {
              e.stopPropagation();
              onReserveFromContact(contactRow.contact);
            }}
            className={cn(
              "inline-flex w-full items-center justify-center gap-2 rounded-md border px-3 py-3 font-brand text-xs tracking-widest transition disabled:opacity-50 sm:w-auto sm:py-2.5 sm:text-sm",
              contactRow.state === "RESERVED"
                ? "border-emerald-400/45 text-emerald-200"
                : "border-gold/35 text-gold hover:bg-gold/10",
            )}
          >
            {reserving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
            ) : null}
            {contactRow.state === "RESERVED" ? "Reserved" : "Reserve"}
          </button>
        ) : null}
        <Link
          href={manualAgendarHref}
          className="inline-flex w-full items-center justify-center rounded-md border border-gold/20 px-3 py-3 text-center font-brand text-xs tracking-widest text-foreground/70 transition hover:border-gold/35 hover:text-gold sm:w-auto sm:py-2.5 sm:text-sm"
        >
          Edit
        </Link>
        <button
          type="button"
          disabled={busy || reserving}
          onClick={(e) => {
            e.stopPropagation();
            if (contact) onCancel();
            else if (booking) onCancelBooking(booking);
          }}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-red-300/35 px-3 py-3 font-brand text-xs tracking-widest text-red-200/90 transition hover:bg-red-500/10 disabled:opacity-50 sm:w-auto sm:py-2.5 sm:text-sm"
        >
          <XCircle className="h-4 w-4" strokeWidth={1.5} />
          Cancel
        </button>
        {booking ? (
          <button
            type="button"
            disabled={busy || reserving || !sendPaymentLinkAllowed}
            title={
              sendPaymentLinkAllowed
                ? undefined
                : "This booking is already paid or canceled."
            }
            onClick={(e) => {
              e.stopPropagation();
              onOpenPaymentLink();
            }}
            className="inline-flex w-full items-center justify-center rounded-md border border-sky-300/40 px-3 py-3 font-brand text-xs tracking-widest text-sky-200 transition hover:bg-sky-500/10 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:py-2.5 sm:text-sm"
          >
            Send payment link
          </button>
        ) : null}
        {booking?.depositPaidAt && !booking?.balancePaidAt ? (
          <button
            type="button"
            disabled={busy || reserving}
            onClick={(e) => {
              e.stopPropagation();
              onSendBalanceLink(booking);
            }}
            className="inline-flex w-full items-center justify-center rounded-md border border-indigo-300/40 px-3 py-3 font-brand text-xs tracking-widest text-indigo-200 transition hover:bg-indigo-500/10 disabled:opacity-50 sm:w-auto sm:py-2.5 sm:text-sm"
          >
            Send balance link
          </button>
        ) : null}
        <button
          type="button"
          disabled={busy || reserving || !isCancelled}
          onClick={(e) => {
            e.stopPropagation();
            if (contact) onRemove();
            else if (booking) onRemoveBooking(booking);
          }}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-red-400/35 px-3 py-3 font-brand text-xs tracking-widest text-red-200/90 transition hover:bg-red-500/10 disabled:opacity-50 sm:w-auto sm:py-2.5 sm:text-sm"
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
          Delete
        </button>
      </div>
      {!(contact && contactIsConciergeInquiry(contact)) &&
        (contact && contactIsBookingInquiry(contact) ? (
          <p className="wrap-break-word font-body text-xs leading-relaxed text-foreground/50 sm:text-sm">
            Booking inquiry from the public form: use Reserve only if a calendar booking was not
            created automatically (missing phone or catalog match).
          </p>
        ) : !booking ? (
          <p className="wrap-break-word font-body text-xs leading-relaxed text-foreground/50 sm:text-sm">
            Bookings from the public form or Book appear here as reserved (green).
          </p>
        ) : null)}
    </>
  );
}
