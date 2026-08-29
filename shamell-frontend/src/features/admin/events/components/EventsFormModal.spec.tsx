/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeEventTypeOption } from "../test/fixtures/events.fixture";
import { FIXTURE_CATALOG_IMAGE_ID, FIXTURE_EVENT_TYPE_ID } from "../test/fixtures/uuids.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import { MAX_CATALOG_IMAGES } from "../lib/eventsConstants";

vi.mock("@/components/admin/overlays", () => ({
  Modal: ({
    isOpen,
    title,
    children,
    onClose,
  }: {
    isOpen: boolean;
    title: string;
    children: React.ReactNode;
    onClose: () => void;
  }) =>
    isOpen ? (
      <div role="dialog" aria-label={title}>
        {children}
        <button type="button" onClick={onClose}>
          modal-close
        </button>
      </div>
    ) : null,
  MODAL_LAYERS: { busy: "z-busy" },
}));

vi.mock("@/components/shared", () => ({
  ShamellBusyOverlay: ({
    active,
    title,
  }: {
    active: boolean;
    title: string;
  }) => (active ? <div data-testid="busy">{title}</div> : null),
}));

vi.mock(
  "@/features/admin/on-coming-events/reservation-events/components/ReservationEventScheduleSections",
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import("@/features/admin/on-coming-events/reservation-events/components/ReservationEventScheduleSections")
      >();
    return {
      ...actual,
      ReservationEventScheduleSections: ({
        onChange,
        onExperienceModeChange,
        onEnableVenueSeatingChange,
        onFixedTicketCapacityInputChange,
        onMonthPackageEnabledChange,
        onMonthPackagePriceChange,
        onMonthPackageLabelChange,
      }: {
        onChange: (value: unknown) => void;
        onExperienceModeChange?: (mode: string) => void;
        onEnableVenueSeatingChange?: (enabled: boolean) => void;
        onFixedTicketCapacityInputChange?: (value: string) => void;
        onMonthPackageEnabledChange?: (enabled: boolean) => void;
        onMonthPackagePriceChange?: (value: string) => void;
        onMonthPackageLabelChange?: (value: string) => void;
      }) => (
        <div data-testid="schedule-sections">
          <button type="button" onClick={() => onChange({ fromStub: true })}>
            patch-schedule
          </button>
          <button
            type="button"
            onClick={() => onExperienceModeChange?.("RECURRING_WEEKLY")}
          >
            patch-mode
          </button>
          <button type="button" onClick={() => onEnableVenueSeatingChange?.(true)}>
            patch-seating
          </button>
          <button
            type="button"
            onClick={() => onFixedTicketCapacityInputChange?.("10")}
          >
            patch-capacity
          </button>
          <button type="button" onClick={() => onMonthPackageEnabledChange?.(true)}>
            patch-pkg
          </button>
          <button type="button" onClick={() => onMonthPackagePriceChange?.("99")}>
            patch-pkg-price
          </button>
          <button type="button" onClick={() => onMonthPackageLabelChange?.("Pass")}>
            patch-pkg-label
          </button>
        </div>
      ),
    };
  },
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

const STUB_SCHEDULE = {
  scheduleMode: "FIXED_EVENT" as const,
  salesStartDate: "",
  salesEndDate: "",
  eventDate: "",
  eventStartTime: "18:00",
  eventEndTime: "23:00",
  weekdays: [],
  recurringStartTime: "10:00",
  recurringEndTime: "12:00",
  classSections: [],
};

