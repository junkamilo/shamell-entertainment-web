/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from "vitest";

const utcThrow = vi.hoisted(() => ({ current: false }));

vi.mock("@/lib/contacto/bookingAvailability", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/contacto/bookingAvailability")>();
  return {
    ...actual,
    utcInstantForWallClock: (...args: Parameters<typeof actual.utcInstantForWallClock>) => {
      if (utcThrow.current) throw new Error("bad tz");
      return actual.utcInstantForWallClock(...args);
    },
  };
});
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

beforeEach(() => {
  utcThrow.current = false;
});

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
    expect(
      structuredDetailsForPeticionRow(null, makeAdminBookingRow({ bookingDetails: [] })),
    ).toBeNull();
    expect(
      structuredDetailsForPeticionRow(null, makeAdminBookingRow({ bookingDetails: {} })),
    ).toBeNull();
  });
});

describe("eventAddressFromInquiryDetails", () => {
  it("reads a non-empty eventAddress string", () => {
    expect(eventAddressFromInquiryDetails({ eventAddress: " 100 Ave " })).toBe(
      "100 Ave",
    );
    expect(eventAddressFromInquiryDetails({ eventAddress: "  " })).toBeUndefined();
    expect(eventAddressFromInquiryDetails(null)).toBeUndefined();
    expect(eventAddressFromInquiryDetails(["x"])).toBeUndefined();
    expect(eventAddressFromInquiryDetails({ eventAddress: 12 })).toBeUndefined();
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
    expect(parseInquiryServiceIds(["x"])).toEqual([]);
    expect(parseInquiryServiceIds({ serviceIds: "nope" })).toEqual([]);
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

  it("formats partial times, wall-clock fallback, and skips empty optional rows", () => {
    expect(
      buildLegacyBookingInquiryRows(
        makeAdminBookingRow({
          service: undefined,
          eventType: undefined,
          occasionType: undefined,
          event: undefined,
          guestCount: 0,
          bookingDetails: { eventTimeStart: "10:00", eventTimeEnd: "nope" },
        }),
        FIXTURE_BOOKING_TZ,
      ).find((r) => r.label === "Requested time")?.value,
    ).toBe("10:00 – —");

    expect(
      buildLegacyBookingInquiryRows(
        makeAdminBookingRow({
          bookingDetails: { eventTimeStart: 1, eventTimeEnd: "16:00" },
        }),
        FIXTURE_BOOKING_TZ,
      ).find((r) => r.label === "Requested time")?.value,
    ).toBe("— – 16:00");

    const fromEventDate = buildLegacyBookingInquiryRows(
      makeAdminBookingRow({ bookingDetails: null, guestCount: null }),
      FIXTURE_BOOKING_TZ,
    );
    expect(fromEventDate.find((r) => r.label === "Requested time")?.value).toMatch(/^\d{2}:\d{2}$/);
    expect(fromEventDate.find((r) => r.label === "Guests (approx.)")).toBeUndefined();

    expect(
      buildLegacyBookingInquiryRows(
        makeAdminBookingRow({ bookingDetails: [], eventDate: null, guestCount: null }),
        FIXTURE_BOOKING_TZ,
      ).find((r) => r.label === "Requested time"),
    ).toBeUndefined();
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

  it("keeps the full message without structured details and uses a fallback empty tail", () => {
    const full = `Summary${CONTACT_MESSAGE_SEPARATOR}   `;
    expect(contactClientCommentFromRequest(full, null)).toBe(full.trim());
    expect(
      contactClientCommentFromRequest(full, {
        eventTimeStart: "14:00",
        eventTimeEnd: "16:00",
        guestCount: 10,
      }),
    ).toBe("No additional comment.");
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

  it("resolves from event-type and catalog-line maps", () => {
    const maps = makeServiceByInquiryCode();
    expect(
      resolveServiceIdForContactRequest(
        makeContactRequest({
          serviceType: null,
          inquiryDetails: { eventTypeId: FIXTURE_EVENT_TYPE_ID },
        }),
        maps,
        new Map([[FIXTURE_EVENT_TYPE_ID, "PRIVATE_GALA"]]),
      ),
    ).toBe(FIXTURE_SERVICE_ID);

    expect(
      resolveServiceIdForContactRequest(
        makeContactRequest({
          serviceType: null,
          inquiryDetails: { eventId: FIXTURE_EVENT_TYPE_ID },
        }),
        maps,
        undefined,
        new Map([[FIXTURE_EVENT_TYPE_ID, "PRIVATE_GALA"]]),
      ),
    ).toBe(FIXTURE_SERVICE_ID);

    expect(
      resolveServiceIdForContactRequest(
        makeContactRequest({
          serviceType: null,
          inquiryDetails: { eventTypeId: FIXTURE_EVENT_TYPE_ID },
        }),
        maps,
        undefined,
        new Map([[FIXTURE_EVENT_TYPE_ID, "PRIVATE_GALA"]]),
      ),
    ).toBe(FIXTURE_SERVICE_ID);

    expect(
      resolveServiceIdForContactRequest(
        makeContactRequest({
          serviceType: null,
          inquiryDetails: { eventTypeId: FIXTURE_EVENT_TYPE_ID },
        }),
        maps,
        undefined,
        new Map([[FIXTURE_EVENT_TYPE_ID, "  "]]),
      ),
    ).toBeNull();

    expect(
      resolveServiceIdForContactRequest(
        makeContactRequest({
          serviceType: null,
          inquiryDetails: { eventTypeId: FIXTURE_EVENT_TYPE_ID },
        }),
        maps,
        new Map([[FIXTURE_EVENT_TYPE_ID, "UNKNOWN_CODE"]]),
      ),
    ).toBeNull();

    expect(
      resolveServiceIdForContactRequest(
        makeContactRequest({
          serviceType: null,
          inquiryDetails: { eventId: FIXTURE_EVENT_TYPE_ID },
        }),
        maps,
        undefined,
        new Map([[FIXTURE_EVENT_TYPE_ID, "UNKNOWN_CODE"]]),
      ),
    ).toBeNull();

    expect(
      resolveServiceIdForContactRequest(
        makeContactRequest({
          serviceType: null,
          inquiryDetails: { eventTypeId: "not-a-uuid" },
        }),
        maps,
        new Map([[FIXTURE_EVENT_TYPE_ID, "PRIVATE_GALA"]]),
      ),
    ).toBeNull();
  });

  it("returns null when catalog ids and fallback are invalid", () => {
    expect(
      resolveServiceIdForContactRequest(
        makeContactRequest({
          serviceType: " ",
          inquiryDetails: { sourceCatalogKind: "service", sourceCatalogId: "nope" },
        }),
        new Map(),
        new Map(),
        new Map(),
        "not-a-uuid",
      ),
    ).toBeNull();
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

    const missingDate = buildAdminBookingPayloadFromContactRequest(
      makeContactRequest({ eventDate: null }),
      makeServiceByInquiryCode(),
      FIXTURE_BOOKING_TZ,
    );
    expect(missingDate.ok).toBe(false);
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

  it("rejects missing identity, location, date, times, invalid clock values, and timezone errors", () => {
    const maps = makeServiceByInquiryCode();
    expect(
      buildAdminBookingPayloadFromContactRequest(
        makeContactRequest({ fullName: " " }),
        maps,
        FIXTURE_BOOKING_TZ,
      ).ok,
    ).toBe(false);
    expect(
      buildAdminBookingPayloadFromContactRequest(
        makeContactRequest({ email: "" }),
        maps,
        FIXTURE_BOOKING_TZ,
      ).ok,
    ).toBe(false);
    expect(
      buildAdminBookingPayloadFromContactRequest(
        makeContactRequest({ location: null }),
        maps,
        FIXTURE_BOOKING_TZ,
      ).ok,
    ).toBe(false);
    expect(
      buildAdminBookingPayloadFromContactRequest(
        makeContactRequest({ eventDate: "not-a-date" }),
        maps,
        FIXTURE_BOOKING_TZ,
      ).ok,
    ).toBe(false);
    expect(
      buildAdminBookingPayloadFromContactRequest(
        makeContactRequest({
          inquiryDetails: { eventTimeStart: "14:00", eventTimeEnd: "", serviceIds: [FIXTURE_SERVICE_ID] },
        }),
        maps,
        FIXTURE_BOOKING_TZ,
      ).ok,
    ).toBe(false);
    expect(
      buildAdminBookingPayloadFromContactRequest(
        makeContactRequest({
          inquiryDetails: {
            eventTimeStart: 14,
            eventTimeEnd: 16,
            serviceIds: [FIXTURE_SERVICE_ID],
          },
        }),
        maps,
        FIXTURE_BOOKING_TZ,
      ).ok,
    ).toBe(false);
    expect(
      buildAdminBookingPayloadFromContactRequest(
        makeContactRequest({
          inquiryDetails: {
            eventTimeStart: "25:00",
            eventTimeEnd: "26:00",
            serviceIds: [FIXTURE_SERVICE_ID],
          },
        }),
        maps,
        FIXTURE_BOOKING_TZ,
      ).ok,
    ).toBe(false);

    utcThrow.current = true;
    expect(
      buildAdminBookingPayloadFromContactRequest(
        makeContactRequest(),
        maps,
        FIXTURE_BOOKING_TZ,
      ).ok,
    ).toBe(false);
    utcThrow.current = false;
  });

  it("parses RFC dates, drops stale serviceIds, and trims long notes", () => {
    const longMsg = `Summary${CONTACT_MESSAGE_SEPARATOR}${"x".repeat(4010)}`;
    const result = buildAdminBookingPayloadFromContactRequest(
      makeContactRequest({
        eventDate: "Sat, 15 Aug 2026 12:00:00 GMT",
        message: longMsg,
        inquiryDetails: {
          eventTimeStart: "14:00",
          eventTimeEnd: "16:00",
          eventTypeId: "nope",
          occasionTypeId: FIXTURE_SERVICE_ID_2,
          eventId: FIXTURE_EVENT_TYPE_ID,
          guestCount: 12.5,
          serviceIds: ["not-uuid"],
        },
      }),
      makeServiceByInquiryCode(),
      FIXTURE_BOOKING_TZ,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.payload.notes?.length).toBe(4000);
    expect(result.payload.guestCount).toBeUndefined();
    expect(result.payload.eventTypeId).toBeUndefined();
    expect(result.payload.bookingDetails?.serviceIds).toBeUndefined();
    expect(result.payload.occasionTypeId).toBe(FIXTURE_SERVICE_ID_2);
  });

  it("treats empty comments as omitted notes and array inquiryDetails as empty extras", () => {
    const inquiryDetails = Object.assign(["legacy"], {
      eventTimeStart: "14:00",
      eventTimeEnd: "16:00",
      serviceIds: [FIXTURE_SERVICE_ID],
    });
    const result = buildAdminBookingPayloadFromContactRequest(
      makeContactRequest({
        message: "   ",
        inquiryDetails,
      }),
      makeServiceByInquiryCode(),
      FIXTURE_BOOKING_TZ,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.payload.notes).toBeUndefined();
    expect(result.payload.guestCount).toBeUndefined();
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

  it("resolves serviceId from catalog when inquiry serviceIds are empty", () => {
    const href = buildAgendarPrefillHref(
      makeContactRequest({
        inquiryDetails: {
          eventTimeStart: "14:00",
          eventTimeEnd: "16:00",
          eventTypeId: FIXTURE_EVENT_TYPE_ID,
          occasionTypeId: FIXTURE_SERVICE_ID_2,
          guestCount: 8,
        },
      }),
      { serviceByInquiryCode: makeServiceByInquiryCode() },
    );
    expect(href).toContain(`serviceId=${FIXTURE_SERVICE_ID}`);
    expect(href).toContain("guestCount=8");
    expect(href).toContain(`occasionTypeId=${FIXTURE_SERVICE_ID_2}`);
    expect(href).not.toContain("serviceIds=");
  });

  it("skips catalog serviceId when nothing resolves and ignores invalid guest counts", () => {
    const href = buildAgendarPrefillHref(
      makeContactRequest({
        serviceType: "UNKNOWN",
        inquiryDetails: {
          eventTimeStart: "14:00",
          eventTimeEnd: "16:00",
          eventTypeId: "nope",
          occasionTypeId: "nope",
          guestCount: 0,
        },
      }),
      { serviceByInquiryCode: makeServiceByInquiryCode() },
    );
    expect(href).not.toContain("serviceId=");
    expect(href).not.toContain("guestCount=");
    expect(
      buildAgendarPrefillHref(
        makeContactRequest({
          inquiryDetails: { eventTimeStart: "14:00", eventTimeEnd: "16:00", guestCount: 1.5 },
        }),
      ),
    ).not.toContain("guestCount=");
    expect(
      buildAgendarPrefillHref(
        makeContactRequest({
          inquiryDetails: { eventTimeStart: "14:00", eventTimeEnd: "16:00" },
        }),
      ),
    ).not.toContain("guestCount=");
    expect(
      buildAgendarPrefillHref(
        makeContactRequest({
          inquiryDetails: { eventTimeStart: "14:00", eventTimeEnd: "16:00", guestCount: null },
        }),
      ),
    ).not.toContain("guestCount=");
  });

  it("omits empty prefill fields and uses a custom returnTo", () => {
    const href = buildAgendarPrefillHref(
      makeContactRequest({
        fullName: "",
        email: "",
        phone: "",
        eventDate: null,
        location: "",
        inquiryDetails: null,
        message: "",
      }),
    );
    expect(href).toBe("/admin/agenda/agendar?");

    const inbox = buildContactInboxAgendarHref(
      makeContactRequest(),
      { serviceByInquiryCode: makeServiceByInquiryCode() },
      { returnTo: "  " },
    );
    expect(inbox).toContain("returnTo=%2Fadmin%2Fagenda%2Fpeticiones");
  });
});
