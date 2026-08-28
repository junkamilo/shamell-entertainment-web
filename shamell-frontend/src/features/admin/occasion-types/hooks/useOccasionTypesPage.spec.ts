/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import {
  makeOccasionTypeItem,
  makeOccasionTypesApiPayload,
} from "../test/fixtures/occasionTypes.fixture";
import {
  FIXTURE_OCCASION_TYPE_ID,
  FIXTURE_OCCASION_TYPE_ID_2,
} from "../test/fixtures/uuids.fixture";
import { occasionTypesListHandler } from "../test/mocks/handlers";

const toastMock = vi.fn();
const getTokenMock = vi.fn((): string | null => "token-1");

vi.mock("@/hooks/use-toast", () => ({
  toast: (...args: unknown[]) => toastMock(...args),
}));

vi.mock("../lib/occasionTypesAuth", () => ({
  getOccasionTypesBearerToken: () => getTokenMock(),
}));

import { useOccasionTypesPage } from "./useOccasionTypesPage";

describe("useOccasionTypesPage", () => {
  beforeEach(() => {
    toastMock.mockClear();
    getTokenMock.mockReturnValue("token-1");
    server.use(occasionTypesListHandler());
  });

  it("loads list after mount", async () => {
    const { result } = renderHook(() => useOccasionTypesPage());
    await waitFor(() => expect(result.current.list.isLoading).toBe(false));
    expect(result.current.list.rows.length).toBeGreaterThan(0);
  });

  it("openCreateModal opens modal", async () => {
    const { result } = renderHook(() => useOccasionTypesPage());
    await waitFor(() => expect(result.current.list.isLoading).toBe(false));

    act(() => {
      result.current.openCreateModal();
    });

    expect(result.current.isModalOpen).toBe(true);
    expect(result.current.form.editingId).toBeNull();
  });

  it("startEdit opens modal with name", async () => {
    const { result } = renderHook(() => useOccasionTypesPage());
    await waitFor(() => expect(result.current.list.rows.length).toBeGreaterThan(0));

    const item = result.current.list.rows[0]!;
    act(() => {
      result.current.startEdit(item);
    });

    expect(result.current.isModalOpen).toBe(true);
    expect(result.current.form.editingId).toBe(item.id);
    expect(result.current.form.name).toBe(item.name);
  });

  it("onToggleActive flips visibility via MSW", async () => {
    let rows = makeOccasionTypesApiPayload();
    server.use(
      http.get("*/api/v1/events/occasions/admin", () => HttpResponse.json(rows)),
      http.patch("*/api/v1/events/occasions/admin/:id", async ({ params, request }) => {
        const body = (await request.json()) as { isActive?: boolean };
        const id = String(params.id);
        if (typeof body.isActive === "boolean") {
          rows = rows.map((row) =>
            row.id === id ? { ...row, isActive: body.isActive! } : row,
          );
        }
        return HttpResponse.json({ ok: true });
      }),
    );

    const { result } = renderHook(() => useOccasionTypesPage());
    await waitFor(() => expect(result.current.list.isLoading).toBe(false));

    const inactive = result.current.list.rows.find(
      (r) => r.id === FIXTURE_OCCASION_TYPE_ID_2,
    );
    expect(inactive?.isActive).toBe(false);

    await act(async () => {
      await result.current.onToggleActive(inactive!);
    });

    await waitFor(() => {
      expect(
        result.current.list.rows.find((r) => r.id === FIXTURE_OCCASION_TYPE_ID_2)
          ?.isActive,
      ).toBe(true);
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Visible" }),
    );
  });

  it("onSubmit creates when name is valid", async () => {
    const { result } = renderHook(() => useOccasionTypesPage());
    await waitFor(() => expect(result.current.list.isLoading).toBe(false));

    act(() => {
      result.current.openCreateModal();
      result.current.form.setName("Luxury birthday");
    });

    await act(async () => {
      await result.current.onSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent<HTMLFormElement>);
    });

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Created" }),
    );
    expect(result.current.isModalOpen).toBe(false);
  });

  it("openDeleteConfirm then onConfirmDelete removes type", async () => {
    let rows = makeOccasionTypesApiPayload();
    server.use(
      http.get("*/api/v1/events/occasions/admin", () => HttpResponse.json(rows)),
      http.delete("*/api/v1/events/occasions/admin/:id", ({ params }) => {
        rows = rows.filter((row) => row.id !== String(params.id));
        return HttpResponse.json({ ok: true });
      }),
    );

    const { result } = renderHook(() => useOccasionTypesPage());
    await waitFor(() => expect(result.current.list.isLoading).toBe(false));

    const item = result.current.list.rows.find(
      (r) => r.id === FIXTURE_OCCASION_TYPE_ID,
    )!;

    act(() => {
      result.current.openDeleteConfirm(item);
    });
    expect(result.current.pendingDelete?.id).toBe(FIXTURE_OCCASION_TYPE_ID);

    await act(async () => {
      await result.current.onConfirmDelete();
    });

    await waitFor(() => {
      expect(
        result.current.list.rows.find((r) => r.id === FIXTURE_OCCASION_TYPE_ID),
      ).toBeUndefined();
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Type deleted" }),
    );
  });

  it("closes the modal and ignores blocked delete/deactivate", async () => {
    const { result } = renderHook(() => useOccasionTypesPage());
    await waitFor(() => expect(result.current.list.isLoading).toBe(false));
    act(() => {
      result.current.openCreateModal();
      result.current.closeModal();
    });
    expect(result.current.isModalOpen).toBe(false);

    const blocked = makeOccasionTypeItem({ isActive: true, bookingCount: 2 });
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

  it("toasts when submit is unsigned or invalid, then updates", async () => {
    const { result } = renderHook(() => useOccasionTypesPage());
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

    const item = result.current.list.rows[0]!;
    act(() => {
      result.current.startEdit(item);
      result.current.form.setName(`${item.name} deluxe`);
    });
    await act(async () => {
      await result.current.onSubmit(event);
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Updated" }),
    );
  });

  it("toasts offline and api errors from submit, toggle, and delete", async () => {
    const { result } = renderHook(() => useOccasionTypesPage());
    await waitFor(() => expect(result.current.list.isLoading).toBe(false));
    const event = { preventDefault: vi.fn() } as unknown as React.FormEvent<HTMLFormElement>;

    server.use(
      http.post("*/api/v1/events/occasions/admin", () => HttpResponse.error()),
    );
    act(() => {
      result.current.openCreateModal();
      result.current.form.setName("Offline party");
    });
    await act(async () => {
      await result.current.onSubmit(event);
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Offline" }),
    );

    server.use(
      http.post("*/api/v1/events/occasions/admin", () =>
        HttpResponse.json({ message: "Nope" }, { status: 500 }),
      ),
    );
    act(() => {
      result.current.openCreateModal();
      result.current.form.setName("Broken party");
    });
    await act(async () => {
      await result.current.onSubmit(event);
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Error" }),
    );

    getTokenMock.mockReturnValue(null);
    await act(async () => {
      await result.current.onToggleActive(result.current.list.rows[0]!);
    });

    getTokenMock.mockReturnValue("token-1");
    server.use(
      http.patch("*/api/v1/events/occasions/admin/:id", () => HttpResponse.error()),
    );
    await act(async () => {
      await result.current.onToggleActive(
        result.current.list.rows.find((r) => r.id === FIXTURE_OCCASION_TYPE_ID)!,
      );
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Offline" }),
    );

    act(() => {
      result.current.startEdit(
        result.current.list.rows.find((r) => r.id === FIXTURE_OCCASION_TYPE_ID)!,
      );
      result.current.openDeleteConfirm(
        result.current.list.rows.find((r) => r.id === FIXTURE_OCCASION_TYPE_ID)!,
      );
    });
    getTokenMock.mockReturnValue(null);
    await act(async () => {
      await result.current.onConfirmDelete();
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Sign-in required" }),
    );

    getTokenMock.mockReturnValue("token-1");
    server.use(
      http.delete("*/api/v1/events/occasions/admin/:id", () =>
        HttpResponse.json({ message: "locked" }, { status: 500 }),
      ),
    );
    await act(async () => {
      await result.current.onConfirmDelete();
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Error", description: expect.any(String) }),
    );

    server.use(
      http.delete("*/api/v1/events/occasions/admin/:id", () =>
        HttpResponse.json({ ok: true }),
      ),
    );
    await act(async () => {
      await result.current.onConfirmDelete();
    });
    expect(result.current.isModalOpen).toBe(false);
  });

  it("hides an active type", async () => {
    const { result } = renderHook(() => useOccasionTypesPage());
    await waitFor(() => expect(result.current.list.isLoading).toBe(false));
    const active = result.current.list.rows.find(
      (r) => r.id === FIXTURE_OCCASION_TYPE_ID,
    )!;
    await act(async () => {
      await result.current.onToggleActive(active);
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Hidden" }),
    );
  });
});
