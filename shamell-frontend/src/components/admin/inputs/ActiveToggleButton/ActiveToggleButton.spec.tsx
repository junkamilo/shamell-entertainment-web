/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ActiveToggleButton } from "./ActiveToggleButton";

describe("ActiveToggleButton", () => {
  it("calls onToggle when active and not blocked", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(
      <ActiveToggleButton
        isActive
        onToggle={onToggle}
        onBlockedDeactivate={vi.fn()}
        ariaLabel="Toggle active"
      />,
    );
    await user.click(screen.getByRole("button", { name: "Toggle active" }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("calls onBlockedDeactivate instead of toggle when blocked and active", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    const onBlockedDeactivate = vi.fn();
    render(
      <ActiveToggleButton
        isActive
        deactivateBlocked
        onToggle={onToggle}
        onBlockedDeactivate={onBlockedDeactivate}
        ariaLabel="Toggle active"
      />,
    );
    await user.click(screen.getByRole("button", { name: "Toggle active" }));
    expect(onBlockedDeactivate).toHaveBeenCalledTimes(1);
    expect(onToggle).not.toHaveBeenCalled();
  });

  it("disables while toggling", () => {
    render(
      <ActiveToggleButton
        isActive
        isToggling
        onToggle={vi.fn()}
        onBlockedDeactivate={vi.fn()}
        ariaLabel="Toggle active"
      />,
    );
    expect(screen.getByRole("button", { name: "Toggle active" })).toBeDisabled();
  });
});
