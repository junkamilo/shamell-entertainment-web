/** @vitest-environment jsdom */

import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { createMockAgendarFormState } from "../tests/helpers/mockAgendarFormState";
import { mockSearchParams } from "../tests/helpers/mockSearchParams";
import type { ReadonlyURLSearchParams } from "next/navigation";

const applyMock = vi.fn();

vi.mock("../lib/applyAgendarQueryPrefill", () => ({
  applyAgendarQueryPrefill: (...args: unknown[]) => applyMock(...args),
}));

import { useAgendarQueryPrefill } from "./useAgendarQueryPrefill";

describe("useAgendarQueryPrefill", () => {
  it("applies query prefill when enabled", () => {
    applyMock.mockClear();
    const form = createMockAgendarFormState();
    const params = mockSearchParams({ fullName: "Ada" }) as unknown as ReadonlyURLSearchParams;

    renderHook(() => useAgendarQueryPrefill(params, form));

    expect(applyMock).toHaveBeenCalledWith(params, form);
  });

  it("skips prefill when disabled", () => {
    applyMock.mockClear();
    const form = createMockAgendarFormState();
    const params = mockSearchParams({ fullName: "Ada" }) as unknown as ReadonlyURLSearchParams;

    renderHook(() => useAgendarQueryPrefill(params, form, { enabled: false }));

    expect(applyMock).not.toHaveBeenCalled();
  });
});
