/** @vitest-environment jsdom */

import type React from "react";
import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("motion/react", () => ({
  motion: {
    button: ({
      children,
      ...props
    }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
      children?: React.ReactNode;
    }) => <button {...props}>{children}</button>,
  },
}));

import TableSizeSelector from "./TableSizeSelector";

function renderSelector(
  overrides: Partial<React.ComponentProps<typeof TableSizeSelector>> = {},
) {
  const props: React.ComponentProps<typeof TableSizeSelector> = {
    value: "LARGE",
    onChange: vi.fn(),
    ...overrides,
  };
  return { ...renderWithProviders(<TableSizeSelector {...props} />), props };
}

describe("TableSizeSelector", () => {
  it("renders all three size options", () => {
    renderSelector();
    expect(screen.getByRole("button", { name: /Large/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Medium/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Small/i })).toBeInTheDocument();
  });

  it("calls onChange when selecting a size", async () => {
    const user = userEvent.setup();
    const { props } = renderSelector();
    await user.click(screen.getByRole("button", { name: /Medium/i }));
    expect(props.onChange).toHaveBeenCalledWith("MEDIUM");
  });
});
