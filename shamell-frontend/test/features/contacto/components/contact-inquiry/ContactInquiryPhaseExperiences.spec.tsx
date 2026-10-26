/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMockContactInquiryPhaseProps } from "@test/features/contacto/support/helpers/mockContactoPage";
import { renderWithProviders } from "@test/features/contacto/support/helpers/renderWithProviders";
import ContactInquiryPhaseExperiences from "@/features/contacto/components/contact-inquiry/ContactInquiryPhaseExperiences";

describe("ContactInquiryPhaseExperiences", () => {
  it("renders nothing when phase is not experiences", () => {
    const { container } = renderWithProviders(
      <ContactInquiryPhaseExperiences
        {...createMockContactInquiryPhaseProps({ currentPhase: "service" })}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("toggles performance add-ons", async () => {
    const user = userEvent.setup();
    const toggleAddon = vi.fn();
    renderWithProviders(
      <ContactInquiryPhaseExperiences
        {...createMockContactInquiryPhaseProps({
          currentPhase: "experiences",
          toggleAddon,
        })}
      />,
    );
    expect(screen.getByText("Fire performance")).toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: /fire performance/i }));
    expect(toggleAddon).toHaveBeenCalledWith("FIRE");
  });
});
