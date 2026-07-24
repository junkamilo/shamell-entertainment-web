/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { makeContactLine, makeWizardData } from "../../test/fixtures/contacto.fixture";
import { createMockContactInquiryPhaseProps } from "../../test/helpers/mockContactoPage";
import { renderWithProviders } from "../../test/utils/renderWithProviders";
import ContactInquiryPhaseReview from "./ContactInquiryPhaseReview";

describe("ContactInquiryPhaseReview", () => {
  it("renders nothing when phase is not review", () => {
    const { container } = renderWithProviders(
      <ContactInquiryPhaseReview
        {...createMockContactInquiryPhaseProps({ currentPhase: "service" })}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("summarizes wizard data for confirmation", () => {
    const contactLine = makeContactLine();
    renderWithProviders(
      <ContactInquiryPhaseReview
        {...createMockContactInquiryPhaseProps({
          currentPhase: "review",
          selectedLine: contactLine,
          data: makeWizardData({
            contactLineId: contactLine.id,
            fullName: "Ada Lovelace",
            email: "ada@example.com",
          }),
          occasionSingleLabel: "Wedding",
        })}
      />,
    );
    expect(screen.getByText(/please confirm before sending/i)).toBeInTheDocument();
    expect(screen.getByText(contactLine.eventTypeName)).toBeInTheDocument();
    expect(screen.getByText(/ada lovelace · ada@example.com/i)).toBeInTheDocument();
  });
});
