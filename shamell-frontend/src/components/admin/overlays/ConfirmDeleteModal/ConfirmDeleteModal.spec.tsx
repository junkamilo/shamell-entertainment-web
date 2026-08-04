/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  ConfirmDeleteHighlight,
  ConfirmDeleteMessage,
  ConfirmDeleteModal,
} from "./ConfirmDeleteModal";

describe("ConfirmDeleteModal", () => {
  it("renders Cancel and Delete actions", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    render(
      <ConfirmDeleteModal
        title="Delete service"
        isOpen
        isDeleting={false}
        onClose={onClose}
        onConfirm={onConfirm}
      >
        <p>Are you sure?</p>
      </ConfirmDeleteModal>,
    );

    expect(screen.getByRole("dialog", { name: "Delete service" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("disables actions and shows deleting label while deleting", () => {
    render(
      <ConfirmDeleteModal
        title="Delete service"
        isOpen
        isDeleting
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      >
        <p>Are you sure?</p>
      </ConfirmDeleteModal>,
    );
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Deleting..." })).toBeDisabled();
  });
});

describe("ConfirmDeleteMessage", () => {
  it("renders entity copy with meta and consequences", () => {
    render(
      <ConfirmDeleteMessage
        entityLabel="service"
        name="Private class"
        meta="Dance"
        consequences={["Removes linked bookings.", "This action cannot be undone."]}
      />,
    );
    expect(
      screen.getByText("Are you sure you want to permanently delete this service?"),
    ).toBeInTheDocument();
    expect(screen.getByText("Dance")).toBeInTheDocument();
    expect(screen.getByText("Private class")).toBeInTheDocument();
    expect(screen.getByText("Removes linked bookings.")).toBeInTheDocument();
  });
});

describe("ConfirmDeleteHighlight", () => {
  it("renders children with highlight class", () => {
    render(<ConfirmDeleteHighlight>VIP</ConfirmDeleteHighlight>);
    expect(screen.getByText("VIP")).toHaveClass("admin-delete-confirm-highlight");
  });
});
