/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeOccasionCatalogItem } from "../test/fixtures/eventTypes.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";

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

import EventTypesFormModal from "./EventTypesFormModal";

function renderModal(
  overrides: Partial<React.ComponentProps<typeof EventTypesFormModal>> = {},
) {
  const occasions = [makeOccasionCatalogItem()];
  const props: React.ComponentProps<typeof EventTypesFormModal> = {
    isOpen: true,
    editingId: null,
    editingRow: undefined,
    name: "",
    onNameChange: vi.fn(),
    contactInquiryCode: "",
    onContactInquiryCodeChange: vi.fn(),
    occasionCatalog: occasions,
    activeOccasionsCatalog: occasions,
    linkedOccasionIds: [],
    linkedOrphanIds: [],
    canSubmit: true,
    isSubmitting: false,
    onClose: vi.fn(),
    onSubmit: vi.fn((event) => event.preventDefault()),
    onToggleLinkedOccasion: vi.fn(),
    ...overrides,
  };
  return { ...renderWithProviders(<EventTypesFormModal {...props} />), props };
}

describe("EventTypesFormModal", () => {
  it('shows "New event type" dialog when open', () => {
    renderModal();
    expect(
      screen.getByRole("dialog", { name: "New event type" }),
    ).toBeInTheDocument();
  });

  it("calls onClose from Cancel", async () => {
    const user = userEvent.setup();
    const { props } = renderModal();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(props.onClose).toHaveBeenCalledOnce();
  });

  it("submits when canSubmit is true", async () => {
    const user = userEvent.setup();
    const { props } = renderModal({ canSubmit: true });

    await user.click(screen.getByRole("button", { name: "Create type" }));
    expect(props.onSubmit).toHaveBeenCalledOnce();
  });

  it("disables submit when canSubmit is false", () => {
    renderModal({ canSubmit: false });
    expect(screen.getByRole("button", { name: "Create type" })).toBeDisabled();
  });
});
