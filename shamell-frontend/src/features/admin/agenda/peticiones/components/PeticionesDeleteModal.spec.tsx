/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import { FIXTURE_BOOKING_ID, FIXTURE_CONTACT_ID } from "../test/fixtures/uuids.fixture";

vi.mock("@/components/admin/overlays", () => ({
  Modal: ({
    isOpen,
    title,
    children,
  }: {
    isOpen: boolean;
    title: string;
    children: React.ReactNode;
  }) =>
    isOpen ? (
      <div role="dialog" aria-label={title}>
        {children}
      </div>
    ) : null,
}));

import PeticionesDeleteModal from "./PeticionesDeleteModal";

describe("PeticionesDeleteModal", () => {
  it("renders nothing when closed", () => {
    renderWithProviders(
      <PeticionesDeleteModal
        confirmDelete={null}
        purgeLinkedInquiryOnDelete
        onPurgeLinkedChange={vi.fn()}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows contact delete dialog without purge checkbox", () => {
    renderWithProviders(
      <PeticionesDeleteModal
        confirmDelete={{
          kind: "CONTACT",
          id: FIXTURE_CONTACT_ID,
          title: "Delete inquiry",
          description: "Remove this request?",
        }}
        purgeLinkedInquiryOnDelete
        onPurgeLinkedChange={vi.fn()}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("dialog", { name: "Delete inquiry" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Remove this request?")).toBeInTheDocument();
    expect(
      screen.queryByText(/Also delete the linked inquiry/),
    ).not.toBeInTheDocument();
  });

  it("shows purge checkbox for booking with linked contact and wires actions", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    const onPurgeLinkedChange = vi.fn();
    renderWithProviders(
      <PeticionesDeleteModal
        confirmDelete={{
          kind: "BOOKING",
          id: FIXTURE_BOOKING_ID,
          title: "Delete booking",
          description: "Remove this booking?",
          linkedContactId: FIXTURE_CONTACT_ID,
        }}
        purgeLinkedInquiryOnDelete
        onPurgeLinkedChange={onPurgeLinkedChange}
        onClose={onClose}
        onConfirm={onConfirm}
      />,
    );
    expect(screen.getByText(/Also delete the linked inquiry/)).toBeInTheDocument();
    await user.click(screen.getByRole("checkbox"));
    expect(onPurgeLinkedChange).toHaveBeenCalledWith(false);
    await user.click(screen.getByRole("button", { name: "CANCEL" }));
    expect(onClose).toHaveBeenCalledOnce();
    await user.click(screen.getByRole("button", { name: "DELETE" }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
