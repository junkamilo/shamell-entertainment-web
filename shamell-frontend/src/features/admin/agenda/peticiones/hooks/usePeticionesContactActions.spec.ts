/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";

const push = vi.fn();
const toastMock = vi.fn();
const isConciergeMock = vi.fn(() => false);
const buildHrefMock = vi.fn(() => "/admin/agenda/agendar?from=inbox");
const buildPayloadMock = vi.fn(() => ({
  ok: true as const,
  payload: {
    serviceIds: ["svc-1"],
    eventDate: "2026-08-15T14:00:00.000Z",
    location: "Studio",
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/hooks/use-toast", () => ({
  toast: (...args: unknown[]) => toastMock(...args),
}));

vi.mock("@/lib/contactRequestBooking", () => ({
  buildContactInboxAgendarHref: (...args: unknown[]) => buildHrefMock(...args),
  buildAdminBookingPayloadFromContactRequest: (...args: unknown[]) =>
    buildPayloadMock(...args),
}));

vi.mock("../lib/peticionesContactUtils", () => ({
  contactIsConciergeInquiry: (...args: unknown[]) => isConciergeMock(...args),
}));

import { usePeticionesContactActions } from "./usePeticionesContactActions";
import type { ContactRequest } from "@/hooks/use-admin-contact-requests";

function makeContact(overrides: Partial<ContactRequest> = {}): ContactRequest {
  return {
    id: "contact-1",
    status: "PENDING",
    ...overrides,
  } as ContactRequest;
}

describe("usePeticionesContactActions", () => {
  const createBooking = vi.fn(async () => undefined);
  const setStatus = vi.fn(async () => undefined);
  const remove = vi.fn(async () => undefined);
  const reloadContacts = vi.fn();
  const reloadBookings = vi.fn();
  const reloadPeticiones = vi.fn();
  const setBusyId = vi.fn();
  const setReservingContactId = vi.fn();
  const setExpandedId = vi.fn();
  const setConfirmDelete = vi.fn();

  beforeEach(() => {
    push.mockClear();
    toastMock.mockClear();
    isConciergeMock.mockReturnValue(false);
    buildPayloadMock.mockReturnValue({
      ok: true,
      payload: {
        serviceIds: ["svc-1"],
        eventDate: "2026-08-15T14:00:00.000Z",
        location: "Studio",
      },
    });
    createBooking.mockClear();
    setStatus.mockClear();
    remove.mockClear();
    reloadContacts.mockClear();
    reloadBookings.mockClear();
    reloadPeticiones.mockClear();
    setBusyId.mockClear();
    setReservingContactId.mockClear();
    setExpandedId.mockClear();
    setConfirmDelete.mockClear();
  });

  function renderActions() {
    return renderHook(() =>
      usePeticionesContactActions({
        unifiedRows: [],
        reloadPeticiones,
        bookingTz: "America/New_York",
        contact: { remove, setStatus, reloadContacts },
        createBooking,
        reloadBookings,
        catalog: {
          serviceByInquiryCode: new Map(),
          eventTypeContactCodeById: new Map(),
          inquiryCodeByCatalogLineId: new Map(),
        },
        setBusyId,
        setReservingContactId,
        setExpandedId,
        setConfirmDelete,
      }),
    );
  }

  it("routes concierge inquiries to Agendar", async () => {
    isConciergeMock.mockReturnValue(true);
    const { result } = renderActions();
    await act(async () => {
      await result.current.onReserveFromContact(makeContact());
    });
    expect(push).toHaveBeenCalledWith("/admin/agenda/agendar?from=inbox");
    expect(createBooking).not.toHaveBeenCalled();
  });

  it("auto-books a non-concierge contact", async () => {
    const { result } = renderActions();
    await act(async () => {
      await result.current.onReserveFromContact(makeContact());
    });
    expect(createBooking).toHaveBeenCalled();
    expect(setStatus).toHaveBeenCalledWith("contact-1", "RESERVED");
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Booking created" }),
    );
  });

  it("toasts when the booking payload cannot be built", async () => {
    buildPayloadMock.mockReturnValue({ ok: false, error: "Missing service" });
    const { result } = renderActions();
    await act(async () => {
      await result.current.onReserveFromContact(makeContact());
    });
    expect(createBooking).not.toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Cannot create booking automatically",
        variant: "destructive",
      }),
    );
  });
});
