/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMockContactInquiryPhaseProps } from "../../test/helpers/mockContactoPage";
import { renderWithProviders } from "../../test/utils/renderWithProviders";
import ContactInquiryPhaseExperiences from "./ContactInquiryPhaseExperiences";

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
