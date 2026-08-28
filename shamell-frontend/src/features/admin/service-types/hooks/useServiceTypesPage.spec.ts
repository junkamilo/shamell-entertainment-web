/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { makeServiceTypeItem, makeServiceTypesApiPayload } from "../test/fixtures/serviceTypes.fixture";
import {
  FIXTURE_SERVICE_TYPE_ID,
  FIXTURE_SERVICE_TYPE_ID_2,
} from "../test/fixtures/uuids.fixture";
import { serviceTypesListHandler } from "../test/mocks/handlers";

const toastMock = vi.fn();
const getTokenMock = vi.fn((): string | null => "token-1");

vi.mock("@/hooks/use-toast", () => ({
  toast: (...args: unknown[]) => toastMock(...args),
}));

vi.mock("../lib/serviceTypesAuth", () => ({
  getServiceTypesBearerToken: () => getTokenMock(),
}));

import { useServiceTypesPage } from "./useServiceTypesPage";

describe("useServiceTypesPage", () => {
  beforeEach(() => {
    toastMock.mockClear();
    getTokenMock.mockReturnValue("token-1");
    server.use(serviceTypesListHandler());
  });

  it("loads list after mount", async () => {
    const { result } = renderHook(() => useServiceTypesPage());
    await waitFor(() => expect(result.current.list.isLoading).toBe(false));
    expect(result.current.list.types.length).toBeGreaterThan(0);
  });

  it("openCreateModal opens modal", async () => {
    const { result } = renderHook(() => useServiceTypesPage());
    await waitFor(() => expect(result.current.list.isLoading).toBe(false));

    act(() => {
      result.current.openCreateModal();
    });

    expect(result.current.isModalOpen).toBe(true);
    expect(result.current.form.editingId).toBeNull();
  });

  it("startEdit opens modal with name", async () => {
    const { result } = renderHook(() => useServiceTypesPage());
    await waitFor(() =>
      expect(result.current.list.types.length).toBeGreaterThan(0),
    );

    const item = result.current.list.types[0]!;
    act(() => {
      result.current.startEdit(item);
    });

    expect(result.current.isModalOpen).toBe(true);
    expect(result.current.form.editingId).toBe(item.id);
    expect(result.current.form.name).toBe(item.name);
  });

  it("onToggleActive flips visibility via MSW", async () => {
    let rows = makeServiceTypesApiPayload();
    server.use(
      http.get("*/api/v1/services/types/admin", () => HttpResponse.json(rows)),
      http.patch(
        "*/api/v1/services/types/admin/:id",
        async ({ params, request }) => {
          const body = (await request.json()) as { isActive?: boolean };
          const id = String(params.id);
          if (typeof body.isActive === "boolean") {
            rows = rows.map((row) =>
              row.id === id ? { ...row, isActive: body.isActive! } : row,
            );
          }
          return HttpResponse.json({ ok: true });
        },
      ),
    );

    const { result } = renderHook(() => useServiceTypesPage());
    await waitFor(() => expect(result.current.list.isLoading).toBe(false));

    const inactive = result.current.list.types.find(
      (r) => r.id === FIXTURE_SERVICE_TYPE_ID_2,
    );
    expect(inactive?.isActive).toBe(false);

    await act(async () => {
      await result.current.onToggleActive(inactive!);
    });

    await waitFor(() => {
      expect(
        result.current.list.types.find((r) => r.id === FIXTURE_SERVICE_TYPE_ID_2)
          ?.isActive,
      ).toBe(true);
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Type visible" }),
    );
  });

  it("onSubmit creates when name is valid", async () => {
    const { result } = renderHook(() => useServiceTypesPage());
    await waitFor(() => expect(result.current.list.isLoading).toBe(false));

    act(() => {
      result.current.openCreateModal();
      result.current.form.setName("Weddings");
    });

    await act(async () => {
      await result.current.onSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent<HTMLFormElement>);
    });

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Type created" }),
    );
    expect(result.current.isModalOpen).toBe(false);
  });

  it("openDeleteConfirm then onConfirmDelete removes type", async () => {
    let rows = makeServiceTypesApiPayload();
    server.use(
      http.get("*/api/v1/services/types/admin", () => HttpResponse.json(rows)),
      http.delete("*/api/v1/services/types/admin/:id", ({ params }) => {
        rows = rows.filter((row) => row.id !== String(params.id));
        return HttpResponse.json({ ok: true });
      }),
    );

    const { result } = renderHook(() => useServiceTypesPage());
    await waitFor(() => expect(result.current.list.isLoading).toBe(false));

    const item = result.current.list.types.find(
      (r) => r.id === FIXTURE_SERVICE_TYPE_ID,
    )!;

    act(() => {
      result.current.openDeleteConfirm(item);
    });
    expect(result.current.pendingDelete?.id).toBe(FIXTURE_SERVICE_TYPE_ID);

    await act(async () => {
      await result.current.onConfirmDelete();
    });

    await waitFor(() => {
      expect(
        result.current.list.types.find((r) => r.id === FIXTURE_SERVICE_TYPE_ID),
      ).toBeUndefined();
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Type deleted" }),
    );
  });

  it("closes the modal and ignores blocked delete/deactivate", async () => {
    const { result } = renderHook(() => useServiceTypesPage());
    await waitFor(() => expect(result.current.list.isLoading).toBe(false));
    act(() => {
      result.current.openCreateModal();
      result.current.closeModal();
    });
    expect(result.current.isModalOpen).toBe(false);
    const blocked = makeServiceTypeItem({ isActive: true, serviceCount: 2 });
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

  it("toasts unsigned/invalid submit then updates and hides", async () => {
    const { result } = renderHook(() => useServiceTypesPage());
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

    const item = result.current.list.types[0]!;
    act(() => {
      result.current.startEdit(item);
      result.current.form.setName(`${item.name} plus`);
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

  it("toasts errors and resets the form when activating the edited row", async () => {
    const { result } = renderHook(() => useServiceTypesPage());
    await waitFor(() => expect(result.current.list.isLoading).toBe(false));
    const event = { preventDefault: vi.fn() } as unknown as React.FormEvent<HTMLFormElement>;

    server.use(http.post("*/api/v1/services/types/admin", () => HttpResponse.error()));
    act(() => {
      result.current.openCreateModal();
      result.current.form.setName("Offline type");
    });
    await act(async () => {
      await result.current.onSubmit(event);
    });
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Offline" }));

    server.use(
      http.post("*/api/v1/services/types/admin", () =>
        HttpResponse.json({ message: "Nope" }, { status: 500 }),
      ),
    );
    act(() => {
      result.current.openCreateModal();
      result.current.form.setName("Broken type");
    });
    await act(async () => {
      await result.current.onSubmit(event);
    });
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Error" }));

    getTokenMock.mockReturnValue(null);
    await act(async () => {
      await result.current.onToggleActive(result.current.list.types[0]!);
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Sign-in required" }),
    );

    getTokenMock.mockReturnValue("token-1");
    server.use(
      http.patch("*/api/v1/services/types/admin/:id", () =>
        HttpResponse.json({ message: "Nope" }, { status: 500 }),
      ),
    );
    await act(async () => {
      await result.current.onToggleActive(result.current.list.types[0]!);
    });
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Error" }));

    server.use(
      http.patch("*/api/v1/services/types/admin/:id", () => HttpResponse.json({ ok: true })),
    );
    const inactive = result.current.list.types.find((r) => r.id === FIXTURE_SERVICE_TYPE_ID_2)!;
    act(() => {
      result.current.startEdit(inactive);
    });
    await act(async () => {
      await result.current.onToggleActive(inactive);
    });

    act(() => {
      result.current.startEdit(result.current.list.types[0]!);
      result.current.openDeleteConfirm(result.current.list.types[0]!);
    });
    getTokenMock.mockReturnValue(null);
    await act(async () => {
      await result.current.onConfirmDelete();
    });
    getTokenMock.mockReturnValue("token-1");
    server.use(
      http.delete("*/api/v1/services/types/admin/:id", () =>
        HttpResponse.json({ message: "locked" }, { status: 500 }),
      ),
    );
    await act(async () => {
      await result.current.onConfirmDelete();
    });
    server.use(
      http.delete("*/api/v1/services/types/admin/:id", () => HttpResponse.json({ ok: true })),
    );
    await act(async () => {
      await result.current.onConfirmDelete();
    });
    expect(result.current.isModalOpen).toBe(false);
  });
});
