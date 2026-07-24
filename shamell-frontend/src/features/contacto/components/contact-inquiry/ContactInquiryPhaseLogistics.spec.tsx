/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeWizardData } from "../../test/fixtures/contacto.fixture";
import { createMockContactInquiryPhaseProps } from "../../test/helpers/mockContactoPage";
import { renderWithProviders } from "../../test/utils/renderWithProviders";
import ContactInquiryPhaseLogistics from "./ContactInquiryPhaseLogistics";

describe("ContactInquiryPhaseLogistics", () => {
  it("renders nothing when phase is not logistics", () => {
    const { container } = renderWithProviders(
      <ContactInquiryPhaseLogistics
        {...createMockContactInquiryPhaseProps({ currentPhase: "service" })}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("opens date and time pickers", async () => {
    const user = userEvent.setup();
    const setDatePickerOpen = vi.fn();
    const setTimePickerWhich = vi.fn();
    renderWithProviders(
      <ContactInquiryPhaseLogistics
        {...createMockContactInquiryPhaseProps({
          currentPhase: "logistics",
          data: makeWizardData({ eventDate: "", eventTimeStart: "", eventTimeEnd: "" }),
          setDatePickerOpen,
          setTimePickerWhich,
        })}
      />,
    );
    await user.click(screen.getByRole("button", { name: /select date/i }));
    expect(setDatePickerOpen).toHaveBeenCalledWith(true);
    await user.click(screen.getByRole("button", { name: /select start time/i }));
    expect(setTimePickerWhich).toHaveBeenCalledWith("start");
  });
});
