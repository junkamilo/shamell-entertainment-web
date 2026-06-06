"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  Mail,
  Trash2,
  XCircle,
} from "lucide-react";
import {
  InquiryDetailsReadable,
  buildInquiryDetailRows,
} from "@/components/admin/InquiryDetailsReadable";
import { formatContactSubjectForAdmin } from "@/lib/adminContactDisplay";
import {
  buildContactInboxAgendarHref,
  contactClientCommentFromRequest,
  structuredDetailsForPeticionRow,
} from "@/lib/contactRequestBooking";
import type { ContactRequest } from "@/hooks/use-admin-contact-requests";
import type { AdminBookingRow } from "@/hooks/use-admin-bookings";
import { cn } from "@/lib/utils";
import { buildAdminBookingDetailRows } from "../lib/buildAdminBookingDetailRows";
import { buildBookingEditHref } from "../lib/peticionesBookingHref";
import { AGENDAR_PATH } from "../lib/peticionesRoutes";
import { formatRequestDate } from "../lib/peticionesConstants";
import {
  formatBookingCalendarDate,
  formatEventCalendarDate,
} from "../lib/peticionesDateUtils";
import {
  contactIsBookingInquiry,
  contactIsConciergeInquiry,
} from "../lib/peticionesContactUtils";
import type { UnifiedPeticionRow } from "../types/peticiones.types";
import {
  canSendInitialPaymentLink,
  paymentCardBadge,
  paymentCardBorderClass,
  resolveBookingPaymentCardState,
} from "../lib/peticionesPaymentCardState";
import PeticionesSendPaymentLinkModal from "./PeticionesSendPaymentLinkModal";

type Props = {
  row: UnifiedPeticionRow;
  expanded: boolean;
  onToggle: () => void;
  onCancel: () => void;
  onRemove: () => void;
  onReserveFromContact: (row: ContactRequest) => void;
  onCancelBooking: (row: AdminBookingRow) => void;
  onRemoveBooking: (row: AdminBookingRow) => void;
  onSendBookingQuote: (
    row: AdminBookingRow,
    payload: {
      paymentModel: "FULL" | "DEPOSIT";
      totalAmount: number;
      depositAmount?: number;
    },
  ) => void;
  onSendBalanceLink: (row: AdminBookingRow) => void;
  busyId: string | null;
  reservingContactId: string | null;
  serviceByInquiryCode: Map<string, string>;
  eventTypeContactCodeById: Map<string, string>;
  inquiryCodeByCatalogLineId: Map<string, string>;
  fallbackServiceId?: string;
  bookingTz: string;
};

