/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeContactLine, makeWizardData } from "../../test/fixtures/contacto.fixture";
import { FIXTURE_CONTACT_LINE_ID } from "../../test/fixtures/uuids.fixture";
import { createMockContactInquiryPhaseProps } from "../../test/helpers/mockContactoPage";
import { renderWithProviders } from "../../test/utils/renderWithProviders";
import ContactInquiryPhaseService from "./ContactInquiryPhaseService";

describe("ContactInquiryPhaseService", () => {
  it("renders nothing when phase is not service", () => {
    const { container } = renderWithProviders(
      <ContactInquiryPhaseService
        {...createMockContactInquiryPhaseProps({ currentPhase: "detail" })}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("lists catalog offerings and marks selected line", () => {
    const contactLine = makeContactLine();
    renderWithProviders(
      <ContactInquiryPhaseService
        {...createMockContactInquiryPhaseProps({
          currentPhase: "service",
          contactLines: [contactLine],
          data: makeWizardData({ contactLineId: contactLine.id }),
        })}
      />,
    );
    expect(screen.getByText(contactLine.eventTypeName)).toBeInTheDocument();
    expect(
      document.getElementById(`inquiry-contact-line-${contactLine.id}`),
    ).toBeChecked();
  });

  it("opens detail modal from eye button", async () => {
    const user = userEvent.setup();
    const contactLine = makeContactLine();
    const setDetailModal = vi.fn();
    renderWithProviders(
      <ContactInquiryPhaseService
        {...createMockContactInquiryPhaseProps({
          currentPhase: "service",
          contactLines: [contactLine],
          data: {
            ...createMockContactInquiryPhaseProps().data,
            contactLineId: FIXTURE_CONTACT_LINE_ID,
          },
          setDetailModal,
        })}
      />,
    );
    await user.click(
      screen.getByRole("button", {
        name: `View details for ${contactLine.eventTypeName}`,
      }),
    );
    expect(setDetailModal).toHaveBeenCalledWith({
      kind: "contactLine",
      line: contactLine,
    });
  });
});
