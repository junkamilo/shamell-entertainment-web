/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CatalogExpandRow } from "./CatalogExpandRow";

describe("CatalogExpandRow", () => {
  it("shows Expand when collapsed and wires aria attributes", () => {
    render(
      <CatalogExpandRow
        label="DESCRIPTION"
        expanded={false}
        onToggle={vi.fn()}
        controlsId="panel-1"
      />,
    );
    const button = screen.getByRole("button", { name: /expand/i });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveAttribute("aria-controls", "panel-1");
    expect(screen.getByRole("heading", { name: "DESCRIPTION" })).toBeInTheDocument();
  });

  it("shows Collapse when expanded and calls onToggle", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(
      <CatalogExpandRow
        label="EVENT TYPES"
        expanded
        onToggle={onToggle}
        controlsId="panel-2"
      />,
    );
    const button = screen.getByRole("button", { name: /collapse/i });
    expect(button).toHaveAttribute("aria-expanded", "true");
    await user.click(button);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
