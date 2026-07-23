/** @vitest-environment jsdom */

import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";

const useAgendaCatalogMapsMock = vi.fn(() => ({
  serviceByInquiryCode: new Map(),
  loading: false,
}));

vi.mock("../../shared/hooks/useAgendaCatalogMaps", () => ({
  useAgendaCatalogMaps: (...args: unknown[]) => useAgendaCatalogMapsMock(...args),
}));

import { usePeticionesCatalogMaps } from "./usePeticionesCatalogMaps";

describe("usePeticionesCatalogMaps", () => {
  it("requests catalog maps with contact lines enabled", () => {
    const { result } = renderHook(() => usePeticionesCatalogMaps());
    expect(useAgendaCatalogMapsMock).toHaveBeenCalledWith({ includeContactLines: true });
    expect(result.current.loading).toBe(false);
  });
});
