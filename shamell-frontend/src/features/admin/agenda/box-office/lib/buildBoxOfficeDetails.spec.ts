import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeChairSeat, makeTableSeat } from "../test/fixtures/boxOffice.fixture";
import {
  FIXTURE_FIXED_EVENT_ID,
  FIXTURE_VENUE_EVENT_ID,
} from "../test/fixtures/uuids.fixture";
import { buildBoxOfficeDetails } from "./buildBoxOfficeDetails";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2030-01-01T00:00:00.000Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("buildBoxOfficeDetails", () => {
  it("builds a venue-seating selection from the selected seat", () => {
    const seat = makeTableSeat();
    const payload = buildBoxOfficeDetails({
      purchaseKind: "venue_seating",
      upcomingEventId: FIXTURE_VENUE_EVENT_ID,
      paymentMethod: "cash",
      customerName: "Jane Doe",
      customerEmail: "jane@example.com",
      customerPhone: "",
      seat,
      ticketAmount: null,
      ticketCurrency: "usd",
    });

    expect(payload.mode).toBe("fixed");
    expect(payload.purchaseKind).toBe("venue_seating");
    expect(payload.selection).toEqual({
      kind: seat.kind,
      layoutItemId: seat.layoutItemId,
      venueTableConfigId: seat.venueTableConfigId,
      tableSize: seat.tableSize,
      seatLabel: seat.seatLabel,
      fullLabel: seat.fullLabel,
      detail: seat.detail,
      amount: seat.amount,
      currency: "usd",
    });
  });

  it("defaults optional seat fields to null for a standalone chair", () => {
    const seat = makeChairSeat();
    const payload = buildBoxOfficeDetails({
      purchaseKind: "venue_seating",
      upcomingEventId: FIXTURE_VENUE_EVENT_ID,
      paymentMethod: "cash",
      customerName: "Jane Doe",
      customerEmail: "jane@example.com",
      customerPhone: "",
      seat,
      ticketAmount: null,
      ticketCurrency: "usd",
    });

    expect(payload.selection).toMatchObject({
      venueTableConfigId: null,
      tableSize: null,
    });
  });

  it("builds a fixed-ticket selection with quantity 1 when there is no seat", () => {
    const payload = buildBoxOfficeDetails({
      purchaseKind: "fixed_ticket",
      upcomingEventId: FIXTURE_FIXED_EVENT_ID,
      paymentMethod: "stripe",
      customerName: "Jane Doe",
      customerEmail: "jane@example.com",
      customerPhone: "",
      seat: null,
      ticketAmount: 45,
      ticketCurrency: "usd",
    });

    expect(payload.purchaseKind).toBe("fixed_ticket");
    expect(payload.selection).toEqual({
      quantity: 1,
      amount: 45,
      currency: "usd",
    });
  });

  it("trims the name and lowercases the email", () => {
    const payload = buildBoxOfficeDetails({
      purchaseKind: "fixed_ticket",
      upcomingEventId: FIXTURE_FIXED_EVENT_ID,
      paymentMethod: "cash",
      customerName: "  Jane Doe  ",
      customerEmail: "  JANE@EXAMPLE.COM  ",
      customerPhone: "",
      seat: null,
      ticketAmount: 45,
      ticketCurrency: "usd",
    });

    expect(payload.customer.fullName).toBe("Jane Doe");
    expect(payload.customer.email).toBe("jane@example.com");
  });

  it("maps an empty (or whitespace-only) phone to null", () => {
    const blank = buildBoxOfficeDetails({
      purchaseKind: "fixed_ticket",
      upcomingEventId: FIXTURE_FIXED_EVENT_ID,
      paymentMethod: "cash",
      customerName: "Jane Doe",
      customerEmail: "jane@example.com",
      customerPhone: "   ",
      seat: null,
      ticketAmount: 45,
      ticketCurrency: "usd",
    });
    expect(blank.customer.phone).toBeNull();

    const withPhone = buildBoxOfficeDetails({
      purchaseKind: "fixed_ticket",
      upcomingEventId: FIXTURE_FIXED_EVENT_ID,
      paymentMethod: "cash",
      customerName: "Jane Doe",
      customerEmail: "jane@example.com",
      customerPhone: "  +1 555 0100  ",
      seat: null,
      ticketAmount: 45,
      ticketCurrency: "usd",
    });
    expect(withPhone.customer.phone).toBe("+1 555 0100");
  });

  it("stamps submittedAt as an ISO string at build time", () => {
    const payload = buildBoxOfficeDetails({
      purchaseKind: "fixed_ticket",
      upcomingEventId: FIXTURE_FIXED_EVENT_ID,
      paymentMethod: "cash",
      customerName: "Jane Doe",
      customerEmail: "jane@example.com",
      customerPhone: "",
      seat: null,
      ticketAmount: 45,
      ticketCurrency: "usd",
    });

    expect(payload.submittedAt).toBe("2030-01-01T00:00:00.000Z");
  });
});
