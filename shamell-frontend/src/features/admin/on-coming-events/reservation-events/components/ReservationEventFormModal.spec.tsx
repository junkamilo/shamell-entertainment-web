/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeReservationEventTemplate } from "../../test/fixtures/onComingEvents.fixture";
import { renderWithProviders } from "../../test/utils/renderWithProviders";

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
          x
        </button>
      </div>
    ) : null,
}));

vi.mock("./ReservationEventScheduleSections", () => ({
  emptyScheduleForm: () => ({
    scheduleMode: "FIXED_EVENT",
    salesStartDate: "",
    salesEndDate: "",
    eventDate: "",
    eventStartTime: "18:00",
    eventEndTime: "23:00",
    weekdays: [],
    recurringStartTime: "10:00",
    recurringEndTime: "12:00",
    classSections: [],
  }),
  scheduleFormFromTemplate: (template: { scheduleMode: string }) => ({
    scheduleMode: template.scheduleMode,
    salesStartDate: "2030-07-01",
    salesEndDate: "2030-07-31",
    eventDate: "2030-08-01",
    eventStartTime: "20:00",
    eventEndTime: "23:00",
    weekdays: [{ weekday: 1, isActive: true }],
    recurringStartTime: "19:00",
    recurringEndTime: "21:00",
    classSections: [],
  }),
  ReservationEventScheduleSections: ({
    onChange,
    value,
  }: {
    onChange: (next: typeof value) => void;
    value: {
      scheduleMode: string;
      weekdays: unknown[];
      recurringStartTime: string;
      recurringEndTime: string;
    };
  }) => (
    <div data-testid="schedule-sections">
      <button
        type="button"
        onClick={() =>
          onChange({
            ...value,
            scheduleMode: "RECURRING_WEEKLY",
            weekdays: [{ weekday: 1, isActive: true }],
            recurringStartTime: "19:00",
            recurringEndTime: "21:00",
          })
        }
      >
        make-recurring
      </button>
    </div>
  ),
}));

import { ReservationEventFormModal } from "./ReservationEventFormModal";

function renderModal(
  overrides: Partial<React.ComponentProps<typeof ReservationEventFormModal>> = {},
) {
  const props: React.ComponentProps<typeof ReservationEventFormModal> = {
    isOpen: true,
    editing: null,
    isSubmitting: false,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    ...overrides,
  };
  return {
    ...renderWithProviders(<ReservationEventFormModal {...props} />),
    props,
  };
}

describe("ReservationEventFormModal", () => {
  it("renders New reservation event title when creating", () => {
    renderModal();
    expect(
      screen.getByRole("dialog", { name: "New reservation event" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();
    expect(screen.getByTestId("schedule-sections")).toBeInTheDocument();
  });

  it("renders Edit reservation event title when editing", () => {
    renderModal({ editing: makeReservationEventTemplate() });
    expect(
      screen.getByRole("dialog", { name: "Edit reservation event" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
  });

  it("calls onClose from Cancel", async () => {
    const user = userEvent.setup();
    const { props } = renderModal();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(props.onClose).toHaveBeenCalled();
  });

  it("calls onSubmit with trimmed name", async () => {
    const user = userEvent.setup();
    const { props } = renderModal();
    const input = screen.getByPlaceholderText("Friday Lounge — Spring");
    await user.type(input, "  Gala Night  ");
    await user.click(screen.getByRole("button", { name: "Create" }));
    expect(props.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Gala Night" }),
    );
  });

  it("shows Saving… while submitting", () => {
    renderModal({ isSubmitting: true });
    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
  });

  it("does not render when closed", () => {
    renderModal({ isOpen: false });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("submits recurring schedule body after stub switch", async () => {
    const user = userEvent.setup();
    const { props } = renderModal();
    await user.click(screen.getByRole("button", { name: "make-recurring" }));
    await user.click(screen.getByRole("button", { name: "Create" }));
    expect(props.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        scheduleMode: "RECURRING_WEEKLY",
        weekdays: [{ weekday: 1, isActive: true }],
        recurringStartTime: "19:00",
        recurringEndTime: "21:00",
      }),
    );
  });

  it("resets create form when reopened without editing", async () => {
    const user = userEvent.setup();
    const { rerender, props } = renderModal();
    await user.type(
      screen.getByPlaceholderText("Friday Lounge — Spring"),
      "Temp",
    );
    rerender(
      <ReservationEventFormModal
        isOpen={false}
        editing={null}
        isSubmitting={false}
        onClose={props.onClose}
        onSubmit={props.onSubmit}
      />,
    );
    rerender(
      <ReservationEventFormModal
        isOpen
        editing={null}
        isSubmitting={false}
        onClose={props.onClose}
        onSubmit={props.onSubmit}
      />,
    );
    expect(screen.getByPlaceholderText("Friday Lounge — Spring")).toHaveValue("");
  });

  it("hydrates from editing template on open", () => {
    renderModal({
      editing: makeReservationEventTemplate({
        name: "Saturday Gala",
        scheduleMode: "RECURRING_WEEKLY",
      }),
    });
    expect(screen.getByPlaceholderText("Friday Lounge — Spring")).toHaveValue(
      "Saturday Gala",
    );
  });
});
