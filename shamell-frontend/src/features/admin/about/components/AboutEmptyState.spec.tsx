/** @vitest-environment jsdom */

import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import { AboutEmptyState } from "./AboutEmptyState";

describe("AboutEmptyState", () => {
  it("renders the empty-state copy", () => {
    renderWithProviders(<AboutEmptyState onCreate={vi.fn()} />);
    expect(screen.getByText(/no about block yet/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create about shamell/i })).toBeInTheDocument();
  });

  it("calls onCreate when the CTA is clicked", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();
    renderWithProviders(<AboutEmptyState onCreate={onCreate} />);

    await user.click(screen.getByRole("button", { name: /create about shamell/i }));
    expect(onCreate).toHaveBeenCalledOnce();
  });
});
