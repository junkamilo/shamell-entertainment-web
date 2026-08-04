/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useBlockedActionWarning } from "./useBlockedActionWarning";

describe("useBlockedActionWarning", () => {
  it("opens and closes warning content", () => {
    const { result } = renderHook(() => useBlockedActionWarning());
    expect(result.current.isOpen).toBe(false);
    expect(result.current.title).toBe("");
    expect(result.current.description).toBe("");

    act(() => {
      result.current.openWarning({
        title: "Cannot delete",
        description: "Linked records exist.",
      });
    });
    expect(result.current.isOpen).toBe(true);
    expect(result.current.title).toBe("Cannot delete");
    expect(result.current.description).toBe("Linked records exist.");

    act(() => {
      result.current.closeWarning();
    });
    expect(result.current.isOpen).toBe(false);
    expect(result.current.title).toBe("");
    expect(result.current.description).toBe("");
  });
});
