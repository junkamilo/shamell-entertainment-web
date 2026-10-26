/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeWizardData } from "@test/features/contacto/support/fixtures/contacto.fixture";
import { createMockContactInquiryPhaseProps } from "@test/features/contacto/support/helpers/mockContactoPage";
import { renderWithProviders } from "@test/features/contacto/support/helpers/renderWithProviders";
import ContactInquiryPhaseExpectations from "@/features/contacto/components/contact-inquiry/ContactInquiryPhaseExpectations";

describe("ContactInquiryPhaseExpectations", () => {
  it("renders nothing when phase is not expectations", () => {
    const { container } = renderWithProviders(
      <ContactInquiryPhaseExpectations
        {...createMockContactInquiryPhaseProps({ currentPhase: "service" })}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("updates message through update helper", async () => {
    const user = userEvent.setup();
    const update = vi.fn();
    renderWithProviders(
      <ContactInquiryPhaseExpectations
        {...createMockContactInquiryPhaseProps({
          currentPhase: "expectations",
          data: makeWizardData({ message: "" }),
          update,
        })}
      />,
    );
    await user.type(
      screen.getByLabelText(/main description/i),
      "Our vision is an intimate gala.",
    );
    expect(update).toHaveBeenCalled();
  });
});
