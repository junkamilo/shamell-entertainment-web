/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeOccasionCatalogItem } from "../test/fixtures/eventTypes.fixture";
import { FIXTURE_OCCASION_ID } from "../test/fixtures/uuids.fixture";
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

  it("does not render when closed", () => {
    renderModal({ isOpen: false });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
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

  it("shows edit title, Save changes, and Saving…", () => {
    renderModal({ editingId: "et-1", isSubmitting: true, canSubmit: true });
    expect(
      screen.getByRole("dialog", { name: "Edit event type" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  });

  it("shows Save changes when editing and idle", () => {
    renderModal({ editingId: "et-1", isSubmitting: false, canSubmit: true });
    expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
  });

  it("notifies name and inquiry code changes", async () => {
    const user = userEvent.setup();
    const { props } = renderModal();
    await user.type(screen.getByPlaceholderText("e.g. Private weddings"), "A");
    expect(props.onNameChange).toHaveBeenCalled();
    await user.selectOptions(screen.getByRole("combobox"), "GENERAL");
    expect(props.onContactInquiryCodeChange).toHaveBeenCalled();
  });

  it("shows loading occasions when catalog is empty", () => {
    renderModal({ occasionCatalog: [], activeOccasionsCatalog: [] });
    expect(screen.getByText("Loading occasions…")).toBeInTheDocument();
  });

  it("shows empty active occasions message", () => {
    renderModal({
      occasionCatalog: [makeOccasionCatalogItem({ isActive: false })],
      activeOccasionsCatalog: [],
    });
    expect(
      screen.getByText(/No active occasions/i),
    ).toBeInTheDocument();
  });

  it("toggles active occasion checkboxes", async () => {
    const user = userEvent.setup();
    const { props } = renderModal({
      linkedOccasionIds: [FIXTURE_OCCASION_ID],
    });
    await user.click(screen.getByRole("checkbox", { name: "Birthday" }));
    expect(props.onToggleLinkedOccasion).toHaveBeenCalledWith(FIXTURE_OCCASION_ID);
  });

  it("renders orphan links with assignment name and fallback id", async () => {
    const user = userEvent.setup();
    const { props } = renderModal({
      linkedOrphanIds: ["orphan-named", "orphan-id"],
      linkedOccasionIds: ["orphan-named"],
      editingRow: {
        occasionAssignments: [
          { occasionTypeId: "orphan-named", occasionName: "Legacy party" },
        ],
      },
    });
    expect(screen.getByText("INACTIVE LINKS")).toBeInTheDocument();
    expect(screen.getByText("Legacy party")).toBeInTheDocument();
    expect(screen.getByText("orphan-id")).toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: "Legacy party" }));
    expect(props.onToggleLinkedOccasion).toHaveBeenCalledWith("orphan-named");
  });
});
