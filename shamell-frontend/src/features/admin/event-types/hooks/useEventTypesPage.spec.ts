/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import {
  makeEventTypeItem,
  makeEventTypesApiPayload,
} from "../test/fixtures/eventTypes.fixture";
import { FIXTURE_EVENT_TYPE_ID_2 } from "../test/fixtures/uuids.fixture";

const toastMock = vi.fn();
const getTokenMock = vi.fn((): string | null => "token-1");

vi.mock("@/hooks/use-toast", () => ({
  toast: (...args: unknown[]) => toastMock(...args),
}));

vi.mock("../lib/eventTypesAuth", () => ({
  getEventTypesBearerToken: () => getTokenMock(),
}));

import { useEventTypesPage } from "./useEventTypesPage";

describe("useEventTypesPage", () => {
  beforeEach(() => {
    toastMock.mockClear();
    getTokenMock.mockReturnValue("token-1");
  });

  it("loads types after mount", async () => {
    const { result } = renderHook(() => useEventTypesPage());

    await waitFor(() => expect(result.current.list.isLoading).toBe(false));
    expect(result.current.list.types.length).toBeGreaterThan(0);
  });

  it("openCreateModal sets isModalOpen true and clears editingId", async () => {
    const { result } = renderHook(() => useEventTypesPage());
    await waitFor(() => expect(result.current.list.isLoading).toBe(false));

    act(() => {
      result.current.openCreateModal();
    });

    expect(result.current.isModalOpen).toBe(true);
    expect(result.current.form.editingId).toBeNull();
  });

  it("startEdit opens the modal with editingId set", async () => {
    const { result } = renderHook(() => useEventTypesPage());
    await waitFor(() => expect(result.current.list.types.length).toBeGreaterThan(0));

    const item = result.current.list.types[0]!;

    act(() => {
      result.current.startEdit(item);
    });

    expect(result.current.isModalOpen).toBe(true);
    expect(result.current.form.editingId).toBe(item.id);
    expect(result.current.form.name).toBe(item.name);
  });

  it("onToggleActive flips an inactive type via MSW", async () => {
    let types = makeEventTypesApiPayload();
    server.use(
      http.get("*/api/v1/events/types/admin", () => HttpResponse.json(types)),
      http.patch("*/api/v1/events/types/admin/:id", async ({ params, request }) => {
        const body = (await request.json()) as { isActive?: boolean };
        const id = String(params.id);
        if (typeof body.isActive === "boolean") {
          types = types.map((row) =>
            row.id === id ? { ...row, isActive: body.isActive! } : row,
          );
        }
        return HttpResponse.json({ ok: true });
      }),
    );

    const { result } = renderHook(() => useEventTypesPage());
    await waitFor(() => expect(result.current.list.isLoading).toBe(false));

    const inactive = result.current.list.types.find((t) => t.id === FIXTURE_EVENT_TYPE_ID_2);
    expect(inactive?.isActive).toBe(false);

    await act(async () => {
      await result.current.onToggleActive(inactive!);
    });

    await waitFor(() => {
      const updated = result.current.list.types.find((t) => t.id === FIXTURE_EVENT_TYPE_ID_2);
      expect(updated?.isActive).toBe(true);
    });
  });

  it("openDeleteConfirm then onConfirmDelete removes the type", async () => {
    let types = makeEventTypesApiPayload([
      makeEventTypeItem({ eventCount: 0, bookingCount: 0, galleryPhotoCount: 0 }),
      makeEventTypeItem({
        id: FIXTURE_EVENT_TYPE_ID_2,
        name: "Corporate gala",
        isActive: false,
        occasionAssignments: [],
        eventCount: 0,
        bookingCount: 0,
        galleryPhotoCount: 0,
      }),
    ]);
    server.use(
      http.get("*/api/v1/events/types/admin", () => HttpResponse.json(types)),
      http.delete("*/api/v1/events/types/admin/:id", ({ params }) => {
        const id = String(params.id);
        types = types.filter((row) => row.id !== id);
        return HttpResponse.json({ ok: true });
      }),
    );

    const { result } = renderHook(() => useEventTypesPage());
    await waitFor(() => expect(result.current.list.types.length).toBeGreaterThan(0));

    const target = result.current.list.types.find((t) => t.id === FIXTURE_EVENT_TYPE_ID_2)!;
    const beforeCount = result.current.list.types.length;

    act(() => {
      result.current.openDeleteConfirm(target);
    });
    expect(result.current.pendingDelete?.id).toBe(FIXTURE_EVENT_TYPE_ID_2);

    await act(async () => {
      await result.current.onConfirmDelete();
    });

    await waitFor(() => {
      expect(result.current.pendingDelete).toBeNull();
      expect(result.current.list.types).toHaveLength(beforeCount - 1);
      expect(
        result.current.list.types.find((t) => t.id === FIXTURE_EVENT_TYPE_ID_2),
      ).toBeUndefined();
    });
  });
});
