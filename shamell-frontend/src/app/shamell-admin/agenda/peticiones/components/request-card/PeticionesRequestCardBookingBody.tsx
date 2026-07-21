"use client";

import {
  InquiryDetailsReadable,
  type InquiryDetailRow,
} from "@/components/admin/InquiryDetailsReadable";
import type { ContactRequest } from "@/hooks/use-admin-contact-requests";
import type { AdminBookingRow } from "@/hooks/use-admin-bookings";
import { contactIsConciergeInquiry } from "../../lib/peticionesContactUtils";

type Props = {
  inquiryRows: InquiryDetailRow[];
  clientComment: string;
  booking: AdminBookingRow | null;
  contact: ContactRequest | null;
  linkedContact: ContactRequest | null;
};

export default function PeticionesRequestCardBookingBody({
  inquiryRows,
  clientComment,
  booking,
  contact,
  linkedContact,
}: Props) {
  const conciergeWithRows =
    (contact ?? linkedContact) &&
    contactIsConciergeInquiry((contact ?? linkedContact)!) &&
    inquiryRows.length > 0;

  return (
    <>
      {inquiryRows.length > 0 ? (
        <InquiryDetailsReadable
          rows={inquiryRows}
          sectionTitle={booking ? "BOOKING DETAILS" : "FORM DETAILS"}
        />
      ) : null}
      {!conciergeWithRows ? (
        <div className="min-w-0">
          <p className="mb-2 font-brand text-xs tracking-widest text-gold/65 sm:text-sm">
            {inquiryRows.length > 0 ? "CLIENT COMMENT" : "MESSAGE / NOTES"}
          </p>
          <p className="shamell-glass-surface shamell-scrollbar max-h-56 min-w-0 overflow-y-auto whitespace-pre-wrap wrap-break-word rounded-lg p-4 font-body text-base leading-relaxed text-foreground/85 sm:max-h-64 sm:p-5 sm:text-lg sm:leading-relaxed">
            {clientComment}
          </p>
        </div>
      ) : null}
    </>
  );
}
