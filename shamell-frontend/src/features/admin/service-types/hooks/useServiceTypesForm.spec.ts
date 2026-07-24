/** @vitest-environment jsdom */

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { makeServiceTypeItem } from "../test/fixtures/serviceTypes.fixture";
import { FIXTURE_SERVICE_TYPE_ID } from "../test/fixtures/uuids.fixture";
import { useServiceTypesForm } from "./useServiceTypesForm";

describe("useServiceTypesForm", () => {
  const types = [makeServiceTypeItem()];

  it("canSubmit requires a valid changed name", () => {
    const { result } = renderHook(() =>
      useServiceTypesForm({ types, isSubmitting: false }),
    );

    expect(result.current.canSubmit).toBe(false);

    act(() => {
      result.current.setName("A");
    });
    expect(result.current.canSubmit).toBe(false);

    act(() => {
      result.current.setName("Weddings");
    });
    expect(result.current.canSubmit).toBe(true);
  });

  it("startEdit fills name and editingId", () => {
    const { result } = renderHook(() =>
      useServiceTypesForm({ types, isSubmitting: false }),
    );

    act(() => {
      result.current.startEdit(types[0]!);
    });

    expect(result.current.editingId).toBe(FIXTURE_SERVICE_TYPE_ID);
    expect(result.current.name).toBe("Performance");
    expect(result.current.canSubmit).toBe(false);

    act(() => {
      result.current.setName("Performance updated");
    });
    expect(result.current.canSubmit).toBe(true);
  });

  it("resetForm clears state", () => {
    const { result } = renderHook(() =>
      useServiceTypesForm({ types, isSubmitting: false }),
    );

    act(() => {
      result.current.startEdit(types[0]!);
      result.current.resetForm();
    });

    expect(result.current.editingId).toBeNull();
    expect(result.current.name).toBe("");
  });

  it("getNameValidationError returns empty-name message", () => {
    const { result } = renderHook(() =>
      useServiceTypesForm({ types, isSubmitting: false }),
    );
    expect(result.current.getNameValidationError()).toBe(
      "Enter a name for the service type.",
    );
  });

  it("getNameValidationError rejects short names", () => {
    const { result } = renderHook(() =>
      useServiceTypesForm({ types, isSubmitting: false }),
    );
    act(() => {
      result.current.setName("A");
    });
    expect(result.current.getNameValidationError()).toBe(
      "Name must be between 2 and 100 characters.",
    );
  });

  it("getNameValidationError rejects names over 100 characters", () => {
    const { result } = renderHook(() =>
      useServiceTypesForm({ types, isSubmitting: false }),
    );
    act(() => {
      result.current.setName("A".repeat(101));
    });
    expect(result.current.getNameValidationError()).toBe(
      "Name must be between 2 and 100 characters.",
    );
  });

  it("getNameValidationError rejects numbers and invalid characters", () => {
    const { result } = renderHook(() =>
      useServiceTypesForm({ types, isSubmitting: false }),
    );
    act(() => {
      result.current.setName("Type 1");
    });
    expect(result.current.getNameValidationError()).toBe(
      "Only letters, spaces, hyphens, and '&' are allowed. Numbers are not allowed.",
    );
  });

  it("getNameValidationError returns nothing-to-save when unchanged", () => {
    const { result } = renderHook(() =>
      useServiceTypesForm({ types, isSubmitting: false }),
    );
    act(() => {
      result.current.startEdit(types[0]!);
    });
    expect(result.current.getNameValidationError()).toBe("Nothing to save.");
  });
});
