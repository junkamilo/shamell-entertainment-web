/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BlockedActionModal } from "./BlockedActionModal";

describe("BlockedActionModal", () => {
  it("renders alertdialog with title and description", () => {
    render(
      <BlockedActionModal
        isOpen
        onClose={vi.fn()}
        title="Cannot deactivate"
        description="This type is still linked to active services."
      />,
    );
    expect(
      screen.getByRole("alertdialog", { name: "Cannot deactivate" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("This type is still linked to active services."),
    ).toBeInTheDocument();
  });

  it("closes on Escape, backdrop, and OK", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <BlockedActionModal
        isOpen
        onClose={onClose}
        title="Cannot deactivate"
        description="Still in use."
      />,
    );

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);

    onClose.mockClear();
    await user.click(screen.getByRole("alertdialog", { name: "Cannot deactivate" }));
    expect(onClose).not.toHaveBeenCalled();
    await user.click(screen.getByRole("presentation"));
    expect(onClose).toHaveBeenCalledTimes(1);

    onClose.mockClear();
    await user.click(screen.getByRole("button", { name: "OK" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
