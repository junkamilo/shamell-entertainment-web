/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";

const toastMock = vi.fn();
const getTokenMock = vi.fn((): string | null => "token-1");
const onSavedMock = vi.fn();

vi.mock("@/hooks/use-toast", () => ({
  toast: (...args: unknown[]) => toastMock(...args),
}));

vi.mock("@/app/admin/shared/lib/adminAuth", () => ({
  getAdminBearerToken: () => getTokenMock(),
}));

import { useStandaloneChairConfigurator } from "./useStandaloneChairConfigurator";

describe("useStandaloneChairConfigurator", () => {
  beforeEach(() => {
    toastMock.mockClear();
    onSavedMock.mockClear();
    getTokenMock.mockReturnValue("token-1");
  });

  it("initializes with default unit price when provided", () => {
    const { result } = renderHook(() =>
      useStandaloneChairConfigurator({
        currentCount: 2,
        defaultUnitPrice: 35,
        onSaved: onSavedMock,
      }),
    );
    expect(result.current.quantity).toBe(1);
    expect(result.current.unitPriceInput).toBe("35");
    expect(result.current.maxAddQuantity).toBeGreaterThan(0);
  });

  it("saves chairs via PUT on valid input", async () => {
    const { result } = renderHook(() =>
      useStandaloneChairConfigurator({
        currentCount: 2,
        defaultUnitPrice: 35,
        onSaved: onSavedMock,
      }),
    );

    act(() => {
      result.current.setQuantity(2);
      result.current.setUnitPriceInput("40");
    });

    await act(async () => {
      await result.current.save();
    });

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "2 chairs added" }),
    );
    expect(onSavedMock).toHaveBeenCalled();
  });

  it("sets field errors for invalid price", async () => {
    const { result } = renderHook(() =>
      useStandaloneChairConfigurator({
        currentCount: 0,
        defaultUnitPrice: 0,
        onSaved: onSavedMock,
      }),
    );

    await act(async () => {
      await result.current.save();
    });

    expect(result.current.fieldErrors.length).toBeGreaterThan(0);
    expect(onSavedMock).not.toHaveBeenCalled();
  });

  it("toasts not signed in when token is missing", async () => {
    getTokenMock.mockReturnValue(null);
    const { result } = renderHook(() =>
      useStandaloneChairConfigurator({
        currentCount: 0,
        defaultUnitPrice: 35,
        onSaved: onSavedMock,
      }),
    );

    act(() => {
      result.current.setUnitPriceInput("35");
    });

    await act(async () => {
      await result.current.save();
    });

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ variant: "destructive", title: "Not signed in" }),
    );
  });

  it("toasts error on API failure", async () => {
    server.use(
      http.put("*/api/v1/standalone-chairs/admin", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );

    const { result } = renderHook(() =>
      useStandaloneChairConfigurator({
        currentCount: 0,
        defaultUnitPrice: 35,
        onSaved: onSavedMock,
      }),
    );

    await act(async () => {
      await result.current.save();
    });

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: "destructive",
        title: "Could not add chairs",
      }),
    );
  });
});
