/** @vitest-environment jsdom */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../test/utils/renderWithProviders";

const toastMock = vi.fn();
const getTokenMock = vi.fn((): string | null => "token-1");

vi.mock("@/hooks/use-toast", () => ({
  toast: (...args: unknown[]) => toastMock(...args),
}));

vi.mock("@/app/admin/shared/lib/adminAuth", () => ({
  getAdminBearerToken: () => getTokenMock(),
}));

vi.mock("@/lib/onComingEventsSettingsEvents", () => ({
  notifyOnComingEventsSettingsChanged: vi.fn(),
}));

vi.mock("@/features/admin/on-coming-events/services/fetchAdminVenueLayoutSettings", () => ({
  fetchAdminVenueLayoutSettings: vi.fn(async () => ({
    ok: true,
    settings: { clientEnabled: false },
  })),
}));

vi.mock("@/features/admin/on-coming-events/services/patchAdminVenueLayoutEnabled", () => ({
  patchAdminVenueLayoutEnabled: vi.fn(async (_token: string, enabled: boolean) => ({
    ok: true,
    settings: { clientEnabled: enabled },
  })),
}));

import FloorLayoutPublishToggle from "./FloorLayoutPublishToggle";

describe("FloorLayoutPublishToggle", () => {
  beforeEach(() => {
    toastMock.mockClear();
    getTokenMock.mockReturnValue("token-1");
  });

  it("loads publish state and renders toggle", async () => {
    renderWithProviders(<FloorLayoutPublishToggle />);
    await waitFor(() => expect(screen.getByText(/Hidden/i)).toBeInTheDocument());
    expect(screen.getByRole("link", { name: /Configure promo/i })).toHaveAttribute(
      "href",
      "/admin/on-coming-events",
    );
  });

  it("toggles publish state on click", async () => {
    const user = userEvent.setup();
    renderWithProviders(<FloorLayoutPublishToggle />);
    await waitFor(() => expect(screen.getByRole("switch")).toBeEnabled());
    await user.click(screen.getByRole("switch"));
    await waitFor(() => expect(screen.getByText(/Published/i)).toBeInTheDocument());
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Live on client site" }),
    );
  });
});
