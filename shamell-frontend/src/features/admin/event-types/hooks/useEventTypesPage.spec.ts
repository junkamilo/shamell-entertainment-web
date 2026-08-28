/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import {
  makeEventTypeItem,
  makeEventTypesApiPayload,
} from "../test/fixtures/eventTypes.fixture";
import { FIXTURE_EVENT_TYPE_ID, FIXTURE_EVENT_TYPE_ID_2 } from "../test/fixtures/uuids.fixture";

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

  it("closes the modal and ignores blocked actions", async () => {
    const { result } = renderHook(() => useEventTypesPage());
    await waitFor(() => expect(result.current.list.isLoading).toBe(false));
    act(() => {
      result.current.openCreateModal();
      result.current.closeModal();
    });
    const blocked = makeEventTypeItem({ isActive: true, eventCount: 1 });
    await act(async () => {
      await result.current.onToggleActive(blocked);
    });
    act(() => {
      result.current.openDeleteConfirm(blocked);
    });
    expect(result.current.pendingDelete).toBeNull();
    await act(async () => {
      await result.current.onConfirmDelete();
    });
    act(() => {
      result.current.closeDeleteModal();
    });
  });

  it("creates, validates, and updates event types", async () => {
    const { result } = renderHook(() => useEventTypesPage());
    await waitFor(() => expect(result.current.list.isLoading).toBe(false));
    const event = { preventDefault: vi.fn() } as unknown as React.FormEvent<HTMLFormElement>;

    getTokenMock.mockReturnValue(null);
    await act(async () => {
      await result.current.onSubmit(event);
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Sign-in required" }),
    );

    getTokenMock.mockReturnValue("token-1");
    act(() => {
      result.current.openCreateModal();
    });
    await act(async () => {
      await result.current.onSubmit(event);
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Check the form" }),
    );

    act(() => {
      result.current.form.setName("Gala nights");
    });
    await act(async () => {
      await result.current.onSubmit(event);
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Type created" }),
    );

    const item = result.current.list.types[0]!;
    act(() => {
      result.current.startEdit(item);
      result.current.form.setName(`${item.name} extra`);
    });
    await act(async () => {
      await result.current.onSubmit(event);
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Type updated" }),
    );

    await act(async () => {
      await result.current.onToggleActive(item);
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Type hidden" }),
    );
  });

  it("toasts errors and resets form when activating the edited row", async () => {
    const { result } = renderHook(() => useEventTypesPage());
    await waitFor(() => expect(result.current.list.isLoading).toBe(false));
    const event = { preventDefault: vi.fn() } as unknown as React.FormEvent<HTMLFormElement>;

    server.use(http.post("*/api/v1/events/types/admin", () => HttpResponse.error()));
    act(() => {
      result.current.openCreateModal();
      result.current.form.setName("Offline gala");
    });
    await act(async () => {
      await result.current.onSubmit(event);
    });
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Offline" }));

    server.use(
      http.post("*/api/v1/events/types/admin", () =>
        HttpResponse.json({ message: "Nope" }, { status: 500 }),
      ),
    );
    act(() => {
      result.current.openCreateModal();
      result.current.form.setName("Broken gala");
    });
    await act(async () => {
      await result.current.onSubmit(event);
    });
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Error" }));

    getTokenMock.mockReturnValue(null);
    await act(async () => {
      await result.current.onToggleActive(result.current.list.types[0]!);
    });

    getTokenMock.mockReturnValue("token-1");
    server.use(
      http.patch("*/api/v1/events/types/admin/:id", () =>
        HttpResponse.json({ message: "Nope" }, { status: 500 }),
      ),
    );
    await act(async () => {
      await result.current.onToggleActive(result.current.list.types[0]!);
    });
    server.use(
      http.patch("*/api/v1/events/types/admin/:id", () => HttpResponse.json({ ok: true })),
    );
    const inactive = result.current.list.types.find((t) => t.id === FIXTURE_EVENT_TYPE_ID_2);
    if (inactive) {
      act(() => {
        result.current.startEdit(inactive);
      });
      await act(async () => {
        await result.current.onToggleActive(inactive);
      });
    }

    const deletable = result.current.list.types.find((t) => t.id === FIXTURE_EVENT_TYPE_ID);
    if (deletable) {
      act(() => {
        result.current.startEdit(deletable);
        result.current.openDeleteConfirm(deletable);
      });
      getTokenMock.mockReturnValue(null);
      await act(async () => {
        await result.current.onConfirmDelete();
      });
      getTokenMock.mockReturnValue("token-1");
      server.use(
        http.delete("*/api/v1/events/types/admin/:id", () =>
          HttpResponse.json({ message: "locked" }, { status: 500 }),
        ),
      );
      await act(async () => {
        await result.current.onConfirmDelete();
      });
      server.use(
        http.delete("*/api/v1/events/types/admin/:id", () => HttpResponse.json({ ok: true })),
      );
      await act(async () => {
        await result.current.onConfirmDelete();
      });
    }
  });
});
