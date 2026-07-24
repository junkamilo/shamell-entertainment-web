/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMockVenueReservationsPageState } from "../test/helpers/mockVenueReservationsPage";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import { FIXTURE_LAYOUT_ITEM_ID } from "../test/fixtures/uuids.fixture";

const usePageMock = vi.fn(() => createMockVenueReservationsPageState());

vi.mock("../hooks/useAdminVenueReservationsPage", () => ({
  useAdminVenueReservationsPage: () => usePageMock(),
}));

vi.mock("@/components/admin/inputs", () => ({
  AccordionSingleSelect: ({
    ariaLabel,
    value,
    onChange,
    options,
  }: {
    ariaLabel: string;
    value: string;
    onChange: (next: string) => void;
    options: { id: string; label: string }[];
  }) => (
    <select
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => (
        <option key={o.id || "all"} value={o.id}>
          {o.label}
        </option>
      ))}
    </select>
  ),
}));

vi.mock("@/components/admin/layout", () => ({
  ModuleHero: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

vi.mock("@/components/admin/data-display", () => ({
  Pagination: () => <div data-testid="pagination" />,
}));

import { VenueReservationsAdminPage } from "./VenueReservationsAdminPage";

describe("VenueReservationsAdminPage", () => {
  it("renders hero, filters, and reservation rows", () => {
    usePageMock.mockReturnValue(createMockVenueReservationsPageState());
    renderWithProviders(<VenueReservationsAdminPage />);

    expect(screen.getByRole("heading", { name: "Seat reservations" })).toBeInTheDocument();
    expect(
      screen.getByLabelText("Filter by reservation status"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Filter by payment channel"),
    ).toBeInTheDocument();
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("Grace Hopper")).toBeInTheDocument();
    expect(screen.getByText("Large")).toBeInTheDocument();
    expect(screen.getByText("Chair")).toBeInTheDocument();
    expect(screen.getByTestId("pagination")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    usePageMock.mockReturnValue(
      createMockVenueReservationsPageState({ isLoading: true }),
    );
    renderWithProviders(<VenueReservationsAdminPage />);
    expect(screen.getByText("Loading reservations…")).toBeInTheDocument();
  });

  it("shows empty state when there are no items", () => {
    usePageMock.mockReturnValue(
      createMockVenueReservationsPageState({
        reservations: [],
        paginationMeta: {
          page: 1,
          perPage: 10,
          totalItems: 0,
          totalPages: 1,
          hasPrev: false,
          hasNext: false,
        },
      }),
    );
    renderWithProviders(<VenueReservationsAdminPage />);
    expect(screen.getByText("No reservations found.")).toBeInTheDocument();
  });

  it("calls reload when Refresh is clicked", async () => {
    const user = userEvent.setup();
    const state = createMockVenueReservationsPageState();
    usePageMock.mockReturnValue(state);
    renderWithProviders(<VenueReservationsAdminPage />);

    await user.click(screen.getByRole("button", { name: /refresh/i }));
    expect(state.reload).toHaveBeenCalled();
  });

  it("cancels a paid reservation", async () => {
    const user = userEvent.setup();
    const state = createMockVenueReservationsPageState();
    usePageMock.mockReturnValue(state);
    renderWithProviders(<VenueReservationsAdminPage />);

    const cancelButtons = screen.getAllByRole("button", { name: /^cancel$/i });
    await user.click(cancelButtons[0]!);
    expect(state.cancelReservation).toHaveBeenCalled();
  });

  it("shows layout item filter chip and clears it", async () => {
    const user = userEvent.setup();
    const state = createMockVenueReservationsPageState({
      layoutItemIdFilter: FIXTURE_LAYOUT_ITEM_ID,
    });
    usePageMock.mockReturnValue(state);
    renderWithProviders(<VenueReservationsAdminPage />);

    expect(
      screen.getByText(`Item filter: ${FIXTURE_LAYOUT_ITEM_ID}`),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /clear/i }));
    expect(state.setLayoutItemIdFilter).toHaveBeenCalledWith("");
  });
});
