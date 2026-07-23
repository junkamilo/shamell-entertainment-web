/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { sampleAgendarCatalog } from "../tests/fixtures/catalog.fixture";

const toastMock = vi.fn();
const getTokenMock = vi.fn((): string | null => "token-1");
const fetchCatalogMock = vi.fn(async () => sampleAgendarCatalog);

vi.mock("@/hooks/use-toast", () => ({
  toast: (...args: unknown[]) => toastMock(...args),
}));

vi.mock("@/app/admin/shared/lib/adminAuth", () => ({
  getAdminBearerToken: () => getTokenMock(),
}));

vi.mock("../services/fetchAgendarCatalog", () => ({
  fetchAgendarCatalog: (...args: unknown[]) => fetchCatalogMock(...args),
}));

import { useAgendarCatalog } from "./useAgendarCatalog";

describe("useAgendarCatalog", () => {
  beforeEach(() => {
    toastMock.mockClear();
    getTokenMock.mockReturnValue("token-1");
    fetchCatalogMock.mockReset();
    fetchCatalogMock.mockResolvedValue(sampleAgendarCatalog);
  });

  it("loads the catalog when authenticated", async () => {
    const { result } = renderHook(() => useAgendarCatalog());
    await waitFor(() => expect(result.current.catalogLoading).toBe(false));
    expect(result.current.catalog).toEqual(sampleAgendarCatalog);
    expect(fetchCatalogMock).toHaveBeenCalledWith("token-1");
  });

  it("skips fetch without a token", async () => {
    getTokenMock.mockReturnValue(null);
    const { result } = renderHook(() => useAgendarCatalog());
    await waitFor(() => expect(result.current.catalogLoading).toBe(false));
    expect(fetchCatalogMock).not.toHaveBeenCalled();
    expect(result.current.catalog.services).toEqual([]);
  });

  it("toasts when catalog fetch fails", async () => {
    fetchCatalogMock.mockRejectedValueOnce(new Error("boom"));
    const { result } = renderHook(() => useAgendarCatalog());
    await waitFor(() => expect(toastMock).toHaveBeenCalled());
    expect(result.current.catalogLoading).toBe(false);
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Could not load catalog", variant: "destructive" }),
    );
  });
});
