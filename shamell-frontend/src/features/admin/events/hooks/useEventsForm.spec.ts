/** @vitest-environment jsdom */

import { useState } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { makeAdminEvent, makeEventTypeOption } from "../test/fixtures/events.fixture";
import { FIXTURE_EVENT_ID, FIXTURE_EVENT_TYPE_ID } from "../test/fixtures/uuids.fixture";
import { DESCRIPTION_MIN_LENGTH } from "../lib/eventsConstants";
import { useEventsForm } from "./useEventsForm";

function useFormHarness(
  overrides: { isSubmitting?: boolean; initialTypeId?: string } = {},
) {
  const [eventTypeId, setEventTypeId] = useState(
    overrides.initialTypeId ?? FIXTURE_EVENT_TYPE_ID,
  );
  return useEventsForm({
    eventTypes: [makeEventTypeOption({ isActive: true })],
    eventTypeId,
    setEventTypeId,
    isSubmitting: overrides.isSubmitting ?? false,
    defaultPublicSection: "GENERAL",
  });
}

describe("useEventsForm", () => {
  beforeEach(() => {
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:mock-preview"),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("canSubmit is true for create when type, description, and price are set without line items", () => {
    const { result } = renderHook(() => useFormHarness());

    act(() => {
      result.current.setDescription("Long enough description");
      result.current.setItemsText("");
      result.current.setPriceInput("1500");
    });

    expect(result.current.canSubmit).toBe(true);
    expect(result.current.getValidationError()).toBeNull();
  });

  it("canSubmit is true on edit with empty line items when another field changes", () => {
    const { result } = renderHook(() => useFormHarness({ initialTypeId: "" }));
    const event = makeAdminEvent({
      id: FIXTURE_EVENT_ID,
      description: "Original description here",
      items: [],
      price: 17,
    });

    act(() => {
      result.current.startEdit(event);
    });

    expect(result.current.canSubmit).toBe(false);

    act(() => {
      result.current.setDescription("Updated description text");
      result.current.setItemsText("");
    });

    expect(result.current.canSubmit).toBe(true);
    expect(result.current.getValidationError()).toBeNull();
    expect(result.current.buildUpdateBody().items).toEqual([]);
  });

  it("canSubmit is true on edit when clearing optional line items", () => {
    const { result } = renderHook(() => useFormHarness({ initialTypeId: "" }));
    const event = makeAdminEvent({
      id: FIXTURE_EVENT_ID,
      description: "Original description here",
      items: ["A", "B"],
      price: 17,
    });

    act(() => {
      result.current.startEdit(event);
      result.current.setItemsText("");
    });

    expect(result.current.canSubmit).toBe(true);
    expect(result.current.buildUpdateBody().items).toEqual([]);
  });

  it("canSubmit is true for create when type, description, items, and price are set", () => {
    const { result } = renderHook(() => useFormHarness());

    act(() => {
      result.current.setDescription("Long enough description");
      result.current.setItemsText("Dance set\nSound check");
      result.current.setPriceInput("1500");
    });

    expect(result.current.canSubmit).toBe(true);
    expect(result.current.getValidationError()).toBeNull();
  });

  it("startEdit sets editingId and form fields from the event", () => {
    const { result } = renderHook(() => useFormHarness({ initialTypeId: "" }));
    const event = makeAdminEvent({
      id: FIXTURE_EVENT_ID,
      description: "Edit me description",
      items: ["A", "B"],
      price: 999,
    });

    act(() => {
      result.current.startEdit(event);
    });

    expect(result.current.editingId).toBe(FIXTURE_EVENT_ID);
    expect(result.current.description).toBe("Edit me description");
    expect(result.current.itemsText).toBe("A\nB");
    expect(result.current.priceInput).toBe("999");
    expect(result.current.eventName).toBe(event.eventTypeName);
    expect(result.current.existingImages).toEqual(event.catalogImages);
  });

  it("getValidationError when description is too short", () => {
    const { result } = renderHook(() => useFormHarness());

    act(() => {
      result.current.setDescription("short");
      result.current.setItemsText("Item one");
      result.current.setPriceInput("100");
    });

    expect(result.current.canSubmit).toBe(false);
    expect(result.current.getValidationError()).toBe(
      `The description must be between ${DESCRIPTION_MIN_LENGTH} and 5000 characters.`,
    );
  });

  it("buildCreateBody returns the expected create payload", () => {
    const { result } = renderHook(() => useFormHarness());

    act(() => {
      result.current.setDescription("Long enough description");
      result.current.setItemsText("Dance set\nSound check");
      result.current.setPriceInput("1500");
    });

    expect(result.current.buildCreateBody()).toEqual({
      eventTypeId: FIXTURE_EVENT_TYPE_ID,
      description: "Long enough description",
      items: ["Dance set", "Sound check"],
      showOnHome: true,
      publicSection: "GENERAL",
      price: 1500,
    });
  });

  it("requires draft packages when creating with packages enabled", () => {
    function useUpcomingHarness() {
      const [eventTypeId, setEventTypeId] = useState(FIXTURE_EVENT_TYPE_ID);
      return useEventsForm({
        eventTypes: [makeEventTypeOption({ isActive: true })],
        eventTypeId,
        setEventTypeId,
        isSubmitting: false,
        defaultPublicSection: "UPCOMING_EVENTS",
        freeEventNameMode: true,
      });
    }
    const { result } = renderHook(() => useUpcomingHarness());
    act(() => {
      result.current.setEventName("Package Night");
      result.current.setDescription("Long enough description for packages event");
      result.current.setExperienceMode("FIXED_EVENT");
      result.current.setSchedule({
        ...result.current.schedule,
        scheduleMode: "FIXED_EVENT",
        salesStartDate: "2030-07-01",
        salesEndDate: "2030-07-31",
        eventDate: "2030-08-01",
        eventStartTime: "20:00",
        eventEndTime: "23:00",
      });
      result.current.setEnablePackages(true);
      result.current.setActivities([
        {
          clientKey: "ck-1",
          title: "Act",
          description: "Activity description long enough",
          accentColor: "",
          showText: true,
          displayOrder: 0,
        },
      ]);
    });
    expect(result.current.getValidationError()).toMatch(/at least one ticket package/i);

    act(() => {
      result.current.setDraftPackages([
        {
          clientKey: "pkg-1",
          title: "VIP",
          description: "",
          badge: "",
          priceInput: "40",
          capacityInput: "10",
          arrivalStartTime: "18:00",
          arrivalEndTime: "20:00",
          activityRefs: ["ck-1"],
          displayOrder: 0,
        },
      ]);
    });
    expect(result.current.getValidationError()).toBeNull();
  });

  it("onPackagesUpdated marks edit form dirty", () => {
    const { result } = renderHook(() => useFormHarness());
    const event = makeAdminEvent({ id: FIXTURE_EVENT_ID });
    act(() => {
      result.current.startEdit(event);
    });
    expect(result.current.canSubmit).toBe(false);

    act(() => {
      result.current.onPackagesUpdated([]);
    });
    expect(result.current.canSubmit).toBe(false);

    act(() => {
      result.current.onPackagesUpdated([
        {
          id: "pkg-1",
          title: "VIP",
          description: null,
          badge: null,
          priceCents: 4000,
          price: 40,
          capacity: 10,
          arrivalStartTime: "18:00",
          arrivalEndTime: "20:00",
          arrivalLabel: "6–8 PM",
          displayOrder: 0,
          isActive: true,
          activityIds: ["act-1"],
        },
      ]);
    });
    expect(result.current.canSubmit).toBe(true);
  });
});
