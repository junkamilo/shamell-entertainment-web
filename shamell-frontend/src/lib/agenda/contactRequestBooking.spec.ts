/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import {
  makeAdminBookingRow,
  makeContactRequest,
  makeServiceByInquiryCode,
} from "./test/fixtures/agendaLib.fixture";
import {
  FIXTURE_BOOKING_TZ,
  FIXTURE_CONTACT_ID,
  FIXTURE_EVENT_TYPE_ID,
  FIXTURE_SERVICE_ID,
  FIXTURE_SERVICE_ID_2,
} from "./test/fixtures/uuids.fixture";
import {
  buildAdminBookingPayloadFromContactRequest,
  buildAgendarPrefillHref,
  buildContactInboxAgendarHref,
  buildLegacyBookingInquiryRows,
  CONTACT_MESSAGE_SEPARATOR,
  contactClientCommentFromRequest,
  eventAddressFromInquiryDetails,
  parseInquiryServiceIds,
  resolveServiceIdForContactRequest,
  structuredDetailsForPeticionRow,
} from "./contactRequestBooking";

describe("structuredDetailsForPeticionRow", () => {
  it("prefers contact inquiryDetails, then bookingDetails, then linked contact", () => {
    const contact = makeContactRequest({
      inquiryDetails: { eventAddress: "A" },
    });
    expect(structuredDetailsForPeticionRow(contact, null)).toEqual({
      eventAddress: "A",
    });

    const booking = makeAdminBookingRow({
      bookingDetails: { eventTimeStart: "10:00" },
    });
    expect(structuredDetailsForPeticionRow(null, booking)).toEqual({
      eventTimeStart: "10:00",
    });

    const linked = makeContactRequest({
      inquiryDetails: { eventAddress: "Linked" },
    });
    expect(structuredDetailsForPeticionRow(null, null, linked)).toEqual({
      eventAddress: "Linked",
    });
    expect(structuredDetailsForPeticionRow(null, null)).toBeNull();
  });
});

describe("eventAddressFromInquiryDetails", () => {
  it("reads a non-empty eventAddress string", () => {
    expect(eventAddressFromInquiryDetails({ eventAddress: " 100 Ave " })).toBe(
      "100 Ave",
    );
    expect(eventAddressFromInquiryDetails({ eventAddress: "  " })).toBeUndefined();
    expect(eventAddressFromInquiryDetails(null)).toBeUndefined();
  });
});

describe("parseInquiryServiceIds", () => {
  it("dedupes valid UUIDs and ignores junk", () => {
    expect(
      parseInquiryServiceIds({
        serviceIds: [FIXTURE_SERVICE_ID, "nope", FIXTURE_SERVICE_ID, FIXTURE_SERVICE_ID_2],
      }),
    ).toEqual([FIXTURE_SERVICE_ID, FIXTURE_SERVICE_ID_2]);
    expect(parseInquiryServiceIds(null)).toEqual([]);
  });
});

describe("buildLegacyBookingInquiryRows", () => {
  it("builds service, type, time, and guest rows", () => {
    const rows = buildLegacyBookingInquiryRows(
      makeAdminBookingRow(),
      FIXTURE_BOOKING_TZ,
    );
    expect(rows.some((r) => r.label === "Service")).toBe(true);
    expect(rows.some((r) => r.label === "Event type")).toBe(true);
    expect(rows.some((r) => r.label === "Requested time")).toBe(true);
    expect(rows.some((r) => r.label === "Guests (approx.)")).toBe(true);
  });
});

describe("contactClientCommentFromRequest", () => {
  it("returns the full message when there is no separator", () => {
    expect(contactClientCommentFromRequest("Hello only", null)).toBe(
      "Hello only",
    );
  });

  it("returns the tail after the separator when structured details exist", () => {
    const details = {
      eventTimeStart: "14:00",
      eventTimeEnd: "16:00",
      guestCount: 10,
    };
    const full = `Summary${CONTACT_MESSAGE_SEPARATOR}Please confirm.`;
    expect(contactClientCommentFromRequest(full, details)).toBe(
      "Please confirm.",
    );
  });
});

