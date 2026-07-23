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
  default: () => <div data-testid="request-card" />,
}));

vi.mock("./PeticionesDeleteModal", () => ({
  default: ({
    confirmDelete,
    onConfirm,
  }: {
    confirmDelete: { title: string } | null;
    onConfirm: () => void;
  }) =>
    confirmDelete ? (
      <div data-testid="delete-modal">
        <button type="button" onClick={onConfirm}>
          stub-confirm-delete
        </button>
      </div>
    ) : null,
}));

vi.mock("@/components/admin/data-display", () => ({
  Pagination: () => <div data-testid="pagination" />,
}));

import PeticionesPageContent from "./PeticionesPageContent";

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
      inbox: {
        rows: [],
        meta: {
          page: 1,
          perPage: 10,
          totalItems: 0,
          totalPages: 1,
          hasPrev: false,
          hasNext: false,
        },
        isLoading: true,
        error: null,
        reload: vi.fn(),
      },
    });
    const { rerender } = renderWithProviders(<PeticionesPageContent />);
    expect(screen.getByText(/Loading/)).toBeInTheDocument();

    pageState = createMockPeticionesPageState({
      activeLane: "guidance",
      inbox: {
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
      },
    });
    rerender(<PeticionesPageContent />);
    expect(
      screen.getByText(/No concierge guidance requests/),
    ).toBeInTheDocument();
  });

  it("wires lane change, refresh, and delete confirm", async () => {
    const user = userEvent.setup();
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

    await user.click(screen.getByRole("button", { name: "stub-confirm-delete" }));
    expect(pageState.onConfirmDelete).toHaveBeenCalled();
  });
});
