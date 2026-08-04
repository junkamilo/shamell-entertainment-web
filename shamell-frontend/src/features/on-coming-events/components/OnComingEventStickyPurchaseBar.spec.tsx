/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createStickyPurchaseBarProps,
} from "../test/helpers/mockOnComingEventsPage";
import { renderWithProviders } from "../test/utils/renderWithProviders";

const pushMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/hooks/use-media-query", () => ({
  useMediaQuery: () => true,
}));

import { OnComingEventStickyPurchaseBar } from "./OnComingEventStickyPurchaseBar";

describe("OnComingEventStickyPurchaseBar", () => {
  it("renders month package purchase button", async () => {
    const props = createStickyPurchaseBarProps();
    renderWithProviders(<OnComingEventStickyPurchaseBar {...props} />);
    const button = screen.getByRole("button", { name: /august package/i });
    expect(button).toBeEnabled();
    await userEvent.click(button);
    expect(props.onBuyMonthPackage).toHaveBeenCalled();
  });

  it("navigates to seats for venue seating mode", async () => {
    const props = createStickyPurchaseBarProps({
      purchaseMode: "venue_seating",
      showMonthPackage: false,
    });
    renderWithProviders(<OnComingEventStickyPurchaseBar {...props} />);
    await userEvent.click(screen.getByRole("button", { name: /choose your seat/i }));
    expect(pushMock).toHaveBeenCalled();
  });
});
