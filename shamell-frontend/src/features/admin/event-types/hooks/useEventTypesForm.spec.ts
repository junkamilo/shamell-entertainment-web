/** @vitest-environment jsdom */

import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { NAME_MAX_LENGTH, NAME_MIN_LENGTH } from "../lib/eventTypesConstants";
import {
  makeEventTypeItem,
  makeOccasionCatalogItem,
} from "../test/fixtures/eventTypes.fixture";
import {
  FIXTURE_EVENT_TYPE_ID,
  FIXTURE_OCCASION_ID,
  FIXTURE_OCCASION_ID_2,
} from "../test/fixtures/uuids.fixture";
import { useEventTypesForm } from "./useEventTypesForm";

const types = [
  makeEventTypeItem(),
  makeEventTypeItem({
    id: "e2222222-2222-4222-8222-222222222222",
    name: "Corporate gala",
    isActive: false,
    occasionAssignments: [],
  }),
];

const occasionCatalog = [
  makeOccasionCatalogItem(),
  makeOccasionCatalogItem({
    id: FIXTURE_OCCASION_ID_2,
    name: "Anniversary",
    isActive: true,
  }),
];

describe("useEventTypesForm", () => {
  it("startEdit sets editingId and form fields from the type", () => {
    const { result } = renderHook(() =>
      useEventTypesForm({ types, occasionCatalog, isSubmitting: false }),
    );

    act(() => {
      result.current.startEdit(types[0]!);
    });

    expect(result.current.editingId).toBe(FIXTURE_EVENT_TYPE_ID);
    expect(result.current.name).toBe("Private weddings");
    expect(result.current.contactInquiryCode).toBe("PRIVATE");
    expect(result.current.linkedOccasionIds).toEqual([FIXTURE_OCCASION_ID]);
    expect(result.current.editingRow?.id).toBe(FIXTURE_EVENT_TYPE_ID);
  });

  it("canSubmit is true for create when name is valid", () => {
    const { result } = renderHook(() =>
      useEventTypesForm({ types, occasionCatalog, isSubmitting: false }),
    );

    act(() => {
      result.current.setName("New celebration");
    });

    expect(result.current.canSubmit).toBe(true);
    expect(result.current.getNameValidationError()).toBeNull();
  });

  it("canSubmit is false while submitting", () => {
    const { result } = renderHook(() =>
      useEventTypesForm({ types, occasionCatalog, isSubmitting: true }),
    );

    act(() => {
      result.current.setName("New celebration");
    });

    expect(result.current.canSubmit).toBe(false);
  });

  it("getNameValidationError for a short name", () => {
    const { result } = renderHook(() =>
      useEventTypesForm({ types, occasionCatalog, isSubmitting: false }),
    );

    act(() => {
      result.current.setName("A");
    });

    expect(result.current.canSubmit).toBe(false);
    expect(result.current.getNameValidationError()).toBe(
      `Name must be between ${NAME_MIN_LENGTH} and ${NAME_MAX_LENGTH} characters.`,
    );
  });

  it("buildUpsertBody returns trimmed name, occasions, and contactInquiryCode", () => {
    const { result } = renderHook(() =>
      useEventTypesForm({ types, occasionCatalog, isSubmitting: false }),
    );

    act(() => {
      result.current.setName("  Private weddings  ");
      result.current.setContactInquiryCode("  PRIVATE  ");
      result.current.toggleLinkedOccasion(FIXTURE_OCCASION_ID);
      result.current.toggleLinkedOccasion(FIXTURE_OCCASION_ID_2);
    });

    expect(result.current.buildUpsertBody()).toEqual({
      name: "Private weddings",
      occasions: [
        { occasionTypeId: FIXTURE_OCCASION_ID, usage: "OCCASION_SINGLE" },
        { occasionTypeId: FIXTURE_OCCASION_ID_2, usage: "OCCASION_SINGLE" },
      ],
      contactInquiryCode: "PRIVATE",
    });
  });

  it("buildUpsertBody sends null contactInquiryCode when blank", () => {
    const { result } = renderHook(() =>
      useEventTypesForm({ types, occasionCatalog, isSubmitting: false }),
    );

    act(() => {
      result.current.setName("Solo type");
      result.current.setContactInquiryCode("   ");
    });

    expect(result.current.buildUpsertBody()).toEqual({
      name: "Solo type",
      occasions: [],
      contactInquiryCode: null,
    });
  });
});
