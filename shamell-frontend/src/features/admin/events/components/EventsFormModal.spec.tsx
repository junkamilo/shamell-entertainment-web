/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeEventTypeOption } from "../test/fixtures/events.fixture";
import { FIXTURE_EVENT_TYPE_ID } from "../test/fixtures/uuids.fixture";
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
  ADMIN_BUSY_OVERLAY_Z_CLASS: "z-busy",
}));

vi.mock("@/components/shared/ShamellBusyOverlay", () => ({
  default: () => null,
}));

vi.mock(
  "@/features/admin/on-coming-events/reservation-events/components/ReservationEventScheduleSections",
  () => ({
    ReservationEventScheduleSections: () => (
      <div data-testid="schedule-sections" />
    ),
  }),
);

vi.mock(
  "@/features/admin/on-coming-events/components/UpcomingClassSessionsPanel",
  () => ({
    UpcomingClassSessionsPanel: () => (
      <div data-testid="class-sessions-panel" />
    ),
  }),
);

import EventsFormModal from "./EventsFormModal";

function renderModal(
  overrides: Partial<React.ComponentProps<typeof EventsFormModal>> = {},
) {
  const types = [makeEventTypeOption()];
  const props: React.ComponentProps<typeof EventsFormModal> = {
    isOpen: true,
    editingId: null,
    isSubmitting: false,
    canSubmit: true,
    eventName: "",
    onEventNameChange: vi.fn(),
    activeEventTypes: types,
    eventTypeId: FIXTURE_EVENT_TYPE_ID,
    selectedTypeName: types[0]!.name,
    isTypeDropdownOpen: false,
    onTypeDropdownToggle: vi.fn(),
    onSelectEventType: vi.fn(),
    description: "",
    onDescriptionChange: vi.fn(),
    itemsText: "",
    onItemsTextChange: vi.fn(),
    priceInput: "",
    onPriceInputChange: vi.fn(),
    existingImages: [],
    pendingFiles: [],
    pendingPreviewUrls: [],
    onClose: vi.fn(),
    onSubmit: vi.fn((event) => event.preventDefault()),
    onPickCatalogImages: vi.fn(),
    onRemovePendingAt: vi.fn(),
    onRemoveExistingImage: vi.fn(),
    ...overrides,
  };
  return { ...renderWithProviders(<EventsFormModal {...props} />), props };
}

describe("EventsFormModal", () => {
  it('shows "New event" dialog when open', () => {
    renderModal();
    expect(screen.getByRole("dialog", { name: "New event" })).toBeInTheDocument();
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

    await user.click(screen.getByRole("button", { name: "Create event" }));
    expect(props.onSubmit).toHaveBeenCalledOnce();
  });

  it("disables submit when canSubmit is false", () => {
    renderModal({ canSubmit: false });
    expect(screen.getByRole("button", { name: "Create event" })).toBeDisabled();
  });
});
