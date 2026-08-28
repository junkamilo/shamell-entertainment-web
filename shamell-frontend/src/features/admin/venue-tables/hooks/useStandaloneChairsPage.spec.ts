/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import {
  FIXTURE_CHAIR_ID,
  FIXTURE_CHAIR_ID_2,
} from "../test/fixtures/uuids.fixture";
import {
  makeStandaloneChairConfig,
  makeStandaloneChairItem,
} from "../test/fixtures/venueTables.fixture";

const toastMock = vi.fn();
const getTokenMock = vi.fn((): string | null => "token-1");
const openWarningMock = vi.fn();

vi.mock("@/hooks/use-toast", () => ({
  toast: (...args: unknown[]) => toastMock(...args),
}));

vi.mock("@/lib/admin/auth", () => ({
  getAdminBearerToken: () => getTokenMock(),
}));

vi.mock("@/components/admin/overlays", () => ({
  useBlockedActionWarning: () => ({
    isOpen: false,
    title: "",
    description: "",
    openWarning: openWarningMock,
    closeWarning: vi.fn(),
  }),
}));

import { useStandaloneChairsPage } from "./useStandaloneChairsPage";

const defaultOptions = {
  addModalOpen: false,
  onAddModalOpenChange: vi.fn(),
};

describe("useStandaloneChairsPage", () => {
  beforeEach(() => {
    toastMock.mockClear();
    openWarningMock.mockClear();
    getTokenMock.mockReturnValue("token-1");
  });

  it("loads chairs and paginates", async () => {
    const { result } = renderHook(() => useStandaloneChairsPage(defaultOptions));
    await waitFor(() => expect(result.current.config.loading).toBe(false));
    expect(result.current.config.chairs.length).toBe(2);
    expect(result.current.pagedChairs.length).toBe(2);
    expect(result.current.paginationMeta.totalItems).toBe(2);
  });

  it("opens edit modal for editable chair", async () => {
    const { result } = renderHook(() => useStandaloneChairsPage(defaultOptions));
    await waitFor(() => expect(result.current.config.loading).toBe(false));

    const editable = result.current.config.chairs.find(
      (c) => c.id === FIXTURE_CHAIR_ID,
    )!;

    act(() => {
      result.current.openEditChair(editable);
    });

    expect(result.current.editChair?.id).toBe(FIXTURE_CHAIR_ID);
    expect(result.current.editPriceInput).toBe("35");
  });

  it("blocks edit for reserved chair", async () => {
    const { result } = renderHook(() => useStandaloneChairsPage(defaultOptions));
    await waitFor(() => expect(result.current.config.loading).toBe(false));

    const reserved = result.current.config.chairs.find(
      (c) => c.id === FIXTURE_CHAIR_ID_2,
    )!;

    act(() => {
      result.current.openEditChair(reserved);
    });

    expect(openWarningMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Cannot edit price" }),
    );
    expect(result.current.editChair).toBeNull();
  });

  it("confirmEditChair updates price via MSW", async () => {
    const { result } = renderHook(() => useStandaloneChairsPage(defaultOptions));
    await waitFor(() => expect(result.current.config.loading).toBe(false));

    const editable = result.current.config.chairs.find(
      (c) => c.id === FIXTURE_CHAIR_ID,
    )!;

    act(() => {
      result.current.openEditChair(editable);
      result.current.setEditPriceInput("45");
    });

    await act(async () => {
      await result.current.confirmEditChair();
    });

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Price updated" }),
    );
    expect(result.current.editChair).toBeNull();
  });

  it("confirmDeleteChair deletes via MSW", async () => {
    const { result } = renderHook(() => useStandaloneChairsPage(defaultOptions));
    await waitFor(() => expect(result.current.config.loading).toBe(false));

    const editable = result.current.config.chairs.find(
      (c) => c.id === FIXTURE_CHAIR_ID,
    )!;

    act(() => {
      result.current.openDeleteChair(editable);
    });
    expect(result.current.deleteChair?.id).toBe(FIXTURE_CHAIR_ID);

    await act(async () => {
      await result.current.confirmDeleteChair();
    });

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Chair deleted" }),
    );
  });

  it("blocks bulk edit when chairs are reserved", async () => {
    const { result } = renderHook(() => useStandaloneChairsPage(defaultOptions));
    await waitFor(() => expect(result.current.config.loading).toBe(false));

    act(() => {
      result.current.openBulkEdit();
    });

    expect(openWarningMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Cannot edit all prices" }),
    );
    expect(result.current.bulkEditOpen).toBe(false);
  });

  it("confirmBulkEdit rejects invalid price", async () => {
    server.use(
      http.get("*/api/v1/standalone-chairs/admin", () =>
        HttpResponse.json(
          makeStandaloneChairConfig({
            reservedCount: 0,
            chairs: [makeStandaloneChairItem()],
          }),
        ),
      ),
    );

    const { result } = renderHook(() => useStandaloneChairsPage(defaultOptions));
    await waitFor(() => expect(result.current.config.loading).toBe(false));

    act(() => {
      result.current.openBulkEdit();
      result.current.setBulkPriceInput("abc");
    });

    await act(async () => {
      await result.current.confirmBulkEdit();
    });

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Enter a valid price" }),
    );
  });

  it("opens bulk edit with a blank price and no-ops delete-all on empty inventory", async () => {
    server.use(
      http.get("*/api/v1/standalone-chairs/admin", () =>
        HttpResponse.json(
          makeStandaloneChairConfig({
            reservedCount: 0,
            unitPrice: 0,
            chairs: [makeStandaloneChairItem()],
          }),
        ),
      ),
    );
    const { result, rerender } = renderHook(() => useStandaloneChairsPage(defaultOptions));
    await waitFor(() => expect(result.current.config.loading).toBe(false));
    act(() => {
      result.current.openBulkEdit();
    });
    expect(result.current.bulkPriceInput).toBe("");
    expect(result.current.bulkEditOpen).toBe(true);

    server.use(
      http.get("*/api/v1/standalone-chairs/admin", () =>
        HttpResponse.json(
          makeStandaloneChairConfig({ reservedCount: 0, chairs: [] }),
        ),
      ),
    );
    await act(async () => {
      await result.current.config.reload();
    });
    rerender();
    act(() => {
      result.current.openDeleteAll();
    });
    expect(result.current.deleteAllOpen).toBe(false);
  });

  it("paginates, blocks delete, and saves bulk prices", async () => {
    server.use(
      http.get("*/api/v1/standalone-chairs/admin", () =>
        HttpResponse.json(
          makeStandaloneChairConfig({
            reservedCount: 0,
            chairs: [
              makeStandaloneChairItem(),
              makeStandaloneChairItem({ id: FIXTURE_CHAIR_ID_2, canDelete: true, canEditPrice: true }),
            ],
          }),
        ),
      ),
    );
    const { result } = renderHook(() => useStandaloneChairsPage(defaultOptions));
    await waitFor(() => expect(result.current.config.loading).toBe(false));

    act(() => {
      result.current.setPerPage(1);
      result.current.setPage(9);
    });
    await waitFor(() => expect(result.current.paginationMeta.page).toBe(2));

    act(() => {
      result.current.openBulkEdit();
      result.current.setBulkPriceInput("40");
    });
    await act(async () => {
      await result.current.confirmBulkEdit();
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "All prices updated" }),
    );

    act(() => {
      result.current.openDeleteAll();
    });
    expect(result.current.deleteAllOpen).toBe(true);
    await act(async () => {
      await result.current.confirmDeleteAll();
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "All chairs deleted" }),
    );
  });

  it("blocks delete-all when reserved and no-ops empty confirms", async () => {
    const { result } = renderHook(() => useStandaloneChairsPage(defaultOptions));
    await waitFor(() => expect(result.current.config.loading).toBe(false));

    act(() => {
      result.current.openDeleteAll();
    });
    expect(openWarningMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Cannot delete all chairs" }),
    );

    const reserved = result.current.config.chairs.find((c) => c.id === FIXTURE_CHAIR_ID_2)!;
    act(() => {
      result.current.openDeleteChair(reserved);
    });
    expect(openWarningMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Cannot delete chair" }),
    );

    await act(async () => {
      await result.current.confirmEditChair();
      await result.current.confirmDeleteChair();
    });
  });

  it("toasts API failures and missing tokens", async () => {
    server.use(
      http.get("*/api/v1/standalone-chairs/admin", () =>
        HttpResponse.json(
          makeStandaloneChairConfig({
            reservedCount: 0,
            chairs: [makeStandaloneChairItem()],
          }),
        ),
      ),
    );
    const { result } = renderHook(() => useStandaloneChairsPage(defaultOptions));
    await waitFor(() => expect(result.current.config.loading).toBe(false));

    act(() => {
      result.current.openEditChair(result.current.config.chairs[0]!);
      result.current.setEditPriceInput("abc");
    });
    await act(async () => {
      await result.current.confirmEditChair();
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Enter a valid price" }),
    );

    act(() => {
      result.current.openBulkEdit();
      result.current.setBulkPriceInput("40");
    });
    getTokenMock.mockReturnValue(null);
    await act(async () => {
      await result.current.confirmBulkEdit();
    });
    getTokenMock.mockReturnValue("token-1");

    getTokenMock.mockReturnValue("token-1");
    server.use(
      http.patch("*/api/v1/standalone-chairs/admin/:id", () =>
        HttpResponse.json({ message: "Nope" }, { status: 500 }),
      ),
      http.patch("*/api/v1/standalone-chairs/admin/bulk-price", () =>
        HttpResponse.json({ message: "Nope" }, { status: 500 }),
      ),
      http.delete("*/api/v1/standalone-chairs/admin/:id", () =>
        HttpResponse.json({ message: "Nope" }, { status: 500 }),
      ),
      http.delete("*/api/v1/standalone-chairs/admin/all", () =>
        HttpResponse.json({ message: "Nope" }, { status: 500 }),
      ),
    );
    act(() => {
      result.current.setEditPriceInput("45");
    });
    await act(async () => {
      await result.current.confirmEditChair();
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Could not update price" }),
    );

    act(() => {
      result.current.openBulkEdit();
      result.current.setBulkPriceInput("40");
    });
    await act(async () => {
      await result.current.confirmBulkEdit();
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Could not update prices" }),
    );

    act(() => {
      result.current.openDeleteChair(result.current.config.chairs[0]!);
    });
    getTokenMock.mockReturnValue(null);
    await act(async () => {
      await result.current.confirmDeleteChair();
    });
    getTokenMock.mockReturnValue("token-1");
    await act(async () => {
      await result.current.confirmDeleteChair();
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Could not delete chair" }),
    );

    await act(async () => {
      await result.current.confirmDeleteAll();
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Could not delete all chairs" }),
    );
  });
});
