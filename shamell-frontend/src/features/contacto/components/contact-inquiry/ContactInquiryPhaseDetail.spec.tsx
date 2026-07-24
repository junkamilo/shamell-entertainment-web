/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeContactLine } from "../../test/fixtures/contacto.fixture";
import { createMockContactInquiryPhaseProps } from "../../test/helpers/mockContactoPage";
import { renderWithProviders } from "../../test/utils/renderWithProviders";
import ContactInquiryPhaseDetail from "./ContactInquiryPhaseDetail";

describe("ContactInquiryPhaseDetail", () => {
  it("renders nothing when phase is not detail", () => {
    const { container } = renderWithProviders(
      <ContactInquiryPhaseDetail
        {...createMockContactInquiryPhaseProps({ currentPhase: "service" })}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("opens occasion picker when occasions exist", async () => {
    const user = userEvent.setup();
    const setOccasionPickerOpen = vi.fn();
    const contactLine = makeContactLine();
    renderWithProviders(
      <ContactInquiryPhaseDetail
        {...createMockContactInquiryPhaseProps({
          currentPhase: "detail",
          selectedLine: contactLine,
          occasionSingleLabel: "Wedding",
          setOccasionPickerOpen,
        })}
      />,
    );
    expect(
      screen.getByText(/what kind of occasion are you hosting/i),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /wedding/i }));
    expect(setOccasionPickerOpen).toHaveBeenCalledWith(true);
  });
});
