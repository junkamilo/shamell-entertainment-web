/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { makePublicServiceOption } from "../../test/fixtures/contacto.fixture";
import { createMockContactInquiryPhaseProps } from "../../test/helpers/mockContactoPage";
import { renderWithProviders } from "../../test/utils/renderWithProviders";
import ContactInquiryPhaseServiceType from "./ContactInquiryPhaseServiceType";

describe("ContactInquiryPhaseServiceType", () => {
  it("renders nothing when phase is not serviceType", () => {
    const { container } = renderWithProviders(
      <ContactInquiryPhaseServiceType
        {...createMockContactInquiryPhaseProps({ currentPhase: "service" })}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("lists service type options", () => {
    const service = makePublicServiceOption({ title: "Performance" });
    renderWithProviders(
      <ContactInquiryPhaseServiceType
        {...createMockContactInquiryPhaseProps({
          currentPhase: "serviceType",
          serviceTypeOptions: [service],
        })}
      />,
    );
    expect(screen.getByText("Performance")).toBeInTheDocument();
    expect(
      screen.getByText(/select all service types that apply/i),
    ).toBeInTheDocument();
  });
});
