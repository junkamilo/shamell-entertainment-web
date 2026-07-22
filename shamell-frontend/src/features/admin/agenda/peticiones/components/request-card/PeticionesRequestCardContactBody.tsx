"use client";

import type { ContactRequest } from "@/hooks/use-admin-contact-requests";
import type { AdminBookingRow } from "@/hooks/use-admin-bookings";
import {
  formatBookingCalendarDate,
  formatEventCalendarDate,
} from "../../lib/peticionesDateUtils";

type Props = {
  clientDisplayName: string;
  clientDisplayEmail: string;
  contact: ContactRequest | null;
  booking: AdminBookingRow | null;
  bookingTz: string;
};

export default function PeticionesRequestCardContactBody({
  clientDisplayName,
  clientDisplayEmail,
  contact,
  booking,
  bookingTz,
}: Props) {
  return (
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
              : formatBookingCalendarDate(booking?.eventDate || "", bookingTz)}
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
  );
}
