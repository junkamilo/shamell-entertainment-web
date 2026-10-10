/** @vitest-environment jsdom */

import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { createMockAgendarFormState } from "@test/features/admin/agenda/agendar/support/helpers/mockAgendarFormState";
import { mockSearchParams } from "@test/features/admin/agenda/agendar/support/helpers/mockSearchParams";
import type { ReadonlyURLSearchParams } from "next/navigation";

const applyMock = vi.fn();

vi.mock("@/features/admin/agenda/agendar/lib/applyAgendarQueryPrefill", () => ({
  applyAgendarQueryPrefill: (...args: unknown[]) => applyMock(...args),
}));

import { useAgendarQueryPrefill } from "@/features/admin/agenda/agendar/hooks/useAgendarQueryPrefill";

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