describe("resolveServiceIdForContactRequest", () => {
  it("resolves from sourceCatalogKind service id", () => {
    const row = makeContactRequest({
      inquiryDetails: {
        sourceCatalogKind: "service",
        sourceCatalogId: FIXTURE_SERVICE_ID,
      },
    });
    expect(
      resolveServiceIdForContactRequest(row, makeServiceByInquiryCode()),
    ).toBe(FIXTURE_SERVICE_ID);
  });

  it("resolves from serviceType inquiry code map", () => {
    const row = makeContactRequest({
      inquiryDetails: null,
      serviceType: "PRIVATE_GALA",
    });
    expect(
      resolveServiceIdForContactRequest(row, makeServiceByInquiryCode()),
    ).toBe(FIXTURE_SERVICE_ID);
  });

  it("uses fallbackServiceId when nothing else matches", () => {
    const row = makeContactRequest({
      serviceType: null,
      inquiryDetails: null,
    });
    expect(
      resolveServiceIdForContactRequest(
        row,
        new Map(),
        undefined,
        undefined,
        FIXTURE_SERVICE_ID,
      ),
    ).toBe(FIXTURE_SERVICE_ID);
  });
});

describe("buildAdminBookingPayloadFromContactRequest", () => {
  it("builds a valid PENDING booking payload", () => {
    const result = buildAdminBookingPayloadFromContactRequest(
      makeContactRequest(),
      makeServiceByInquiryCode(),
      FIXTURE_BOOKING_TZ,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.payload.serviceId).toBe(FIXTURE_SERVICE_ID);
    expect(result.payload.source).toBe("ADMIN_FROM_CONTACT");
    expect(result.payload.status).toBe("PENDING");
    expect(result.payload.guestEmail).toBe("ada@example.com");
    expect(result.payload.bookingDetails?.eventTimeStart).toBe("14:00");
  });

  it("returns errors for missing required fields", () => {
    const missingPhone = buildAdminBookingPayloadFromContactRequest(
      makeContactRequest({ phone: null }),
      makeServiceByInquiryCode(),
      FIXTURE_BOOKING_TZ,
    );
    expect(missingPhone.ok).toBe(false);
    if (missingPhone.ok) return;
    expect(missingPhone.error).toMatch(/Phone/i);

    const noService = buildAdminBookingPayloadFromContactRequest(
      makeContactRequest({
        serviceType: null,
        inquiryDetails: {
          eventTimeStart: "14:00",
          eventTimeEnd: "16:00",
        },
      }),
      new Map(),
      FIXTURE_BOOKING_TZ,
    );
    expect(noService.ok).toBe(false);
  });

  it("rejects end time before start time", () => {
    const result = buildAdminBookingPayloadFromContactRequest(
      makeContactRequest({
        inquiryDetails: {
          eventTimeStart: "16:00",
          eventTimeEnd: "14:00",
          serviceIds: [FIXTURE_SERVICE_ID],
        },
      }),
      makeServiceByInquiryCode(),
      FIXTURE_BOOKING_TZ,
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/End time/i);
  });
});

describe("buildAgendarPrefillHref / buildContactInboxAgendarHref", () => {
  it("builds schedule prefill query params", () => {
    const href = buildAgendarPrefillHref(
      makeContactRequest(),
      { serviceByInquiryCode: makeServiceByInquiryCode() },
    );
    expect(href.startsWith("/admin/agenda/agendar?")).toBe(true);
    expect(href).toContain("fullName=Ada");
    expect(href).toContain(`serviceId=${FIXTURE_SERVICE_ID}`);
    expect(href).toContain(`eventTypeId=${FIXTURE_EVENT_TYPE_ID}`);
  });

  it("adds contact origin params for inbox deep links", () => {
    const href = buildContactInboxAgendarHref(makeContactRequest(), {
      serviceByInquiryCode: makeServiceByInquiryCode(),
    });
    expect(href).toContain("origin=contact");
    expect(href).toContain(`contactId=${FIXTURE_CONTACT_ID}`);
    expect(href).toContain("returnTo=");
  });
});
