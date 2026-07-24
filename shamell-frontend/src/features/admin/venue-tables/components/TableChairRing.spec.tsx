/** @vitest-environment jsdom */

import type React from "react";
import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("motion/react", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    button: ({
      children,
      ...props
    }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
      children?: React.ReactNode;
    }) => <button {...props}>{children}</button>,
    rect: (props: React.SVGProps<SVGRectElement>) => <rect {...props} />,
  },
}));

import TableChairRing from "./TableChairRing";

function renderRing(
  overrides: Partial<React.ComponentProps<typeof TableChairRing>> = {},
) {
  const props: React.ComponentProps<typeof TableChairRing> = {
    size: "LARGE",
    includedChairs: 6,
    canIncrement: true,
    canDecrement: true,
    onIncrement: vi.fn(),
    onDecrement: vi.fn(),
    ...overrides,
  };
  return { ...renderWithProviders(<TableChairRing {...props} />), props };
}

describe("TableChairRing", () => {
  it("shows included chair count", () => {
    renderRing({ includedChairs: 6 });
    expect(screen.getByText("6 chairs included")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Table with 6 chairs" }),
    ).toBeInTheDocument();
  });

  it("calls increment and decrement handlers", async () => {
    const user = userEvent.setup();
    const { props } = renderRing();
    await user.click(screen.getByRole("button", { name: "Add chair" }));
    await user.click(screen.getByRole("button", { name: "Remove chair" }));
    expect(props.onIncrement).toHaveBeenCalled();
    expect(props.onDecrement).toHaveBeenCalled();
  });
});
