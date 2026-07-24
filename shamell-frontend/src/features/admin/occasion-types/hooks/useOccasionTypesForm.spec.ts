/** @vitest-environment jsdom */

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { makeOccasionTypeItem } from "../test/fixtures/occasionTypes.fixture";
import { FIXTURE_OCCASION_TYPE_ID } from "../test/fixtures/uuids.fixture";
import { useOccasionTypesForm } from "./useOccasionTypesForm";

describe("useOccasionTypesForm", () => {
  const rows = [makeOccasionTypeItem()];

  it("canSubmit requires a valid changed name", () => {
    const { result } = renderHook(() =>
      useOccasionTypesForm({ rows, isSubmitting: false }),
    );

    expect(result.current.canSubmit).toBe(false);

    act(() => {
      result.current.setName("A");
    });
    expect(result.current.canSubmit).toBe(false);

    act(() => {
      result.current.setName("Luxury birthday");
    });
    expect(result.current.canSubmit).toBe(true);
  });

  it("startEdit fills name and editingId", () => {
    const { result } = renderHook(() =>
      useOccasionTypesForm({ rows, isSubmitting: false }),
    );

    act(() => {
      result.current.startEdit(rows[0]!);
    });

    expect(result.current.editingId).toBe(FIXTURE_OCCASION_TYPE_ID);
    expect(result.current.name).toBe("Birthday");
    expect(result.current.canSubmit).toBe(false);

    act(() => {
      result.current.setName("Birthday updated");
    });
    expect(result.current.canSubmit).toBe(true);
  });

  it("resetForm clears state", () => {
    const { result } = renderHook(() =>
      useOccasionTypesForm({ rows, isSubmitting: false }),
    );

    act(() => {
      result.current.startEdit(rows[0]!);
      result.current.resetForm();
    });

    expect(result.current.editingId).toBeNull();
    expect(result.current.name).toBe("");
  });

  it("getValidationError returns message when invalid", () => {
    const { result } = renderHook(() =>
      useOccasionTypesForm({ rows, isSubmitting: false }),
    );
    expect(result.current.getValidationError()).toBe(
      "Invalid name or no changes.",
    );
  });
});
