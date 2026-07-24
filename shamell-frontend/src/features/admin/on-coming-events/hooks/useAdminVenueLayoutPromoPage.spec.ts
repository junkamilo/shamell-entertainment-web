/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { makeVenueLayoutSettings } from "../test/fixtures/onComingEvents.fixture";
import { FIXTURE_SETTINGS_ID } from "../test/fixtures/uuids.fixture";

const toastMock = vi.fn();
const getTokenMock = vi.fn((): string | null => "token-1");
const notifySettingsChangedMock = vi.fn();

vi.mock("@/hooks/use-toast", () => ({
  toast: (...args: unknown[]) => toastMock(...args),
}));

vi.mock("@/app/admin/shared/lib/adminAuth", () => ({
  getAdminBearerToken: () => getTokenMock(),
}));

vi.mock("@/lib/onComingEventsSettingsEvents", () => ({
  notifyOnComingEventsSettingsChanged: () => notifySettingsChangedMock(),
}));

import { useAdminVenueLayoutPromoPage } from "./useAdminVenueLayoutPromoPage";

describe("useAdminVenueLayoutPromoPage", () => {
  beforeEach(() => {
    toastMock.mockClear();
    notifySettingsChangedMock.mockClear();
    getTokenMock.mockReturnValue("token-1");
  });

  it("loads settings after mount", async () => {
    const { result } = renderHook(() => useAdminVenueLayoutPromoPage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.settings?.id).toBe(FIXTURE_SETTINGS_ID);
  });

  it("openModal syncs form fields from settings", async () => {
    const { result } = renderHook(() => useAdminVenueLayoutPromoPage());
    await waitFor(() => expect(result.current.settings).not.toBeNull());

    act(() => {
      result.current.openModal();
    });

    expect(result.current.isModalOpen).toBe(true);
    expect(result.current.promoTitle).toBe("On Coming Events");
    expect(result.current.promoDescription).toBe("Reserve seats for our next night.");
  });

  it("toggleClientEnabled flips publish state via MSW", async () => {
    let enabled = true;
    server.use(
      http.get("*/api/v1/on-coming-events/settings/admin", () =>
        HttpResponse.json({
          settings: makeVenueLayoutSettings({ clientEnabled: enabled }),
        }),
      ),
      http.patch("*/api/v1/on-coming-events/settings/admin/enabled", async ({ request }) => {
        const body = (await request.json()) as { clientEnabled?: boolean };
        enabled = Boolean(body.clientEnabled);
        return HttpResponse.json({
          settings: makeVenueLayoutSettings({ clientEnabled: enabled }),
          message: enabled ? "Published." : "Hidden.",
        });
      }),
    );

    const { result } = renderHook(() => useAdminVenueLayoutPromoPage());
    await waitFor(() => expect(result.current.settings?.clientEnabled).toBe(true));

    await act(async () => {
      await result.current.toggleClientEnabled();
    });

    await waitFor(() => expect(result.current.settings?.clientEnabled).toBe(false));
    expect(notifySettingsChangedMock).toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "On Coming Events hidden" }),
    );
  });

  it("onSubmit rejects empty title or description", async () => {
    const { result } = renderHook(() => useAdminVenueLayoutPromoPage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.openModal();
      result.current.setPromoTitle("   ");
      result.current.setPromoDescription("");
    });

    await act(async () => {
      await result.current.onSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent<HTMLFormElement>);
    });

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Check the form",
        description: "Title and description are required.",
      }),
    );
    expect(result.current.isModalOpen).toBe(true);
  });

  it("onSubmit saves valid promo fields and closes modal", async () => {
    const { result } = renderHook(() => useAdminVenueLayoutPromoPage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.openModal();
      result.current.setPromoTitle("Summer Gala");
      result.current.setPromoDescription("Reserve your table tonight.");
    });

    await act(async () => {
      await result.current.onSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent<HTMLFormElement>);
    });

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Home section saved" }),
    );
    expect(result.current.isModalOpen).toBe(false);
    expect(notifySettingsChangedMock).toHaveBeenCalled();
  });
});
