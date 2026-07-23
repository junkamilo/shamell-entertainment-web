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
});
