/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ShamellAlertDialog } from "./ShamellAlertDialog";

describe("ShamellAlertDialog", () => {
  it("opens as an alertdialog", () => {
    render(
      <ShamellAlertDialog
        open
        onClose={() => {}}
        title="Heads up"
        description="Something went wrong."
      />,
    );
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText("Heads up")).toBeInTheDocument();
  });

  it("calls onClose from OK, Escape, and backdrop", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <ShamellAlertDialog
        open
        onClose={onClose}
        title="Alert"
        description="Details"
      />,
    );

    await user.click(screen.getByRole("button", { name: "OK" }));
    expect(onClose).toHaveBeenCalledTimes(1);

    onClose.mockClear();
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);

    onClose.mockClear();
    const backdrop = screen.getByRole("presentation");
    await user.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
