/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../test/utils/renderWithProviders";
import {
  makeAdminBookingRow,
  makeContactRequest,
} from "../../test/fixtures/peticiones.fixture";

vi.mock("@/features/admin/inquiries", () => ({
  InquiryDetailsReadable: ({
    sectionTitle,
  }: {
    sectionTitle: string;
  }) => <div data-testid="inquiry-details">{sectionTitle}</div>,
}));

vi.mock("../../lib/peticionesContactUtils", () => ({
  contactIsConciergeInquiry: () => false,
}));

import PeticionesRequestCardBookingBody from "./PeticionesRequestCardBookingBody";

describe("PeticionesRequestCardBookingBody", () => {
  it("shows booking details and client comment", () => {
    renderWithProviders(
      <PeticionesRequestCardBookingBody
        inquiryRows={[{ label: "Service", value: "Show" }]}
        clientComment="Looking forward to it."
        booking={makeAdminBookingRow()}
        contact={null}
        linkedContact={null}
      />,
    );
    expect(screen.getByTestId("inquiry-details")).toHaveTextContent(
      "BOOKING DETAILS",
    );
    expect(screen.getByText("CLIENT COMMENT")).toBeInTheDocument();
    expect(screen.getByText("Looking forward to it.")).toBeInTheDocument();
  });

  it("shows form details and message notes for contacts", () => {
    renderWithProviders(
      <PeticionesRequestCardBookingBody
        inquiryRows={[]}
        clientComment="Hello from the form."
        booking={null}
        contact={makeContactRequest()}
        linkedContact={null}
      />,
    );
    expect(screen.queryByTestId("inquiry-details")).not.toBeInTheDocument();
    expect(screen.getByText("MESSAGE / NOTES")).toBeInTheDocument();
    expect(screen.getByText("Hello from the form.")).toBeInTheDocument();
  });
});
