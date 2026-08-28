/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import {
  makeContactLine,
  makePublicServiceOption,
  makeWizardData,
} from "../../test/fixtures/contacto.fixture";
import { createMockContactInquiryPhaseProps } from "../../test/helpers/mockContactoPage";
import { renderWithProviders } from "../../test/utils/renderWithProviders";
import ContactInquiryPhaseReview from "./ContactInquiryPhaseReview";

function renderReview(
  overrides: Parameters<typeof createMockContactInquiryPhaseProps>[0] = {},
) {
  return renderWithProviders(
    <ContactInquiryPhaseReview
      {...createMockContactInquiryPhaseProps({
        currentPhase: "review",
        ...overrides,
      })}
    />,
  );
}

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
    renderReview({
      selectedLine: contactLine,
      data: makeWizardData({
        contactLineId: contactLine.id,
        fullName: "Ada Lovelace",
        email: "ada@example.com",
        phone: "+15551234567",
        occasionTypeId: "occ-1",
        eventAddress: "  12 Ocean Dr  ",
        guestCount: "80",
        venueIndoor: "indoor",
        projectDeadlineNote: "  Before August  ",
        experienceAddons: ["FIRE"],
        occasionTypeIdsProject: ["p1"],
        occasionTypeIdsRole: ["r1"],
      }),
      occasionSingleLabel: "Wedding",
      reviewProjectLabels: "Brand film",
      reviewRoleLabels: "Choreography",
    });
    expect(screen.getByText(/please confirm before sending/i)).toBeInTheDocument();
    expect(screen.getByText(contactLine.eventTypeName)).toBeInTheDocument();
    expect(screen.getByText(/ada lovelace · ada@example.com/i)).toBeInTheDocument();
    expect(screen.getByText(/roles:/i)).toBeInTheDocument();
    expect(screen.getByText(/choreography/i)).toBeInTheDocument();
    expect(screen.getByText("FIRE")).toBeInTheDocument();
    expect(screen.getByText(/address: 12 ocean dr/i)).toBeInTheDocument();
    expect(screen.getByText(/guests: 80/i)).toBeInTheDocument();
    expect(screen.getByText(/indoor/i)).toBeInTheDocument();
    expect(screen.getByText(/before august/i)).toBeInTheDocument();
  });

  it("falls back to ids and inquiry codes when labels are missing", () => {
    const service = makePublicServiceOption({ id: "svc-1", title: "Live set" });
    renderReview({
      selectedLine: undefined,
      serviceTypeOptions: [service],
      occasionSingleLabel: "",
      reviewProjectLabels: "",
      reviewRoleLabels: "",
      data: makeWizardData({
        contactLineId: "line-fallback",
        serviceOptionIds: ["svc-1", "PRIVATE_GALA", "UNKNOWN_SID"],
        inquiryCode: "BESPOKE",
        occasionTypeId: "occ-raw",
        occasionTypeIdsProject: ["p1"],
        occasionTypeIdsRole: [],
        experienceAddons: [],
        eventDate: "",
        eventTimeStart: "",
        eventTimeEnd: "",
        location: "",
        eventAddress: "   ",
        guestCount: "",
        venueIndoor: "",
        projectDeadlineNote: "   ",
        phone: "",
        fullName: "Ada",
        email: "a@b.com",
      }),
    });
    expect(screen.getByText("line-fallback")).toBeInTheDocument();
    expect(screen.getByText(/live set · private gala · unknown_sid/i)).toBeInTheDocument();
    expect(screen.getByText("occ-raw")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.getByText(/date: —/i)).toBeInTheDocument();
    expect(screen.getByText(/city \/ venue: —/i)).toBeInTheDocument();
    expect(screen.queryByText(/roles:/i)).not.toBeInTheDocument();
    expect(screen.getByText("Ada · a@b.com")).toBeInTheDocument();
  });

  it("uses the inquiry code when no service options are selected", () => {
    renderReview({
      data: makeWizardData({
        contactLineId: "",
        serviceOptionIds: [],
        inquiryCode: "VIP_EVENT",
        occasionTypeId: "",
        occasionTypeIdsProject: [],
        occasionTypeIdsRole: [],
      }),
    });
    expect(screen.getByText("VIP EVENT")).toBeInTheDocument();
    expect(screen.queryByText(/catalog line/i)).not.toBeInTheDocument();
  });

  it("omits service when neither options nor inquiry code are set", () => {
    renderReview({
      data: makeWizardData({
        contactLineId: "",
        serviceOptionIds: [],
        inquiryCode: "",
        occasionTypeId: "",
      }),
    });
    expect(screen.queryByText("SERVICE")).not.toBeInTheDocument();
  });

  it("shows outdoor venue and partial times", () => {
    renderReview({
      data: makeWizardData({
        eventDate: "2030-08-01",
        eventTimeStart: "",
        eventTimeEnd: "22:00",
        venueIndoor: "outdoor",
        location: "Miami",
        guestCount: "",
        phone: "",
      }),
    });
    expect(screen.getByText(/outdoor/i)).toBeInTheDocument();
    expect(screen.getByText(/time:/i)).toBeInTheDocument();
  });

  it("shows start time without end time", () => {
    renderReview({
      data: makeWizardData({
        eventTimeStart: "19:00",
        eventTimeEnd: "",
        venueIndoor: "indoor",
      }),
    });
    expect(screen.getByText(/time:/i)).toBeInTheDocument();
  });
});
