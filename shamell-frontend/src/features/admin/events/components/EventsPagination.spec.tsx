/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import EventsPagination from "./EventsPagination";

function renderPagination(
  overrides: Partial<React.ComponentProps<typeof EventsPagination>> = {},
) {
  const props: React.ComponentProps<typeof EventsPagination> = {
    searchedCount: 20,
    pageOffset: 0,
    paginatedCount: 10,
    safePage: 1,
    totalPages: 2,
    onPageChange: vi.fn(),
    ...overrides,
  };
  return { ...renderWithProviders(<EventsPagination {...props} />), props };
}

describe("EventsPagination", () => {
  it("shows Showing range text", () => {
    renderPagination();
    expect(screen.getByText("Showing 1-10 of 20")).toBeInTheDocument();
  });

  it("calls onPageChange from next and page buttons", async () => {
    const user = userEvent.setup();
    const { props } = renderPagination({ safePage: 1, totalPages: 2 });

    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(props.onPageChange).toHaveBeenCalledWith(2);

    await user.click(screen.getByRole("button", { name: "2" }));
    expect(props.onPageChange).toHaveBeenCalledWith(2);
  });

  it("calls onPageChange from previous when not on first page", async () => {
    const user = userEvent.setup();
    const { props } = renderPagination({
      safePage: 2,
      pageOffset: 10,
      paginatedCount: 10,
      totalPages: 2,
    });

    await user.click(screen.getByRole("button", { name: "Previous page" }));
    expect(props.onPageChange).toHaveBeenCalledWith(1);
  });

  it("shows zero range when searchedCount is 0", () => {
    renderPagination({
      searchedCount: 0,
      pageOffset: 0,
      paginatedCount: 0,
      safePage: 1,
      totalPages: 1,
    });
    expect(screen.getByText("Showing 0 of 0")).toBeInTheDocument();
  });
});
