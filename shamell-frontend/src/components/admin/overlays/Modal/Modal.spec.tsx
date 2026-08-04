/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Modal } from "./Modal";

describe("Modal", () => {
  it("renders dialog with title when open", () => {
    render(
      <Modal title="Edit item" isOpen onClose={vi.fn()}>
        <p>Body</p>
      </Modal>,
    );
    expect(screen.getByRole("dialog", { name: "Edit item" })).toBeInTheDocument();
    expect(screen.getByText("Body")).toBeInTheDocument();
  });

  it("does not render dialog when closed", () => {
    render(
      <Modal title="Edit item" isOpen={false} onClose={vi.fn()}>
        <p>Body</p>
      </Modal>,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("applies narrow max width class", () => {
    render(
      <Modal title="Confirm" isOpen onClose={vi.fn()} size="narrow">
        <p>Body</p>
      </Modal>,
    );
    expect(screen.getByRole("dialog")).toHaveClass("max-w-xl");
  });

  it("closes via Close button, Escape, and backdrop", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal title="Edit item" isOpen onClose={onClose}>
        <p>Body</p>
      </Modal>,
    );

    await user.click(screen.getByRole("button", { name: "Close dialog" }));
    expect(onClose).toHaveBeenCalledTimes(1);

    onClose.mockClear();
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);

    onClose.mockClear();
    await user.click(screen.getByRole("dialog", { name: "Edit item" }));
    expect(onClose).not.toHaveBeenCalled();
    await user.click(screen.getByRole("presentation"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("locks and restores body overflow", () => {
    document.body.style.overflow = "auto";
    const { rerender, unmount } = render(
      <Modal title="Edit item" isOpen onClose={vi.fn()}>
        <p>Body</p>
      </Modal>,
    );
    expect(document.body.style.overflow).toBe("hidden");

    rerender(
      <Modal title="Edit item" isOpen={false} onClose={vi.fn()}>
        <p>Body</p>
      </Modal>,
    );
    expect(document.body.style.overflow).toBe("auto");
    unmount();
  });
});
