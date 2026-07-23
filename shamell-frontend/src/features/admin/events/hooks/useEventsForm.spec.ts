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
});
