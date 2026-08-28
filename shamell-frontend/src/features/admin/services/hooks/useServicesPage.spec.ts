/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import {
  makeAdminServicesApiPayload,
  makeServiceTypesApiPayload,
} from "../test/fixtures/services.fixture";
import { FIXTURE_SERVICE_ID_2 } from "../test/fixtures/uuids.fixture";

const toastMock = vi.fn();
const getTokenMock = vi.fn((): string | null => "token-1");

vi.mock("@/hooks/use-toast", () => ({
  toast: (...args: unknown[]) => toastMock(...args),
}));

vi.mock("../lib/servicesAuth", () => ({
  getServicesBearerToken: () => getTokenMock(),
}));

import { useServicesPage } from "./useServicesPage";

describe("useServicesPage", () => {
  beforeEach(() => {
    toastMock.mockClear();
    getTokenMock.mockReturnValue("token-1");
  });

  it("loads catalog services after mount", async () => {
    const { result } = renderHook(() => useServicesPage());

    await waitFor(() => expect(result.current.catalog.isLoading).toBe(false));
    expect(result.current.catalog.services.length).toBeGreaterThan(0);
  });

  it("openCreateModal sets isModalOpen true", async () => {
    const { result } = renderHook(() => useServicesPage());
    await waitFor(() => expect(result.current.catalog.isLoading).toBe(false));

    act(() => {
      result.current.openCreateModal();
    });

    expect(result.current.isModalOpen).toBe(true);
    expect(result.current.form.editingId).toBeNull();
  });

  it("startEdit opens the modal with editingId set", async () => {
    const { result } = renderHook(() => useServicesPage());
    await waitFor(() => expect(result.current.catalog.services.length).toBeGreaterThan(0));

    const service = result.current.catalog.services[0]!;

    act(() => {
      result.current.startEdit(service);
    });

    expect(result.current.isModalOpen).toBe(true);
    expect(result.current.form.editingId).toBe(service.id);
    expect(result.current.form.description).toBe(service.description);
  });

  it("onToggleActive flips an inactive service via MSW", async () => {
    let services = makeAdminServicesApiPayload();
    server.use(
      http.get("*/api/v1/services/types/admin", () =>
        HttpResponse.json(makeServiceTypesApiPayload()),
      ),
      http.get("*/api/v1/services/admin", () => HttpResponse.json(services)),
      http.patch("*/api/v1/services/admin/:id", async ({ params, request }) => {
        const form = await request.formData();
        const isActive = form.get("isActive") === "true";
        const id = String(params.id);
        services = services.map((row) =>
          row.id === id ? { ...row, isActive } : row,
        );
        return HttpResponse.json({ ok: true });
      }),
    );

    const { result } = renderHook(() => useServicesPage());
    await waitFor(() => expect(result.current.catalog.isLoading).toBe(false));

    const inactive = result.current.catalog.services.find((s) => s.id === FIXTURE_SERVICE_ID_2);
    expect(inactive?.isActive).toBe(false);

    await act(async () => {
      await result.current.onToggleActive(inactive!);
    });

    await waitFor(() => {
      const updated = result.current.catalog.services.find(
        (s) => s.id === FIXTURE_SERVICE_ID_2,
      );
      expect(updated?.isActive).toBe(true);
    });
  });

  it("openDeleteConfirm then onConfirmDelete removes the service", async () => {
    let services = makeAdminServicesApiPayload();
    server.use(
      http.get("*/api/v1/services/types/admin", () =>
        HttpResponse.json(makeServiceTypesApiPayload()),
      ),
      http.get("*/api/v1/services/admin", () => HttpResponse.json(services)),
      http.delete("*/api/v1/services/admin/:id", ({ params }) => {
        const id = String(params.id);
        services = services.filter((row) => row.id !== id);
        return HttpResponse.json({ ok: true });
      }),
    );

    const { result } = renderHook(() => useServicesPage());
    await waitFor(() => expect(result.current.catalog.services.length).toBeGreaterThan(0));

    const target = result.current.catalog.services.find((s) => s.id === FIXTURE_SERVICE_ID_2)!;
    const beforeCount = result.current.catalog.services.length;

    act(() => {
      result.current.openDeleteConfirm(target);
    });
    expect(result.current.pendingDelete?.id).toBe(FIXTURE_SERVICE_ID_2);

    await act(async () => {
      await result.current.onConfirmDelete();
    });

    await waitFor(() => {
      expect(result.current.pendingDelete).toBeNull();
      expect(result.current.catalog.services).toHaveLength(beforeCount - 1);
      expect(
        result.current.catalog.services.find((s) => s.id === FIXTURE_SERVICE_ID_2),
      ).toBeUndefined();
    });
  });

  it("validates, creates, updates, and clears media", async () => {
    const { result } = renderHook(() => useServicesPage());
    await waitFor(() => expect(result.current.catalog.isLoading).toBe(false));
    const event = { preventDefault: vi.fn() } as unknown as React.FormEvent<HTMLFormElement>;

    act(() => {
      result.current.openCreateModal();
      result.current.closeModal();
    });

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
      result.current.form.setDescription("Private luxury show");
      result.current.form.setItemsText("Dancers\nStaging");
      result.current.form.setPriceInput("1500");
      result.current.form.setImage(new File(["x"], "a.jpg", { type: "image/jpeg" }));
    });
    await act(async () => {
      await result.current.onSubmit(event);
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Service created" }),
    );

    const service = result.current.catalog.services[0]!;
    act(() => {
      result.current.startEdit(service);
      result.current.form.setDescription(`${service.description} extra`);
    });
    await act(async () => {
      await result.current.onSubmit(event);
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Service updated" }),
    );

    act(() => {
      result.current.startEdit(service);
      result.current.setPendingClearMedia(true);
    });
    await act(async () => {
      await result.current.onConfirmClearMedia();
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Media removed" }),
    );
    act(() => {
      result.current.closeClearMediaModal();
    });
  });

  it("blocks usage and toasts service errors", async () => {
    const { result } = renderHook(() => useServicesPage());
    await waitFor(() => expect(result.current.catalog.isLoading).toBe(false));
    const event = { preventDefault: vi.fn() } as unknown as React.FormEvent<HTMLFormElement>;

    const blocked = result.current.catalog.services[0]!;
    await act(async () => {
      await result.current.onToggleActive({ ...blocked, isActive: true, bookingCount: 2 });
    });
    act(() => {
      result.current.openDeleteConfirm({ ...blocked, bookingCount: 1 });
    });
    expect(result.current.pendingDelete).toBeNull();
    await act(async () => {
      await result.current.onConfirmDelete();
    });

    getTokenMock.mockReturnValue(null);
    await act(async () => {
      await result.current.onToggleActive(result.current.catalog.services[0]!);
      await result.current.onConfirmClearMedia();
    });
    act(() => {
      result.current.startEdit(result.current.catalog.services[0]!);
    });
    await act(async () => {
      await result.current.onConfirmClearMedia();
    });

    getTokenMock.mockReturnValue("token-1");
    act(() => {
      result.current.startEdit(result.current.catalog.services[0]!);
    });
    await act(async () => {
      await result.current.onToggleActive(result.current.catalog.services[0]!);
    });
    server.use(http.post("*/api/v1/services/admin", () => HttpResponse.error()));
    act(() => {
      result.current.openCreateModal();
      result.current.form.setDescription("Private luxury show");
      result.current.form.setItemsText("Dancers");
      result.current.form.setPriceInput("1500");
      result.current.form.setImage(new File(["x"], "a.jpg", { type: "image/jpeg" }));
    });
    await act(async () => {
      await result.current.onSubmit(event);
    });
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Offline" }));

    server.use(
      http.patch("*/api/v1/services/admin/:id", () =>
        HttpResponse.json({ message: "Nope" }, { status: 500 }),
      ),
    );
    await act(async () => {
      await result.current.onToggleActive(result.current.catalog.services[0]!);
    });
    act(() => {
      result.current.startEdit(result.current.catalog.services[0]!);
    });
    await act(async () => {
      await result.current.onConfirmClearMedia();
    });

    const deletable = result.current.catalog.services.find((s) => s.id === FIXTURE_SERVICE_ID_2)!;
    act(() => {
      result.current.setViewService(deletable);
      result.current.startEdit(deletable);
      result.current.openDeleteConfirm(deletable);
    });
    getTokenMock.mockReturnValue(null);
    await act(async () => {
      await result.current.onConfirmDelete();
    });
    getTokenMock.mockReturnValue("token-1");
    server.use(
      http.delete("*/api/v1/services/admin/:id", () =>
        HttpResponse.json({ message: "Nope" }, { status: 500 }),
      ),
    );
    await act(async () => {
      await result.current.onConfirmDelete();
    });
    server.use(
      http.delete("*/api/v1/services/admin/:id", () => HttpResponse.json({ ok: true })),
    );
    await act(async () => {
      await result.current.onConfirmDelete();
    });
    expect(result.current.viewService).toBeNull();
    act(() => {
      result.current.closeDeleteModal();
    });
  });
});
