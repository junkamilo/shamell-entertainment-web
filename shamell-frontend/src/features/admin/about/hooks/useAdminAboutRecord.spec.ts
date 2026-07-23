/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { makeAdminAboutRow } from "../test/fixtures/about.fixture";

const toastMock = vi.fn();
const getTokenMock = vi.fn(() => "token-1");

vi.mock("@/hooks/use-toast", () => ({
  toast: (...args: unknown[]) => toastMock(...args),
}));

vi.mock("../lib/aboutAdminAuth", () => ({
  getAdminBearerToken: () => getTokenMock(),
}));

import { useAdminAboutRecord } from "./useAdminAboutRecord";

describe("useAdminAboutRecord", () => {
  beforeEach(() => {
    toastMock.mockClear();
    getTokenMock.mockReturnValue("token-1");
  });

  it("loads the published row and derives stats / values", async () => {
    const row = makeAdminAboutRow({
      title: "Loaded About",
      coreValues: ["A", "B"],
      heroMediaType: "IMAGE",
    });
    server.use(
      http.get("*/api/v1/about/admin", () => HttpResponse.json(row)),
    );

    const { result } = renderHook(() => useAdminAboutRecord());

    await waitFor(() => expect(result.current.record?.title).toBe("Loaded About"));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.coreValuesList).toEqual(["A", "B"]);
    expect(result.current.stats.state).toBe("Published");
    expect(result.current.stats.values).toBe("2");
    expect(result.current.stats.media).toBe("Photo");
  });

  it("skips fetch when there is no bearer token", async () => {
    getTokenMock.mockReturnValue("");
    let hit = 0;
    server.use(
      http.get("*/api/v1/about/admin", () => {
        hit += 1;
        return HttpResponse.json(makeAdminAboutRow());
      }),
    );

    const { result } = renderHook(() => useAdminAboutRecord());

    await act(async () => {
      await result.current.reload();
    });

    expect(hit).toBe(0);
    expect(result.current.record).toBeNull();
  });

  it("toasts on HTTP error and keeps record null", async () => {
    server.use(
      http.get("*/api/v1/about/admin", () =>
        HttpResponse.json({ message: "Nope" }, { status: 500 }),
      ),
    );

    const { result } = renderHook(() => useAdminAboutRecord());

    await waitFor(() => expect(toastMock).toHaveBeenCalled());
    expect(result.current.record).toBeNull();
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: "destructive",
        title: "Error",
      }),
    );
  });

  it("reload refreshes after a successful first load", async () => {
    let calls = 0;
    server.use(
      http.get("*/api/v1/about/admin", () => {
        calls += 1;
        return HttpResponse.json(
          makeAdminAboutRow({ title: calls === 1 ? "First" : "Second" }),
        );
      }),
    );

    const { result } = renderHook(() => useAdminAboutRecord());
    await waitFor(() => expect(result.current.record?.title).toBe("First"));

    await act(async () => {
      await result.current.reload();
    });

    await waitFor(() => expect(result.current.record?.title).toBe("Second"));
    expect(calls).toBe(2);
  });
});
