import { describe, expect, it } from "vitest";
import type { ContactRequest } from "@/hooks/use-admin-contact-requests";
import {
  contactIsBookingInquiry,
  contactIsConciergeInquiry,
} from "./peticionesContactUtils";

function contact(overrides: Partial<ContactRequest> = {}): ContactRequest {
  return { id: "c1", ...overrides } as ContactRequest;
}

describe("contactIsBookingInquiry", () => {
  it("matches subject or serviceType", () => {
    expect(
      contactIsBookingInquiry(contact({ subject: "New Booking Inquiry" })),
    ).toBe(true);
    expect(
      contactIsBookingInquiry(contact({ serviceType: "booking inquiry — show" })),
    ).toBe(true);
  });

  it("returns false otherwise", () => {
    expect(contactIsBookingInquiry(contact({ subject: "Hello" }))).toBe(false);
  });
});

describe("contactIsConciergeInquiry", () => {
  it("matches subject", () => {
    expect(
      contactIsConciergeInquiry(contact({ subject: "Concierge Inquiry" })),
    ).toBe(true);
  });

  it("matches entrySource on inquiryDetails", () => {
    expect(
      contactIsConciergeInquiry(
        contact({ inquiryDetails: { entrySource: "concierge_gate" } }),
      ),
    ).toBe(true);
  });

  it("ignores non-object inquiryDetails", () => {
    expect(
      contactIsConciergeInquiry(contact({ inquiryDetails: "concierge_gate" })),
    ).toBe(false);
  });
});
