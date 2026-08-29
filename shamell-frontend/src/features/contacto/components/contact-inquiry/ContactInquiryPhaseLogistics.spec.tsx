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

  it("opens date and time pickers when empty", async () => {
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
    await user.click(screen.getByRole("button", { name: /select end time/i }));
    expect(setTimePickerWhich).toHaveBeenCalledWith("end");
  });

  it("shows formatted date and times when set", () => {
    renderWithProviders(
      <ContactInquiryPhaseLogistics
        {...createMockContactInquiryPhaseProps({
          currentPhase: "logistics",
          data: makeWizardData({
            eventDate: "2030-08-01",
            eventTimeStart: "19:00",
            eventTimeEnd: "22:00",
          }),
        })}
      />,
    );
    expect(screen.getByText("Event date")).toBeInTheDocument();
    expect(screen.queryByText(/select date/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/select start time/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/select end time/i)).not.toBeInTheDocument();
  });

  it("updates guest count, location, address, and venue setting", async () => {
    const user = userEvent.setup();
    const update = vi.fn();
    renderWithProviders(
      <ContactInquiryPhaseLogistics
        {...createMockContactInquiryPhaseProps({
          currentPhase: "logistics",
          data: makeWizardData({
            guestCount: "",
            location: "",
            eventAddress: "",
            venueIndoor: "outdoor",
          }),
          update,
        })}
      />,
    );
    await user.type(screen.getByLabelText(/approx\. guest count/i), "1");
    expect(update).toHaveBeenCalledWith("guestCount", expect.any(String));
    await user.type(screen.getByLabelText(/city \/ venue/i), "M");
    expect(update).toHaveBeenCalledWith("location", expect.any(String));
    await user.type(screen.getByPlaceholderText(/street, suite/i), "A");
    expect(update).toHaveBeenCalledWith("eventAddress", expect.any(String));

    await user.click(screen.getByRole("radio", { name: /indoor/i }));
    expect(update).toHaveBeenCalledWith("venueIndoor", "indoor");
    await user.click(screen.getByRole("radio", { name: /prefer not to say/i }));
    expect(update).toHaveBeenCalledWith("venueIndoor", "");
  });

  it("selects outdoor venue", async () => {
    const user = userEvent.setup();
    const update = vi.fn();
    renderWithProviders(
      <ContactInquiryPhaseLogistics
        {...createMockContactInquiryPhaseProps({
          currentPhase: "logistics",
          data: makeWizardData({ venueIndoor: "indoor" }),
          update,
        })}
      />,
    );
    await user.click(screen.getByRole("radio", { name: /outdoor/i }));
    expect(update).toHaveBeenCalledWith("venueIndoor", "outdoor");
  });

  it("shows the bespoke deadline field when the rule applies", async () => {
    const user = userEvent.setup();
    const update = vi.fn();
    renderWithProviders(
      <ContactInquiryPhaseLogistics
        {...createMockContactInquiryPhaseProps({
          currentPhase: "logistics",
          logisticsUsesBespokeDeadlineRule: true,
          data: makeWizardData({ projectDeadlineNote: "" }),
          update,
        })}
      />,
    );
    expect(screen.getByText("Key date (if any)")).toBeInTheDocument();
    expect(screen.getByText(/project deadline or date window/i)).toBeInTheDocument();
    await user.type(screen.getByRole("textbox", { name: /project deadline/i }), "Soon");
    expect(update).toHaveBeenCalledWith("projectDeadlineNote", expect.any(String));
  });
});
