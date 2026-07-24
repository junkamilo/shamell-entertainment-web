/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeWizardData } from "../../test/fixtures/contacto.fixture";
import { createMockContactInquiryPhaseProps } from "../../test/helpers/mockContactoPage";
import { renderWithProviders } from "../../test/utils/renderWithProviders";
import ContactInquiryPhaseContact from "./ContactInquiryPhaseContact";

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
          data: makeWizardData({ fullName: "", email: "" }),
          update,
        })}
      />,
    );
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    await user.type(screen.getByLabelText(/full name/i), "Ada");
    expect(update).toHaveBeenCalledWith("fullName", expect.any(String));
  });
});