export default function PeticionesRequestCard({
  row,
  expanded,
  onToggle,
  onCancel,
  onRemove,
  onReserveFromContact,
  onCancelBooking,
  onRemoveBooking,
  onSendBookingQuote,
  onSendBalanceLink,
  busyId,
  reservingContactId,
  serviceByInquiryCode,
  eventTypeContactCodeById,
  inquiryCodeByCatalogLineId,
  fallbackServiceId,
  bookingTz,
}: Props) {
  const [paymentLinkOpen, setPaymentLinkOpen] = useState(false);
  const busy = busyId === row.id;
  const reserving = row.origin === "CONTACT" && reservingContactId === row.id;
  const contact = row.origin === "CONTACT" ? row.contact : null;
  const contactRow = row.origin === "CONTACT" ? row : null;
  const booking = row.origin === "BOOKING_ADMIN" ? row.booking : null;
  const linkedContact =
    row.origin === "BOOKING_ADMIN" ? (row.linkedContact ?? null) : null;

  const structuredDetails = useMemo(
    () => structuredDetailsForPeticionRow(contact, booking, linkedContact),
    [contact, booking, linkedContact],
  );

  const inquiryRows = useMemo(() => {
    if (booking) {
      return buildAdminBookingDetailRows(booking, structuredDetails, bookingTz);
    }
    const fromJson = buildInquiryDetailRows(structuredDetails);
    if (fromJson.length > 0) return fromJson;
    return [];
  }, [structuredDetails, booking, bookingTz]);

  const clientComment = useMemo(() => {
    if (contact) {
      return contactClientCommentFromRequest(
        contact.message,
        contact.inquiryDetails,
      );
    }
    if (linkedContact) {
      return contactClientCommentFromRequest(
        linkedContact.message,
        linkedContact.inquiryDetails,
      );
    }
    return booking?.notes?.trim() || "No notes.";
  }, [booking?.notes, contact, linkedContact]);

  const manualAgendarHref = useMemo(() => {
    if (contact) {
      return buildContactInboxAgendarHref(contact, {
        serviceByInquiryCode,
        eventTypeContactCodeById,
        inquiryCodeByCatalogLineId,
        fallbackServiceId,
      });
    }
    return booking ? buildBookingEditHref(booking, bookingTz) : AGENDAR_PATH;
  }, [
    booking,
    bookingTz,
    contact,
    eventTypeContactCodeById,
    fallbackServiceId,
    inquiryCodeByCatalogLineId,
    serviceByInquiryCode,
  ]);

  const isReserved =
    row.origin === "CONTACT"
      ? row.state === "RESERVED"
      : row.status === "CONFIRMED";
  const isCancelled =
    row.origin === "CONTACT"
      ? row.state === "CANCELLED"
      : row.status === "CANCELLED";

  const bookingPaymentVisual =
    row.origin === "BOOKING_ADMIN" && booking
      ? resolveBookingPaymentCardState(booking)
      : null;
  const bookingBadge =
    bookingPaymentVisual != null
      ? paymentCardBadge(bookingPaymentVisual)
      : null;
  const sendPaymentLinkAllowed =
    booking != null && canSendInitialPaymentLink(booking);

  const cardBorderClass =
    bookingPaymentVisual != null
      ? paymentCardBorderClass(bookingPaymentVisual)
      : isReserved
        ? "border-emerald-400/30 ring-1 ring-emerald-400/15"
        : isCancelled
          ? "border-red-400/25 ring-1 ring-red-400/10 opacity-85"
          : "border-gold/40 ring-1 ring-gold/15";

  const clientDisplayName =
    contact?.fullName ||
    booking?.guestFullName ||
    booking?.user?.fullName ||
    "Client";
  const clientDisplayEmail =
    contact?.email || booking?.guestEmail || booking?.user?.email || "";

  return (
    <article
      className={cn(
        "shamell-glass-surface min-w-0 rounded-xl px-4 py-3 transition-colors",
        cardBorderClass,
      )}
    >
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
            {bookingBadge ? (
              <span className={bookingBadge.className}>{bookingBadge.label}</span>
            ) : isReserved ? (
              <span className="rounded border border-emerald-400/45 px-2 py-0.5 font-brand text-[10px] tracking-widest text-emerald-200 sm:text-xs">
                RESERVED
              </span>
            ) : isCancelled ? (
              <span className="rounded border border-red-400/45 px-2 py-0.5 font-brand text-[10px] tracking-widest text-red-200 sm:text-xs">
                CANCELED
              </span>
            ) : (
              <span className="rounded border border-gold/40 px-2 py-0.5 font-brand text-[10px] tracking-widest text-gold sm:text-xs">
                NEW
              </span>
            )}
          </div>
          <p className="truncate text-sm text-foreground/60 sm:text-base">
            {clientDisplayEmail}
          </p>
          {!booking && !contact ? null : (
            <p className="mt-1 line-clamp-2 font-body text-sm text-foreground/70 sm:text-base">
              {contact
                ? formatContactSubjectForAdmin(contact.subject)
                : booking?.event?.name || "Admin booking"}
            </p>
          )}
          <p className="mt-1 font-brand text-xs tracking-widest text-foreground/45 sm:text-sm">
            {formatRequestDate(row.createdAt)}
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

      {expanded ? (
        <div className="mt-4 min-w-0 space-y-4 border-t border-gold/10 pt-4 pl-0 md:pl-12">
          <dl className="grid min-w-0 grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2 sm:gap-y-3 sm:text-base">
            <dt className="font-brand text-xs tracking-widest text-gold/65 sm:text-sm">
              NAME
            </dt>
            <dd className="min-w-0 wrap-break-word font-body text-foreground/85">
              {clientDisplayName}
            </dd>
            {clientDisplayEmail ? (
              <>
                <dt className="font-brand text-xs tracking-widest text-gold/65 sm:text-sm">
                  EMAIL
                </dt>
                <dd className="min-w-0 wrap-break-word font-body text-foreground/85">
                  {clientDisplayEmail}
                </dd>
              </>
            ) : null}
            {contact?.phone || booking?.guestPhone ? (
              <>
                <dt className="font-brand text-xs tracking-widest text-gold/65 sm:text-sm">
                  PHONE
                </dt>
                <dd className="min-w-0 wrap-break-word font-body text-foreground/85">
                  {contact?.phone || booking?.guestPhone}
                </dd>
              </>
            ) : null}
            {contact?.eventDate || booking?.eventDate ? (
              <>
                <dt className="font-brand text-xs tracking-widest text-gold/65 sm:text-sm">
                  EVENT DATE
                </dt>
                <dd className="min-w-0 wrap-break-word font-body text-foreground/85">
                  {contact
                    ? formatEventCalendarDate(contact.eventDate || "")
                    : formatBookingCalendarDate(
                        booking?.eventDate || "",
                        bookingTz,
                      )}
                </dd>
              </>
            ) : null}
            {contact?.location || booking?.location ? (
              <>
                <dt className="font-brand text-xs tracking-widest text-gold/65 sm:text-sm">
                  CITY / VENUE
                </dt>
                <dd className="min-w-0 wrap-break-word font-body text-foreground/85">
                  {contact?.location || booking?.location}
                </dd>
              </>
            ) : null}
          </dl>
          {inquiryRows.length > 0 ? (
            <InquiryDetailsReadable
              rows={inquiryRows}
              sectionTitle={booking ? "BOOKING DETAILS" : "FORM DETAILS"}
            />
          ) : null}
          {!(
            (contact ?? linkedContact) &&
            contactIsConciergeInquiry((contact ?? linkedContact)!) &&
            inquiryRows.length > 0
          ) ? (
            <div className="min-w-0">
              <p className="mb-2 font-brand text-xs tracking-widest text-gold/65 sm:text-sm">
                {inquiryRows.length > 0 ? "CLIENT COMMENT" : "MESSAGE / NOTES"}
              </p>
              <p className="shamell-glass-surface shamell-scrollbar max-h-56 min-w-0 overflow-y-auto whitespace-pre-wrap wrap-break-word rounded-lg p-4 font-body text-base leading-relaxed text-foreground/85 sm:max-h-64 sm:p-5 sm:text-lg sm:leading-relaxed">
                {clientComment}
              </p>
            </div>
          ) : null}
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-stretch">
            {contactRow ? (
              <button
                type="button"
                disabled={
                  busy ||
                  reserving ||
                  contactRow.state !== "PENDING" ||
                  Boolean(row.origin === "CONTACT" && row.hasLinkedBooking)
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
                  <Loader2
                    className="h-3.5 w-3.5 animate-spin"
                    strokeWidth={2}
                  />
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
                  setPaymentLinkOpen(true);
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
          {!(contact && contactIsConciergeInquiry(contact)) ? (
            <p className="wrap-break-word font-body text-xs leading-relaxed text-foreground/50 sm:text-sm">
              {contact && contactIsBookingInquiry(contact)
                ? "Booking inquiry from the public form: use Reserve only if a calendar booking was not created automatically (missing phone or catalog match)."
                : booking
                  ? "Green = fully paid, orange = deposit paid, cyan = payment link sent, gold = awaiting payment, red = canceled."
                  : "Bookings from the public form or Book appear here as reserved (green)."}
            </p>
          ) : null}
        </div>
      ) : null}

      {booking ? (
        <PeticionesSendPaymentLinkModal
          booking={booking}
          isOpen={paymentLinkOpen}
          onClose={() => setPaymentLinkOpen(false)}
          isSubmitting={busy}
          onSubmit={(payload) => {
            onSendBookingQuote(booking, payload);
            setPaymentLinkOpen(false);
          }}
        />
      ) : null}
    </article>
  );
}
