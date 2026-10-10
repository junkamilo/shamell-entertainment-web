/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeWizardData } from "@test/features/contacto/support/fixtures/contacto.fixture";
import { createMockContactInquiryPhaseProps } from "@test/features/contacto/support/helpers/mockContactoPage";
import { renderWithProviders } from "@test/features/contacto/support/helpers/renderWithProviders";
import ContactInquiryPhaseContact from "@/features/contacto/components/contact-inquiry/ContactInquiryPhaseContact";

describe("ContactInquiryPhaseContact", () => {
  it("renders nothing when phase is not contact", () => {
    const { container } = renderWithProviders(
      <ContactInquiryPhaseContact
        {...createMockContactInquiryPhaseProps({ currentPhase: "service" })}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders contact fields and updates values", async () => {
    const user = userEvent.setup();
    const update = vi.fn();
    renderWithProviders(
      <ContactInquiryPhaseContact
        {...createMockContactInquiryPhaseProps({
          currentPhase: "contact",
          data: makeWizardData({ fullName: "", email: "", phone: "" }),
          update,
        })}
      />,
    );
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByText(/optional — include country code/i)).toBeInTheDocument();
    await user.type(screen.getByLabelText(/full name/i), "A");
    expect(update).toHaveBeenCalledWith("fullName", expect.any(String));
    await user.type(screen.getByLabelText(/^email/i), "a");
    expect(update).toHaveBeenCalledWith("email", expect.any(String));
    await user.type(screen.getByLabelText(/^phone/i), "1");
    expect(update).toHaveBeenCalledWith("phone", expect.any(String));
  });
});
