/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  makePublicServiceOption,
  makeWizardData,
} from "../../test/fixtures/contacto.fixture";
import { createMockContactInquiryPhaseProps } from "../../test/helpers/mockContactoPage";
import { renderWithProviders } from "../../test/utils/renderWithProviders";
import type { WizardData } from "../../lib/inquiry/wizardTypes";
import ContactInquiryPhaseServiceType from "./ContactInquiryPhaseServiceType";

function applySetData(
  setData: ReturnType<typeof vi.fn>,
  prev: WizardData,
) {
  const updater = setData.mock.calls[0]![0] as (current: WizardData) => WizardData;
  return updater(prev);
}

describe("ContactInquiryPhaseServiceType", () => {
  it("renders nothing when phase is not serviceType", () => {
    const { container } = renderWithProviders(
      <ContactInquiryPhaseServiceType
        {...createMockContactInquiryPhaseProps({ currentPhase: "service" })}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("lists catalog options with price and selected styling", () => {
    const service = makePublicServiceOption({ title: "Performance", price: 1500 });
    renderWithProviders(
      <ContactInquiryPhaseServiceType
        {...createMockContactInquiryPhaseProps({
          currentPhase: "serviceType",
          serviceTypeOptions: [service],
          data: makeWizardData({ serviceOptionIds: [service.id] }),
        })}
      />,
    );
    expect(screen.getByText("Performance")).toBeInTheDocument();
    expect(screen.getByText(/Guide from 1,500 USD/)).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  it("omits the guide price when the option has no price", () => {
    const service = makePublicServiceOption({ price: null });
    renderWithProviders(
      <ContactInquiryPhaseServiceType
        {...createMockContactInquiryPhaseProps({
          currentPhase: "serviceType",
          serviceTypeOptions: [service],
        })}
      />,
    );
    expect(screen.queryByText(/Guide from/)).not.toBeInTheDocument();
  });

  it("selects and deselects a catalog option", async () => {
    const user = userEvent.setup();
    const service = makePublicServiceOption();
    const prev = makeWizardData({ serviceOptionIds: [] });
    const setData = vi.fn((updater: (current: WizardData) => WizardData) =>
      updater(prev),
    );
    const setStepError = vi.fn();
    const { rerender } = renderWithProviders(
      <ContactInquiryPhaseServiceType
        {...createMockContactInquiryPhaseProps({
          currentPhase: "serviceType",
          serviceTypeOptions: [service],
          data: prev,
          setData,
          setStepError,
        })}
      />,
    );

    await user.click(screen.getByRole("checkbox"));
    expect(setStepError).toHaveBeenCalledWith(null);
    expect(applySetData(setData, prev).serviceOptionIds).toEqual([service.id]);

    const selected = makeWizardData({ serviceOptionIds: [service.id] });
    setData.mockClear();
    rerender(
      <ContactInquiryPhaseServiceType
        {...createMockContactInquiryPhaseProps({
          currentPhase: "serviceType",
          serviceTypeOptions: [service],
          data: selected,
          setData,
          setStepError,
        })}
      />,
    );
    await user.click(screen.getByRole("checkbox"));
    expect(applySetData(setData, selected).serviceOptionIds).toEqual([]);
  });

  it("opens the service detail modal from the eye button", async () => {
    const user = userEvent.setup();
    const service = makePublicServiceOption({ title: "Performance" });
    const setDetailModal = vi.fn();
    renderWithProviders(
      <ContactInquiryPhaseServiceType
        {...createMockContactInquiryPhaseProps({
          currentPhase: "serviceType",
          serviceTypeOptions: [service],
          setDetailModal,
        })}
      />,
    );
    await user.click(
      screen.getByRole("button", { name: "View details for Performance" }),
    );
    expect(setDetailModal).toHaveBeenCalledWith({
      kind: "service",
      option: service,
    });
  });

  it("falls back to inquiry codes when the catalog is empty", async () => {
    const user = userEvent.setup();
    const prev = makeWizardData({ serviceOptionIds: ["PRIVATE_GALA"] });
    const setData = vi.fn((updater: (current: WizardData) => WizardData) =>
      updater(prev),
    );
    const setStepError = vi.fn();
    renderWithProviders(
      <ContactInquiryPhaseServiceType
        {...createMockContactInquiryPhaseProps({
          currentPhase: "serviceType",
          serviceTypeOptions: [],
          data: prev,
          setData,
          setStepError,
        })}
      />,
    );

    expect(screen.getByText("PRIVATE GALA")).toBeInTheDocument();
    expect(screen.getByText("VIP EVENT")).toBeInTheDocument();
    expect(
      screen.getAllByText(/Detailed catalog pricing loads/i).length,
    ).toBeGreaterThan(0);
    expect(screen.getByRole("checkbox", { name: /PRIVATE GALA/i })).toBeChecked();

    await user.click(screen.getByRole("checkbox", { name: /PRIVATE GALA/i }));
    expect(setStepError).toHaveBeenCalledWith(null);
    expect(applySetData(setData, prev).serviceOptionIds).toEqual([]);

    setData.mockClear();
    await user.click(screen.getByRole("checkbox", { name: /VIP EVENT/i }));
    expect(applySetData(setData, prev).serviceOptionIds).toEqual([
      "PRIVATE_GALA",
      "VIP_EVENT",
    ]);
  });
});
