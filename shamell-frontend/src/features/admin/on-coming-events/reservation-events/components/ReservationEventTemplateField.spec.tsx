/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  makeRecurringReservationEventTemplate,
  makeReservationEventTemplate,
} from "../../test/fixtures/onComingEvents.fixture";
import { FIXTURE_TEMPLATE_ID } from "../../test/fixtures/uuids.fixture";
import { renderWithProviders } from "../../test/utils/renderWithProviders";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { ReservationEventTemplateField } from "./ReservationEventTemplateField";

describe("ReservationEventTemplateField", () => {
  it("renders reservation event select with templates", () => {
    renderWithProviders(
      <ReservationEventTemplateField
        templates={[makeReservationEventTemplate(), makeRecurringReservationEventTemplate()]}
        loading={false}
        value={FIXTURE_TEMPLATE_ID}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText("RESERVATION EVENT")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveValue(FIXTURE_TEMPLATE_ID);
    expect(screen.getByText("Saturday Gala")).toBeInTheDocument();
    expect(screen.getByText("Fixed")).toBeInTheDocument();
    expect(screen.getByText(/Fri Aug 1/)).toBeInTheDocument();
  });

  it("shows loading message", () => {
    renderWithProviders(
      <ReservationEventTemplateField
        templates={[]}
        loading
        value=""
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText("Loading schedules…")).toBeInTheDocument();
  });

  it("shows empty-state link when no templates", () => {
    renderWithProviders(
      <ReservationEventTemplateField
        templates={[]}
        loading={false}
        value=""
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText(/No reservation events yet/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /On Coming Events → Reservation event/i }),
    ).toHaveAttribute("href", expect.stringContaining("/admin/on-coming-events"));
  });

  it("calls onChange when selecting a template", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(
      <ReservationEventTemplateField
        templates={[makeReservationEventTemplate()]}
        loading={false}
        value=""
        onChange={onChange}
      />,
    );
    await user.selectOptions(screen.getByRole("combobox"), FIXTURE_TEMPLATE_ID);
    expect(onChange).toHaveBeenCalledWith(FIXTURE_TEMPLATE_ID);
  });

  it("disables select while loading or when disabled", () => {
    const { rerender } = renderWithProviders(
      <ReservationEventTemplateField
        templates={[makeReservationEventTemplate()]}
        loading
        value=""
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByRole("combobox")).toBeDisabled();

    rerender(
      <ReservationEventTemplateField
        templates={[makeReservationEventTemplate()]}
        loading={false}
        value=""
        onChange={vi.fn()}
        disabled
      />,
    );
    expect(screen.getByRole("combobox")).toBeDisabled();
  });
});
