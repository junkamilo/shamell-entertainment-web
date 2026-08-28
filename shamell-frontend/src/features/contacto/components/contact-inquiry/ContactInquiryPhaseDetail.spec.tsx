/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeContactLine, makeWizardData } from "../../test/fixtures/contacto.fixture";
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
          data: makeWizardData({ occasionTypeId: "occ-wedding" }),
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

  it("shows a placeholder when no occasion is selected", async () => {
    const user = userEvent.setup();
    const setOccasionPickerOpen = vi.fn();
    renderWithProviders(
      <ContactInquiryPhaseDetail
        {...createMockContactInquiryPhaseProps({
          currentPhase: "detail",
          selectedLine: makeContactLine(),
          occasionSingleLabel: "",
          data: makeWizardData({ occasionTypeId: "" }),
          setOccasionPickerOpen,
        })}
      />,
    );
    await user.click(screen.getByRole("button", { name: /select occasion/i }));
    expect(setOccasionPickerOpen).toHaveBeenCalledWith(true);
  });

  it("shows optional notes when the line has no occasion types", () => {
    renderWithProviders(
      <ContactInquiryPhaseDetail
        {...createMockContactInquiryPhaseProps({
          currentPhase: "detail",
          selectedLine: makeContactLine({ occasionSingle: [] }),
          data: makeWizardData({ inquiryCode: "PRIVATE_GALA" }),
        })}
      />,
    );
    expect(screen.getByText(/optional: add any occasion notes/i)).toBeInTheDocument();
    expect(screen.queryByText(/timeline \/ deadline notes/i)).not.toBeInTheDocument();
  });

  it("toggles bespoke project and role checkboxes and shows deadline notes", async () => {
    const user = userEvent.setup();
    const toggleUuidList = vi.fn();
    const update = vi.fn();
    const line = makeContactLine({
      occasionSingle: [],
      occasionBespokeProject: [{ id: "proj-1", name: "Brand film" }],
      occasionBespokeRole: [{ id: "role-1", name: "Choreography" }],
    });
    renderWithProviders(
      <ContactInquiryPhaseDetail
        {...createMockContactInquiryPhaseProps({
          currentPhase: "detail",
          selectedLine: line,
          toggleUuidList,
          update,
          data: makeWizardData({
            inquiryCode: "GENERAL",
            occasionTypeIdsProject: ["proj-1"],
            occasionTypeIdsRole: [],
            projectDeadlineNote: "",
          }),
        })}
      />,
    );
    expect(screen.getByText(/project focus/i)).toBeInTheDocument();
    expect(screen.getByText(/how can shamell contribute/i)).toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: /brand film/i }));
    expect(toggleUuidList).toHaveBeenCalledWith("occasionTypeIdsProject", "proj-1");
    await user.click(screen.getByRole("checkbox", { name: /choreography/i }));
    expect(toggleUuidList).toHaveBeenCalledWith("occasionTypeIdsRole", "role-1");
    await user.type(screen.getByLabelText(/timeline \/ deadline notes/i), "Q");
    expect(update).toHaveBeenCalledWith("projectDeadlineNote", expect.any(String));
  });

  it("shows deadline notes for a bespoke inquiry even without occasion lists", () => {
    renderWithProviders(
      <ContactInquiryPhaseDetail
        {...createMockContactInquiryPhaseProps({
          currentPhase: "detail",
          selectedLine: makeContactLine({
            occasionSingle: [],
            occasionBespokeProject: [],
            occasionBespokeRole: [],
          }),
          data: makeWizardData({ inquiryCode: "BESPOKE" }),
        })}
      />,
    );
    expect(screen.getByText(/timeline \/ deadline notes/i)).toBeInTheDocument();
  });

  it("handles a missing selected line", () => {
    renderWithProviders(
      <ContactInquiryPhaseDetail
        {...createMockContactInquiryPhaseProps({
          currentPhase: "detail",
          selectedLine: undefined,
          data: makeWizardData({ inquiryCode: "GENERAL" }),
        })}
      />,
    );
    expect(screen.getByText(/optional: add any occasion notes/i)).toBeInTheDocument();
  });
});
