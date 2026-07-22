import type { ContactRequest } from "@/hooks/use-admin-contact-requests";

export function contactIsBookingInquiry(row: ContactRequest): boolean {
  const subject = row.subject?.toLowerCase() ?? "";
  const serviceType = row.serviceType?.toLowerCase() ?? "";
  return subject.includes("booking inquiry") || serviceType.includes("booking inquiry");
}

export function contactIsConciergeInquiry(row: ContactRequest): boolean {
  const subject = row.subject?.toLowerCase() ?? "";
  const details =
    row.inquiryDetails && typeof row.inquiryDetails === "object" && !Array.isArray(row.inquiryDetails)
      ? (row.inquiryDetails as Record<string, unknown>)
      : null;
  return subject.includes("concierge inquiry") || details?.entrySource === "concierge_gate";
}
