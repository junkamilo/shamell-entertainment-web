/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import VenueSeatingSectionTabs from "./VenueSeatingSectionTabs";

function renderTabs(
  overrides: Partial<React.ComponentProps<typeof VenueSeatingSectionTabs>> = {},
) {
  const props: React.ComponentProps<typeof VenueSeatingSectionTabs> = {
    value: "tables",
    onChange: vi.fn(),
    ...overrides,
  };
  return { ...renderWithProviders(<VenueSeatingSectionTabs {...props} />), props };
}

describe("VenueSeatingSectionTabs", () => {
  it("renders Tables and Standalone chairs tabs", () => {
    renderTabs();
    expect(screen.getByRole("tab", { name: "Tables" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "Standalone chairs" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("calls onChange when switching to chairs", async () => {
    const user = userEvent.setup();
    const { props } = renderTabs();
    await user.click(screen.getByRole("tab", { name: "Standalone chairs" }));
    expect(props.onChange).toHaveBeenCalledWith("chairs");
  });
});
