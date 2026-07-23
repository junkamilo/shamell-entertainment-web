/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeAdminEvent } from "../test/fixtures/events.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("@/components/admin/overlays", () => ({
  ConfirmDeleteModal: ({
    isOpen,
    title,
    children,
    onConfirm,
    onClose,
    isDeleting,
  }: {
    isOpen: boolean;
    title: string;
    children: React.ReactNode;
    onConfirm: () => void;
    onClose: () => void;
    isDeleting: boolean;
  }) =>
    isOpen ? (
      <div role="dialog" aria-label={title}>
        {children}
        <button type="button" onClick={onClose} disabled={isDeleting}>
          Cancel
        </button>
        <button type="button" onClick={onConfirm} disabled={isDeleting}>
          {isDeleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    ) : null,
  ConfirmDeleteMessage: ({ name }: { name: string }) => <p>{name}</p>,
}));

import EventsDeleteModal from "./EventsDeleteModal";

describe("EventsDeleteModal", () => {
  it("renders nothing when pendingDelete is null", () => {
    renderWithProviders(
      <EventsDeleteModal
        pendingDelete={null}
        isDeleting={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it('shows "Delete event" dialog when open', () => {
    renderWithProviders(
      <EventsDeleteModal
        pendingDelete={makeAdminEvent()}
        isDeleting={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("dialog", { name: "Delete event" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("An elegant private wedding package with full staging."),
    ).toBeInTheDocument();
  });

  it("calls onClose and onConfirm from actions", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    renderWithProviders(
      <EventsDeleteModal
        pendingDelete={makeAdminEvent()}
        isDeleting={false}
        onClose={onClose}
        onConfirm={onConfirm}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalledOnce();

    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("mentions catalog images when present", () => {
    renderWithProviders(
      <EventsDeleteModal
        pendingDelete={makeAdminEvent()}
        isDeleting={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );
    expect(
      screen.getByText("Its catalog image will also be removed."),
    ).toBeInTheDocument();
  });
});
