/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeHeaderPhoto } from "../test/fixtures/headerMedia.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("./HeaderMediaLibraryMedia", () => ({
  default: () => <div data-testid="library-media" />,
}));

import HeaderMediaLibraryCard from "./HeaderMediaLibraryCard";

function renderCard(
  overrides: Partial<React.ComponentProps<typeof HeaderMediaLibraryCard>> = {},
) {
  const props: React.ComponentProps<typeof HeaderMediaLibraryCard> = {
    photo: makeHeaderPhoto(),
    globalIndex: 1,
    onView: vi.fn(),
    onFocus: vi.fn(),
    onToggle: vi.fn(),
    onDelete: vi.fn(),
    ...overrides,
  };
  return { ...renderWithProviders(<HeaderMediaLibraryCard {...props} />), props };
}

describe("HeaderMediaLibraryCard", () => {
  it("renders index and ACTIVE badge", () => {
    renderCard();
    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getByText("● ACTIVE")).toBeInTheDocument();
  });

  it("renders INACTIVE badge when inactive", () => {
    renderCard({ photo: makeHeaderPhoto({ isActive: false }) });
    expect(screen.getByText("● INACTIVE")).toBeInTheDocument();
  });

  it("calls view focus toggle and delete", async () => {
    const user = userEvent.setup();
    const { props } = renderCard();
    await user.click(screen.getByRole("button", { name: "Preview media" }));
    await user.click(screen.getByRole("button", { name: "Adjust focus" }));
    await user.click(screen.getByRole("button", { name: "Hide from slider" }));
    await user.click(screen.getByRole("button", { name: "Delete item" }));
    expect(props.onView).toHaveBeenCalled();
    expect(props.onFocus).toHaveBeenCalled();
    expect(props.onToggle).toHaveBeenCalled();
    expect(props.onDelete).toHaveBeenCalled();
  });
});
