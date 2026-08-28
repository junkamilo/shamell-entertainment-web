/** @vitest-environment jsdom */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMockPeticionesPageState } from "../test/helpers/mockPeticionesPage";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import { FIXTURE_CONTACT_ID } from "../test/fixtures/uuids.fixture";

let pageState = createMockPeticionesPageState();

vi.mock("../hooks/usePeticionesPage", () => ({
  usePeticionesPage: () => pageState,
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("./PeticionesLaneTabs", () => ({
  default: ({
    onLaneChange,
  }: {
    onLaneChange: (lane: string) => void;
  }) => (
    <div data-testid="lane-tabs">
      <button type="button" onClick={() => onLaneChange("guidance")}>
        stub-lane-guidance
      </button>
    </div>
  ),
}));

vi.mock("./PeticionesStatsBar", () => ({
  default: ({ onRefresh }: { onRefresh: () => void }) => (
    <div data-testid="stats-bar">
      <button type="button" onClick={onRefresh}>
        stub-refresh
      </button>
    </div>
  ),
}));

vi.mock("./PeticionesRequestCard", () => ({
  default: ({
    row,
    onToggle,
    onCancel,
    onRemove,
    onReserveFromContact,
    onCancelBooking,
    onRemoveBooking,
    onSendBookingQuote,
    onSendBalanceLink,
  }: {
    row: { id: string };
    onToggle: () => void;
    onCancel: () => void;
    onRemove: () => void;
    onReserveFromContact: () => void;
    onCancelBooking: () => void;
    onRemoveBooking: () => void;
    onSendBookingQuote: () => void;
    onSendBalanceLink: () => void;
  }) => (
    <div data-testid="request-card">
      <button type="button" onClick={onToggle}>
        toggle-{row.id}
      </button>
      <button type="button" onClick={onCancel}>
        cancel-{row.id}
      </button>
      <button type="button" onClick={onRemove}>
        remove-{row.id}
      </button>
      <button type="button" onClick={onReserveFromContact}>
        reserve-{row.id}
      </button>
      <button type="button" onClick={onCancelBooking}>
        cancel-booking-{row.id}
      </button>
      <button type="button" onClick={onRemoveBooking}>
        remove-booking-{row.id}
      </button>
      <button type="button" onClick={onSendBookingQuote}>
        quote-{row.id}
      </button>
      <button type="button" onClick={onSendBalanceLink}>
        balance-{row.id}
      </button>
    </div>
  ),
}));

vi.mock("./PeticionesDeleteModal", () => ({
  default: ({
    confirmDelete,
    onConfirm,
    onClose,
    onPurgeLinkedChange,
  }: {
    confirmDelete: { title: string } | null;
    onConfirm: () => void;
    onClose: () => void;
    onPurgeLinkedChange: (value: boolean) => void;
  }) =>
    confirmDelete ? (
      <div data-testid="delete-modal">
        <button type="button" onClick={onConfirm}>
          stub-confirm-delete
        </button>
        <button type="button" onClick={onClose}>
          stub-close-delete
        </button>
        <button type="button" onClick={() => onPurgeLinkedChange(false)}>
          stub-purge
        </button>
      </div>
    ) : null,
}));

vi.mock("@/components/admin/data-display", () => ({
  Pagination: ({
    onPageChange,
    onPerPageChange,
  }: {
    onPageChange: (page: number) => void;
    onPerPageChange: (perPage: number) => void;
  }) => (
    <div data-testid="pagination">
      <button type="button" onClick={() => onPageChange(2)}>
        stub-page
      </button>
      <button type="button" onClick={() => onPerPageChange(25)}>
        stub-per-page
      </button>
    </div>
  ),
}));

import PeticionesPageContent from "./PeticionesPageContent";

const emptyInbox = {
  rows: [],
  meta: {
    page: 1,
    perPage: 10,
    totalItems: 0,
    totalPages: 1,
    hasPrev: false,
    hasNext: false,
  },
  isLoading: false,
  error: null,
  reload: vi.fn(),
};

describe("PeticionesPageContent", () => {
  beforeEach(() => {
    pageState = createMockPeticionesPageState();
  });

  it("renders back link, hero, tabs, stats, and cards", () => {
    renderWithProviders(<PeticionesPageContent />);
    expect(screen.getByRole("link", { name: /back/i })).toHaveAttribute(
      "href",
      "/admin/agenda",
    );
    expect(screen.getByRole("heading", { name: /inbox/i })).toBeInTheDocument();
    expect(screen.getByTestId("lane-tabs")).toBeInTheDocument();
    expect(screen.getByTestId("stats-bar")).toBeInTheDocument();
    expect(screen.getAllByTestId("request-card")).toHaveLength(2);
    expect(screen.getByTestId("pagination")).toBeInTheDocument();
  });

  it("shows loading and empty states", () => {
    pageState = createMockPeticionesPageState({
      inbox: { ...emptyInbox, isLoading: true, reload: vi.fn() },
    });
    const { rerender } = renderWithProviders(<PeticionesPageContent />);
    expect(screen.getByText(/Loading/)).toBeInTheDocument();

    pageState = createMockPeticionesPageState({
      activeLane: "guidance",
      inbox: { ...emptyInbox, reload: vi.fn() },
    });
    rerender(<PeticionesPageContent />);
    expect(
      screen.getByText(/No concierge guidance requests/),
    ).toBeInTheDocument();
  });

  it("shows empty copy for private classes and bookings", () => {
    pageState = createMockPeticionesPageState({
      activeLane: "private_classes",
      inbox: { ...emptyInbox, reload: vi.fn() },
    });
    const { rerender } = renderWithProviders(<PeticionesPageContent />);
    expect(screen.getByText(/No private class bookings/)).toBeInTheDocument();

    pageState = createMockPeticionesPageState({
      activeLane: "bookings",
      inbox: { ...emptyInbox, reload: vi.fn() },
    });
    rerender(<PeticionesPageContent />);
    expect(screen.getByText(/No bookings or open contact requests/)).toBeInTheDocument();
  });

  it("wires card actions, pagination, lane change, and delete modal", async () => {
    const user = userEvent.setup();
    const rowId = pageState.inbox.rows[0]!.id;
    pageState = createMockPeticionesPageState({
      confirmDelete: {
        kind: "CONTACT",
        id: FIXTURE_CONTACT_ID,
        title: "Delete request",
        description: "Sure?",
      },
    });
    renderWithProviders(<PeticionesPageContent />);

    await user.click(screen.getByRole("button", { name: "stub-lane-guidance" }));
    expect(pageState.onLaneChange).toHaveBeenCalledWith("guidance");

    await user.click(screen.getByRole("button", { name: "stub-refresh" }));
    expect(pageState.inbox.reload).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: `toggle-${rowId}` }));
    expect(pageState.setExpandedId).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: `cancel-${rowId}` }));
    expect(pageState.actions.onCancelContact).toHaveBeenCalledWith(rowId);

    await user.click(screen.getByRole("button", { name: `remove-${rowId}` }));
    expect(pageState.actions.onRemove).toHaveBeenCalledWith(rowId);

    await user.click(screen.getByRole("button", { name: `reserve-${rowId}` }));
    expect(pageState.actions.onReserveFromContact).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: `cancel-booking-${rowId}` }));
    expect(pageState.actions.onCancelBooking).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: `remove-booking-${rowId}` }));
    expect(pageState.actions.onRemoveBooking).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: `quote-${rowId}` }));
    expect(pageState.actions.onSendBookingQuote).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: `balance-${rowId}` }));
    expect(pageState.actions.onSendBalanceLink).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "stub-page" }));
    expect(pageState.setPage).toHaveBeenCalledWith(2);

    await user.click(screen.getByRole("button", { name: "stub-per-page" }));
    expect(pageState.setPerPage).toHaveBeenCalledWith(25);
    expect(pageState.setPage).toHaveBeenCalledWith(1);

    await user.click(screen.getByRole("button", { name: "stub-confirm-delete" }));
    expect(pageState.onConfirmDelete).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "stub-close-delete" }));
    expect(pageState.setConfirmDelete).toHaveBeenCalledWith(null);

    await user.click(screen.getByRole("button", { name: "stub-purge" }));
    expect(pageState.setPurgeLinkedInquiryOnDelete).toHaveBeenCalledWith(false);
  });

  it("collapses an already expanded card", async () => {
    const user = userEvent.setup();
    const rowId = createMockPeticionesPageState().inbox.rows[0]!.id;
    pageState = createMockPeticionesPageState({ expandedId: rowId });
    renderWithProviders(<PeticionesPageContent />);
    await user.click(screen.getByRole("button", { name: `toggle-${rowId}` }));
    const updater = pageState.setExpandedId.mock.calls[0]![0] as (id: string | null) => string | null;
    expect(updater(rowId)).toBeNull();
    expect(updater("other")).toBe(rowId);
  });
});
