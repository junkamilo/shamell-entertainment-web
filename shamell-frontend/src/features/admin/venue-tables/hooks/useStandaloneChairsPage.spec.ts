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

vi.mock("@/app/admin/shared/lib/adminAuth", () => ({
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
});
