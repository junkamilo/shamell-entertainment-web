/** @vitest-environment jsdom */

import { useState } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { makeAdminService, makeServiceType } from "../test/fixtures/services.fixture";
import { FIXTURE_SERVICE_ID, FIXTURE_SERVICE_TYPE_ID } from "../test/fixtures/uuids.fixture";
import { DESCRIPTION_MIN_LENGTH } from "../lib/servicesConstants";
import { useServicesForm } from "./useServicesForm";

function useFormHarness(
  overrides: { isSubmitting?: boolean; initialTypeId?: string } = {},
) {
  const [serviceTypeId, setServiceTypeId] = useState(
    overrides.initialTypeId ?? FIXTURE_SERVICE_TYPE_ID,
  );
  return useServicesForm({
    serviceTypes: [makeServiceType({ isActive: true })],
    serviceTypeId,
    setServiceTypeId,
    isSubmitting: overrides.isSubmitting ?? false,
  });
}

describe("useServicesForm", () => {
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

  it("canSubmit is true for create when description, items, price, type, and image are set", () => {
    const { result } = renderHook(() => useFormHarness());
    const image = new File(["x"], "photo.jpg", { type: "image/jpeg" });

    act(() => {
      result.current.setDescription("Long enough description");
      result.current.setItemsText("Dance set\nSound check");
      result.current.setPriceInput("1500");
      result.current.setImage(image);
    });

    expect(result.current.canSubmit).toBe(true);
    expect(result.current.getValidationError()).toBeNull();
  });

  it("startEdit sets editingId and form fields from the service", () => {
    const { result } = renderHook(() => useFormHarness({ initialTypeId: "" }));
    const service = makeAdminService({
      id: FIXTURE_SERVICE_ID,
      description: "Edit me description",
      items: ["A", "B"],
      price: 999,
    });

    act(() => {
      result.current.startEdit(service);
    });

    expect(result.current.editingId).toBe(FIXTURE_SERVICE_ID);
    expect(result.current.description).toBe("Edit me description");
    expect(result.current.itemsText).toBe("A\nB");
    expect(result.current.priceInput).toBe("999");
    expect(result.current.serviceTypeId).toBe(FIXTURE_SERVICE_TYPE_ID);
    expect(result.current.existingImageUrl).toBe(service.imageUrl);
  });

  it("resetForm clears description and editing state", () => {
    const { result } = renderHook(() => useFormHarness());

    act(() => {
      result.current.setDescription("Something long enough");
      result.current.startEdit(makeAdminService());
    });
    expect(result.current.description).toBeTruthy();
    expect(result.current.editingId).toBe(FIXTURE_SERVICE_ID);

    act(() => {
      result.current.resetForm();
    });

    expect(result.current.description).toBe("");
    expect(result.current.editingId).toBeNull();
  });

  it("getValidationError when description is too short", () => {
    const { result } = renderHook(() => useFormHarness());

    act(() => {
      result.current.setDescription("short");
      result.current.setItemsText("Item one");
      result.current.setPriceInput("100");
      result.current.setImage(new File(["x"], "a.jpg", { type: "image/jpeg" }));
    });

    expect(result.current.canSubmit).toBe(false);
    expect(result.current.getValidationError()).toBe(
      `The description must be between ${DESCRIPTION_MIN_LENGTH} and 5000 characters.`,
    );
  });

  it("buildUpsertFormData returns FormData with expected fields", () => {
    const { result } = renderHook(() => useFormHarness());
    const image = new File(["x"], "photo.jpg", { type: "image/jpeg" });

    act(() => {
      result.current.setDescription("Long enough description");
      result.current.setItemsText("Dance set");
      result.current.setPriceInput("1500");
      result.current.setImage(image);
    });

    const formData = result.current.buildUpsertFormData();
    expect(formData).toBeInstanceOf(FormData);
    expect(formData.get("serviceTypeId")).toBe(FIXTURE_SERVICE_TYPE_ID);
    expect(formData.get("description")).toBe("Long enough description");
    expect(formData.getAll("items")).toEqual(["Dance set"]);
    expect(formData.get("price")).toBe("1500");
    expect(formData.get("image")).toBe(image);
  });
});
