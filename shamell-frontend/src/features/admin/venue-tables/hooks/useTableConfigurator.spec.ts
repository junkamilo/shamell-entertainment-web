/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { makeVenueTable } from "../test/fixtures/venueTables.fixture";
import { FIXTURE_TABLE_ID } from "../test/fixtures/uuids.fixture";

const toastMock = vi.fn();
const getTokenMock = vi.fn((): string | null => "token-1");
const onSavedMock = vi.fn();

vi.mock("@/hooks/use-toast", () => ({
  toast: (...args: unknown[]) => toastMock(...args),
}));

vi.mock("@/app/admin/shared/lib/adminAuth", () => ({
  getAdminBearerToken: () => getTokenMock(),
}));

import { useTableConfigurator } from "./useTableConfigurator";

describe("useTableConfigurator", () => {
  beforeEach(() => {
    toastMock.mockClear();
    onSavedMock.mockClear();
    getTokenMock.mockReturnValue("token-1");
  });

  it("initializes create mode with LARGE defaults", () => {
    const { result } = renderHook(() =>
      useTableConfigurator(null, onSavedMock),
    );
    expect(result.current.isEditMode).toBe(false);
    expect(result.current.size).toBe("LARGE");
    expect(result.current.includedChairs).toBe(6);
  });

  it("initializes edit mode from existing table", () => {
    const editing = makeVenueTable();
    const { result } = renderHook(() =>
      useTableConfigurator(editing, onSavedMock),
    );
    expect(result.current.isEditMode).toBe(true);
    expect(result.current.bundlePriceInput).toBe("250");
    expect(result.current.includedChairs).toBe(8);
  });

  it("clamps chairs when size changes", () => {
    const { result } = renderHook(() =>
      useTableConfigurator(null, onSavedMock),
    );
    act(() => {
      result.current.setSize("SMALL");
    });
    expect(result.current.includedChairs).toBeLessThanOrEqual(4);
  });

  it("creates tables via bulk POST on save", async () => {
    const { result } = renderHook(() =>
      useTableConfigurator(null, onSavedMock),
    );

    act(() => {
      result.current.setBundlePriceInput("200");
    });

    await act(async () => {
      await result.current.save();
    });

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: expect.stringMatching(/table created/) }),
    );
    expect(onSavedMock).toHaveBeenCalled();
  });

  it("sets field errors when price is missing", async () => {
    const { result } = renderHook(() =>
      useTableConfigurator(null, onSavedMock),
    );

    await act(async () => {
      await result.current.save();
    });

    expect(result.current.fieldErrors.length).toBeGreaterThan(0);
    expect(onSavedMock).not.toHaveBeenCalled();
  });

  it("updates table in edit mode", async () => {
    const editing = makeVenueTable();
    const { result } = renderHook(() =>
      useTableConfigurator(editing, onSavedMock),
    );

    await act(async () => {
      await result.current.save();
    });

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Table updated" }),
    );
    expect(onSavedMock).toHaveBeenCalled();
  });

  it("toasts not signed in when token is missing", async () => {
    getTokenMock.mockReturnValue(null);
    const { result } = renderHook(() =>
      useTableConfigurator(null, onSavedMock),
    );

    act(() => {
      result.current.setBundlePriceInput("200");
    });

    await act(async () => {
      await result.current.save();
    });

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ variant: "destructive", title: "Not signed in" }),
    );
  });

  it("toasts save failed on API error", async () => {
    server.use(
      http.post("*/api/v1/venue-tables/admin/bulk", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );

    const { result } = renderHook(() =>
      useTableConfigurator(null, onSavedMock),
    );

    act(() => {
      result.current.setBundlePriceInput("200");
    });

    await act(async () => {
      await result.current.save();
    });

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ variant: "destructive", title: "Save failed" }),
    );
  });
});
