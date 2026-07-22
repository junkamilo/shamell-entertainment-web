"use client";

import { buildInquiryDetailRows } from "@/features/admin/inquiries";
import { useMemo, useState } from "react";
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
import {
  paymentCardBorderClass,
  resolveBookingPaymentCardState,
} from "../lib/peticionesPaymentCardState";
import type { UnifiedPeticionRow } from "../types/peticiones.types";
import PeticionesSendPaymentLinkModal from "./PeticionesSendPaymentLinkModal";
import PeticionesRequestCardActions from "./request-card/PeticionesRequestCardActions";
import PeticionesRequestCardBookingBody from "./request-card/PeticionesRequestCardBookingBody";
import PeticionesRequestCardContactBody from "./request-card/PeticionesRequestCardContactBody";
import PeticionesRequestCardHeader from "./request-card/PeticionesRequestCardHeader";

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
      <PeticionesRequestCardHeader
        expanded={expanded}
        onToggle={onToggle}
        clientDisplayName={clientDisplayName}
        clientDisplayEmail={clientDisplayEmail}
        createdAt={row.createdAt}
        contact={contact}
        booking={booking}
        bookingPaymentVisual={bookingPaymentVisual}
        isReserved={isReserved}
        isCancelled={isCancelled}
      />

      {expanded ? (
        <div className="mt-4 min-w-0 space-y-4 border-t border-gold/10 pt-4 pl-0 md:pl-12">
          <PeticionesRequestCardContactBody
            clientDisplayName={clientDisplayName}
            clientDisplayEmail={clientDisplayEmail}
            contact={contact}
            booking={booking}
            bookingTz={bookingTz}
          />
          <PeticionesRequestCardBookingBody
            inquiryRows={inquiryRows}
            clientComment={clientComment}
            booking={booking}
            contact={contact}
            linkedContact={linkedContact}
          />
          <PeticionesRequestCardActions
            contactRow={contactRow}
            contact={contact}
            booking={booking}
            manualAgendarHref={manualAgendarHref}
            busy={busy}
            reserving={reserving}
            isCancelled={isCancelled}
            onReserveFromContact={onReserveFromContact}
            onCancel={onCancel}
            onCancelBooking={onCancelBooking}
            onRemove={onRemove}
            onRemoveBooking={onRemoveBooking}
            onOpenPaymentLink={() => setPaymentLinkOpen(true)}
            onSendBalanceLink={onSendBalanceLink}
          />
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