function renderModal(
  overrides: Partial<React.ComponentProps<typeof EventsFormModal>> = {},
) {
  const types = [makeEventTypeOption(), makeEventTypeOption({ id: "type-2", name: "Gala" })];
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

  it("closes via modal chrome when not submitting", async () => {
    const user = userEvent.setup();
    const { props } = renderModal();
    await user.click(screen.getByRole("button", { name: "modal-close" }));
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

  it("shows edit titles and Save changes", () => {
    renderModal({ editingId: "evt-1" });
    expect(screen.getByRole("dialog", { name: "Edit event" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
  });

  it("uses upcoming titles and event name field in freeEventNameMode", async () => {
    const user = userEvent.setup();
    const { props } = renderModal({
      freeEventNameMode: true,
      eventName: "Gala",
    });
    expect(
      screen.getByRole("dialog", { name: "New upcoming event" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("EVENT TYPE")).not.toBeInTheDocument();
    await user.type(screen.getByPlaceholderText("e.g. Summer Gala 2026"), "X");
    expect(props.onEventNameChange).toHaveBeenCalled();
  });

  it("shows Edit upcoming event when freeEventNameMode and editing", () => {
    renderModal({ freeEventNameMode: true, editingId: "evt-1" });
    expect(
      screen.getByRole("dialog", { name: "Edit upcoming event" }),
    ).toBeInTheDocument();
  });

  it("toggles type dropdown and selects a type", async () => {
    const user = userEvent.setup();
    const { props } = renderModal({ isTypeDropdownOpen: true });
    await user.click(screen.getAllByRole("button", { name: /Private weddings/i })[0]!);
    expect(props.onTypeDropdownToggle).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Gala" }));
    expect(props.onSelectEventType).toHaveBeenCalledWith("type-2");
  });

  it("does not toggle type dropdown when types list is empty", async () => {
    const user = userEvent.setup();
    const { props } = renderModal({
      activeEventTypes: [],
      selectedTypeName: undefined,
    });
    await user.click(screen.getByText("Create an event type first"));
    expect(props.onTypeDropdownToggle).not.toHaveBeenCalled();
  });

  it("renders schedule stub and wires upcoming handlers", async () => {
    const user = userEvent.setup();
    const { props } = renderModal({
      lockPublicSection: true,
      schedule: STUB_SCHEDULE,
      onScheduleChange: vi.fn(),
      onExperienceModeChange: vi.fn(),
      onEnableVenueSeatingChange: vi.fn(),
      onFixedTicketCapacityInputChange: vi.fn(),
      onMonthPackageEnabledChange: vi.fn(),
      onMonthPackagePriceChange: vi.fn(),
      onMonthPackageLabelChange: vi.fn(),
    });
    expect(screen.getByTestId("schedule-sections")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "patch-schedule" }));
    await user.click(screen.getByRole("button", { name: "patch-mode" }));
    await user.click(screen.getByRole("button", { name: "patch-seating" }));
    await user.click(screen.getByRole("button", { name: "patch-capacity" }));
    await user.click(screen.getByRole("button", { name: "patch-pkg" }));
    await user.click(screen.getByRole("button", { name: "patch-pkg-price" }));
    await user.click(screen.getByRole("button", { name: "patch-pkg-label" }));
    expect(props.onScheduleChange).toHaveBeenCalled();
    expect(props.onExperienceModeChange).toHaveBeenCalledWith("RECURRING_WEEKLY");
    expect(props.onEnableVenueSeatingChange).toHaveBeenCalledWith(true);
    expect(props.onFixedTicketCapacityInputChange).toHaveBeenCalledWith("10");
    expect(props.onMonthPackageEnabledChange).toHaveBeenCalledWith(true);
    expect(props.onMonthPackagePriceChange).toHaveBeenCalledWith("99");
    expect(props.onMonthPackageLabelChange).toHaveBeenCalledWith("Pass");
  });

  it("shows class sessions panel for recurring upcoming edits", () => {
    renderModal({
      lockPublicSection: true,
      editingId: "evt-1",
      experienceMode: "RECURRING_WEEKLY",
      schedule: STUB_SCHEDULE,
      onScheduleChange: vi.fn(),
    });
    expect(screen.getByTestId("class-sessions-panel")).toBeInTheDocument();
  });

  it("renders existing/pending media and pick input; hides pick at capacity", async () => {
    const user = userEvent.setup();
    const videoFile = new File(["v"], "clip.mp4", { type: "video/mp4" });
    const imageFile = new File(["i"], "pic.jpg", { type: "image/jpeg" });
    const { props } = renderModal({
      existingImages: [
        {
          id: FIXTURE_CATALOG_IMAGE_ID,
          imageUrl: "https://cdn.example.com/a.jpg",
          mediaType: "image",
        },
        {
          id: "vid-1",
          imageUrl: "https://cdn.example.com/a.mp4",
          mediaType: "VIDEO",
        },
      ],
      pendingFiles: [imageFile, videoFile],
      pendingPreviewUrls: ["blob:img", "blob:vid"],
    });
    await user.click(screen.getAllByLabelText("Remove media")[0]!);
    expect(props.onRemoveExistingImage).toHaveBeenCalledWith(FIXTURE_CATALOG_IMAGE_ID);
    await user.click(screen.getAllByLabelText("Remove pending file")[1]!);
    expect(props.onRemovePendingAt).toHaveBeenCalledWith(1);

    const fileInput = screen.getByLabelText("Add image or video");
    const extra = new File(["x"], "x.jpg", { type: "image/jpeg" });
    fireEvent.change(fileInput, { target: { files: [extra] } });
    expect(props.onPickCatalogImages).toHaveBeenCalled();
  });

  it("hides pick control at catalog media capacity", () => {
    renderModal({
      existingImages: Array.from({ length: MAX_CATALOG_IMAGES }, (_, i) => ({
        id: `img-${i}`,
        imageUrl: `https://cdn.example.com/${i}.jpg`,
        mediaType: "image",
      })),
    });
    expect(screen.queryByLabelText("Add image or video")).not.toBeInTheDocument();
  });

  it("blocks close while submitting and shows Saving…", async () => {
    const user = userEvent.setup();
    const { props } = renderModal({
      isSubmitting: true,
      submittingMessage: "Applying schedule…",
    });
    expect(screen.getByTestId("busy")).toHaveTextContent("Applying schedule…");
    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "modal-close" }));
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it("uses default busy title when submittingMessage is omitted", () => {
    renderModal({ isSubmitting: true });
    expect(screen.getByTestId("busy")).toHaveTextContent("Saving event…");
  });

  it("notifies field handlers", async () => {
    const user = userEvent.setup();
    const { props } = renderModal();
    await user.type(screen.getByPlaceholderText("Describe this event..."), "Hi");
    await user.type(screen.getByPlaceholderText(/Line 1/), "Item");
    await user.type(screen.getByPlaceholderText("e.g. 2500 or 2500.50"), "9");
    expect(props.onDescriptionChange).toHaveBeenCalled();
    expect(props.onItemsTextChange).toHaveBeenCalled();
    expect(props.onPriceInputChange).toHaveBeenCalled();
  });
});
