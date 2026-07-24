/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useState } from "react";
import { makeContactLine, makeWizardData } from "../test/fixtures/contacto.fixture";
import { FIXTURE_CONTACT_LINE_ID, FIXTURE_OCCASION_ID } from "../test/fixtures/uuids.fixture";
import { emptyWizard, phaseFlow } from "../lib/inquiry/wizardValidation";
import type { WizardStateApi } from "./useContactInquiryWizard";
import { useContactInquiryWizard } from "./useContactInquiryWizard";

function useWizardHarness(
  args: Omit<Parameters<typeof useContactInquiryWizard>[0], "wizardState"> & {
    initialData?: ReturnType<typeof emptyWizard>;
  },
) {
  const [data, setData] = useState(args.initialData ?? emptyWizard("GENERAL"));
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [stepError, setStepError] = useState<string | null>(null);
  const resetWizard = vi.fn((serviceType?: Parameters<WizardStateApi["resetWizard"]>[0]) => {
    setData(emptyWizard(serviceType));
    setPhaseIndex(0);
    setStepError(null);
  });

  const wizardState: WizardStateApi = {
    data,
    setData,
    phaseIndex,
    setPhaseIndex,
    stepError,
    setStepError,
    resetWizard,
  };

  const hook = useContactInquiryWizard({ ...args, wizardState });
  return { ...hook, wizardState };
}

describe("useContactInquiryWizard", () => {
  const onResetSubmitFeedback = vi.fn();
  const onClearApiError = vi.fn();
  const contactLines = [makeContactLine()];

  beforeEach(() => {
    onResetSubmitFeedback.mockClear();
    onClearApiError.mockClear();
  });

  it("derives flow without experiences for general inquiries", () => {
    const { result } = renderHook(() =>
      useWizardHarness({
        initialData: emptyWizard("GENERAL"),
        hadServiceTypeInUrl: false,
        hadEventIdInUrl: false,
        contactLines,
        catalogDismissed: false,
        catalogSnapshot: null,
        onResetSubmitFeedback,
        onClearApiError,
      }),
    );

    expect(result.current.flow).toEqual(phaseFlow("GENERAL"));
    expect(result.current.flow).not.toContain("experiences");
  });

  it("derives flow with experiences for gala inquiries", () => {
    const { result } = renderHook(() =>
      useWizardHarness({
        initialData: emptyWizard("PRIVATE_GALA"),
        hadServiceTypeInUrl: false,
        hadEventIdInUrl: false,
        contactLines,
        catalogDismissed: false,
        catalogSnapshot: null,
        onResetSubmitFeedback,
        onClearApiError,
      }),
    );

    expect(result.current.flow).toContain("experiences");
  });

  it("goNext validates before advancing", () => {
    const { result } = renderHook(() =>
      useWizardHarness({
        hadServiceTypeInUrl: false,
        hadEventIdInUrl: false,
        contactLines,
        catalogDismissed: false,
        catalogSnapshot: null,
        onResetSubmitFeedback,
        onClearApiError,
      }),
    );

    act(() => {
      result.current.goNext();
    });

    expect(result.current.stepError).toMatch(/select one of the catalog offerings/i);
    expect(result.current.phaseIndex).toBe(0);
  });

  it("goNext advances when current phase is valid", () => {
    const { result } = renderHook(() =>
      useWizardHarness({
        initialData: {
          ...emptyWizard("GENERAL"),
          contactLineId: FIXTURE_CONTACT_LINE_ID,
        },
        hadServiceTypeInUrl: false,
        hadEventIdInUrl: false,
        contactLines,
        catalogDismissed: false,
        catalogSnapshot: null,
        onResetSubmitFeedback,
        onClearApiError,
      }),
    );

    act(() => {
      result.current.goNext();
    });

    expect(result.current.stepError).toBeNull();
    expect(result.current.phaseIndex).toBe(1);
  });

  it("selectContactLine resets dependent fields", () => {
    const { result } = renderHook(() =>
      useWizardHarness({
        initialData: makeWizardData({
          inquiryCode: "GENERAL",
          occasionTypeId: FIXTURE_OCCASION_ID,
        }),
        hadServiceTypeInUrl: false,
        hadEventIdInUrl: false,
        contactLines,
        catalogDismissed: false,
        catalogSnapshot: null,
        onResetSubmitFeedback,
        onClearApiError,
      }),
    );

    act(() => {
      result.current.selectContactLine(contactLines[0]!);
    });

    expect(result.current.data.contactLineId).toBe(FIXTURE_CONTACT_LINE_ID);
    expect(result.current.data.inquiryCode).toBe("");
    expect(result.current.data.occasionTypeId).toBe("");
    expect(result.current.phaseIndex).toBe(0);
  });

  it("toggleAddon adds and removes addons", () => {
    const { result } = renderHook(() =>
      useWizardHarness({
        initialData: emptyWizard("PRIVATE_GALA"),
        hadServiceTypeInUrl: false,
        hadEventIdInUrl: false,
        contactLines,
        catalogDismissed: false,
        catalogSnapshot: null,
        onResetSubmitFeedback,
        onClearApiError,
      }),
    );

    act(() => {
      result.current.toggleAddon("FIRE");
    });
    expect(result.current.data.experienceAddons).toEqual(["FIRE"]);

    act(() => {
      result.current.toggleAddon("FIRE");
    });
    expect(result.current.data.experienceAddons).toEqual([]);
  });

  it("goBack stays on detail when offering step is locked", () => {
    const detailIdx = phaseFlow("GENERAL").indexOf("detail");
    const { result } = renderHook(() =>
      useWizardHarness({
        initialData: {
          ...emptyWizard("GENERAL"),
          contactLineId: FIXTURE_CONTACT_LINE_ID,
        },
        hadServiceTypeInUrl: false,
        hadEventIdInUrl: true,
        contactLines,
        catalogDismissed: false,
        catalogSnapshot: null,
        onResetSubmitFeedback,
        onClearApiError,
      }),
    );

    act(() => {
      result.current.wizardState.setPhaseIndex(detailIdx);
    });
    expect(result.current.phaseIndex).toBe(detailIdx);

    act(() => {
      result.current.goBack();
    });
    expect(result.current.phaseIndex).toBe(detailIdx);
  });
});
