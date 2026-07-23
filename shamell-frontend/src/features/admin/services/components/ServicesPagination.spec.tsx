/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import ServicesPagination from "./ServicesPagination";

function renderPagination(
  overrides: Partial<React.ComponentProps<typeof ServicesPagination>> = {},
) {
  const props: React.ComponentProps<typeof ServicesPagination> = {
    filteredCount: 20,
    pageOffset: 0,
    paginatedCount: 10,
    safePage: 1,
    totalPages: 2,
    onPageChange: vi.fn(),
    ...overrides,
  };
  return { ...renderWithProviders(<ServicesPagination {...props} />), props };
}

describe("ServicesPagination", () => {
  it("shows Mostrando range text", () => {
    renderPagination();
    expect(screen.getByText("Mostrando 1-10 de 20")).toBeInTheDocument();
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
});
