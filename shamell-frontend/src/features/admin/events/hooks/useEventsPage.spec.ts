/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import {
  makeAdminEventsApiPayload,
  makeEventTypeOption,
} from "../test/fixtures/events.fixture";
import { FIXTURE_EVENT_ID_2 } from "../test/fixtures/uuids.fixture";

const toastMock = vi.fn();
const getTokenMock = vi.fn((): string | null => "token-1");

vi.mock("@/hooks/use-toast", () => ({
  toast: (...args: unknown[]) => toastMock(...args),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/events",
}));

vi.mock("../lib/eventsAuth", () => ({
  getEventsBearerToken: () => getTokenMock(),
}));

import { useEventsPage } from "./useEventsPage";

describe("useEventsPage", () => {
  beforeEach(() => {
    toastMock.mockClear();
    getTokenMock.mockReturnValue("token-1");
  });

  it("loads catalog events after mount", async () => {
    const { result } = renderHook(() => useEventsPage());

    await waitFor(() => expect(result.current.catalog.isLoading).toBe(false));
    expect(result.current.catalog.events.length).toBeGreaterThan(0);
    expect(result.current.pageTitle).toBe("Events");
    expect(result.current.upcomingOnly).toBe(false);
  });

  it("openCreateModal sets isModalOpen true", async () => {
    const { result } = renderHook(() => useEventsPage());
    await waitFor(() => expect(result.current.catalog.isLoading).toBe(false));

    act(() => {
      result.current.openCreateModal();
    });

    expect(result.current.isModalOpen).toBe(true);
    expect(result.current.form.editingId).toBeNull();
  });

  it("startEdit opens the modal with editingId set", async () => {
    const { result } = renderHook(() => useEventsPage());
    await waitFor(() => expect(result.current.catalog.events.length).toBeGreaterThan(0));

    const event = result.current.catalog.events[0]!;

    await act(async () => {
      await result.current.startEdit(event);
    });

    expect(result.current.isModalOpen).toBe(true);
    expect(result.current.form.editingId).toBe(event.id);
    expect(result.current.form.description).toBe(event.description);
  });

  it("onToggleActive flips an inactive event via MSW", async () => {
    let events = makeAdminEventsApiPayload();
    server.use(
      http.get("*/api/v1/events/types/admin", () =>
        HttpResponse.json([makeEventTypeOption()]),
      ),
      http.get("*/api/v1/events/admin", () => HttpResponse.json(events)),
      http.patch("*/api/v1/events/admin/:id", async ({ params, request }) => {
        const body = (await request.json()) as { isActive?: boolean };
        const id = String(params.id);
        if (typeof body.isActive === "boolean") {
          events = events.map((row) =>
            row.id === id ? { ...row, isActive: body.isActive! } : row,
          );
        }
        return HttpResponse.json({ ok: true });
      }),
    );

    const { result } = renderHook(() => useEventsPage());
    await waitFor(() => expect(result.current.catalog.isLoading).toBe(false));

    const inactive = result.current.catalog.events.find((e) => e.id === FIXTURE_EVENT_ID_2);
    expect(inactive?.isActive).toBe(false);

    await act(async () => {
      await result.current.onToggleActive(inactive!);
    });

    await waitFor(() => {
      const updated = result.current.catalog.events.find(
        (e) => e.id === FIXTURE_EVENT_ID_2,
      );
      expect(updated?.isActive).toBe(true);
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Event visible" }),
    );
  });

  it("openDeleteConfirm then onConfirmDelete removes the event", async () => {
    let events = makeAdminEventsApiPayload();
    server.use(
      http.get("*/api/v1/events/types/admin", () =>
        HttpResponse.json([makeEventTypeOption()]),
      ),
      http.get("*/api/v1/events/admin", () => HttpResponse.json(events)),
      http.delete("*/api/v1/events/admin/:id", ({ params }) => {
        const id = String(params.id);
        events = events.filter((row) => row.id !== id);
        return HttpResponse.json({ ok: true });
      }),
    );

    const { result } = renderHook(() => useEventsPage());
    await waitFor(() => expect(result.current.catalog.events.length).toBeGreaterThan(0));

    const target = result.current.catalog.events.find((e) => e.id === FIXTURE_EVENT_ID_2)!;
    const beforeCount = result.current.catalog.events.length;

    act(() => {
      result.current.openDeleteConfirm(target);
    });
    expect(result.current.pendingDelete?.id).toBe(FIXTURE_EVENT_ID_2);

    await act(async () => {
      await result.current.onConfirmDelete();
    });

    await waitFor(() => {
      expect(result.current.pendingDelete).toBeNull();
      expect(result.current.catalog.events).toHaveLength(beforeCount - 1);
      expect(
        result.current.catalog.events.find((e) => e.id === FIXTURE_EVENT_ID_2),
      ).toBeUndefined();
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Event deleted" }),
    );
  });
});
