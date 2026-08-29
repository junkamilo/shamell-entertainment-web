/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useState } from "react";
import { makeContactLine, makeWizardData } from "../test/fixtures/contacto.fixture";
import { FIXTURE_CONTACT_LINE_ID, FIXTURE_OCCASION_ID } from "../test/fixtures/uuids.fixture";
import { emptyWizard, phaseFlow } from "../lib/inquiry/wizardValidation";
import type { Phase } from "../lib/inquiry/wizardTypes";
import type { WizardStateApi } from "./useContactInquiryWizard";
import { useContactInquiryWizard } from "./useContactInquiryWizard";

function useWizardHarness(
  args: Omit<Parameters<typeof useContactInquiryWizard>[0], "wizardState"> & {
    initialData?: ReturnType<typeof emptyWizard>;
    initialPhaseIndex?: number;
  },
) {
  const [data, setData] = useState(args.initialData ?? emptyWizard("GENERAL"));
  const [phaseIndex, setPhaseIndex] = useState(args.initialPhaseIndex ?? 0);
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

const contactLines = [makeContactLine()];

function baseArgs(
  overrides: Partial<Parameters<typeof useWizardHarness>[0]> = {},
): Parameters<typeof useWizardHarness>[0] {
  return {
    hadServiceTypeInUrl: false,
    hadEventIdInUrl: false,
    contactLines,
    catalogDismissed: false,
    catalogSnapshot: null,
    onResetSubmitFeedback: vi.fn(),
    onClearApiError: vi.fn(),
    ...overrides,
  };
}

describe("useContactInquiryWizard", () => {
  it("derives flow without experiences for general inquiries", () => {
    const { result } = renderHook(() =>
      useWizardHarness(baseArgs({ initialData: emptyWizard("GENERAL") })),
    );
    expect(result.current.flow).toEqual(phaseFlow("GENERAL"));
    expect(result.current.flow).not.toContain("experiences");
  });

  it("derives flow with experiences for gala inquiries", () => {
    const { result } = renderHook(() =>
      useWizardHarness(baseArgs({ initialData: emptyWizard("PRIVATE_GALA") })),
    );
    expect(result.current.flow).toContain("experiences");
  });

  it("clamps phaseIndex when the flow shrinks", () => {
    const { result } = renderHook(() =>
      useWizardHarness(
        baseArgs({
          initialData: emptyWizard("PRIVATE_GALA"),
          initialPhaseIndex: 7,
        }),
      ),
    );
    expect(result.current.phaseIndex).toBeLessThan(result.current.flow.length);
  });

  it("closes the occasion picker when leaving detail", () => {
    const { result } = renderHook(() =>
      useWizardHarness(
        baseArgs({
          initialData: {
            ...emptyWizard("GENERAL"),
            contactLineId: FIXTURE_CONTACT_LINE_ID,
          },
        }),
      ),
    );
    act(() => {
      result.current.setPhaseIndex(result.current.detailPhaseIndex);
    });
    act(() => {
      result.current.setOccasionPickerOpen(true);
    });
    expect(result.current.occasionPickerOpen).toBe(true);
    act(() => {
      result.current.goBack();
    });
    expect(result.current.occasionPickerOpen).toBe(false);
  });

  it("update writes a field and clears errors", () => {
    const onResetSubmitFeedback = vi.fn();
    const onClearApiError = vi.fn();
    const { result } = renderHook(() =>
      useWizardHarness(baseArgs({ onResetSubmitFeedback, onClearApiError })),
    );
    act(() => {
      result.current.setStepError("x");
    });
    act(() => {
      result.current.update("location", "Miami");
    });
    expect(result.current.data.location).toBe("Miami");
    expect(result.current.stepError).toBeNull();
    expect(onClearApiError).toHaveBeenCalled();
    expect(onResetSubmitFeedback).toHaveBeenCalled();
  });

  it("goNext validates before advancing", () => {
    const { result } = renderHook(() => useWizardHarness(baseArgs()));
    act(() => {
      result.current.goNext();
    });
    expect(result.current.stepError).toMatch(/select one of the catalog offerings/i);
    expect(result.current.phaseIndex).toBe(0);
  });

  it("goNext advances when current phase is valid", () => {
    const { result } = renderHook(() =>
      useWizardHarness(
        baseArgs({
          initialData: {
            ...emptyWizard("GENERAL"),
            contactLineId: FIXTURE_CONTACT_LINE_ID,
          },
        }),
      ),
    );
    act(() => {
      result.current.goNext();
    });
    expect(result.current.stepError).toBeNull();
    expect(result.current.phaseIndex).toBe(1);
  });

  it("goNext is a no-op when the phase index is out of range", () => {
    const { result } = renderHook(() => useWizardHarness(baseArgs()));
    act(() => {
      result.current.setPhaseIndex(99);
    });
    act(() => {
      result.current.goNext();
    });
    expect(result.current.phaseIndex).toBe(99);
  });

  it("goNext does not advance past the last phase", () => {
    const flow = phaseFlow("GENERAL");
    const { result } = renderHook(() =>
      useWizardHarness(
        baseArgs({
          initialData: makeWizardData({ inquiryCode: "GENERAL" }),
          initialPhaseIndex: flow.length - 1,
        }),
      ),
    );
    expect(result.current.currentPhase).toBe("review");
    act(() => {
      result.current.goNext();
    });
    expect(result.current.phaseIndex).toBe(flow.length - 1);
  });

  it("goBack decrements until the first step", () => {
    const { result } = renderHook(() =>
      useWizardHarness(baseArgs({ initialPhaseIndex: 2 })),
    );
    act(() => {
      result.current.goBack();
    });
    expect(result.current.phaseIndex).toBe(1);
    act(() => {
      result.current.goBack();
    });
    expect(result.current.phaseIndex).toBe(0);
    act(() => {
      result.current.goBack();
    });
    expect(result.current.phaseIndex).toBe(0);
  });

  it("goBack stays on detail when offering step is locked", () => {
    const detailIdx = phaseFlow("GENERAL").indexOf("detail");
    const { result } = renderHook(() =>
      useWizardHarness(
        baseArgs({
          initialData: {
            ...emptyWizard("GENERAL"),
            contactLineId: FIXTURE_CONTACT_LINE_ID,
          },
          hadEventIdInUrl: true,
        }),
      ),
    );
    act(() => {
      result.current.wizardState.setPhaseIndex(detailIdx);
    });
    act(() => {
      result.current.goBack();
    });
    expect(result.current.phaseIndex).toBe(detailIdx);
    expect(result.current.offeringStepLocked).toBe(true);
  });

  it("goToPhaseIndex clamps and respects a locked offering step", () => {
    const { result } = renderHook(() =>
      useWizardHarness(
        baseArgs({
          hadEventIdInUrl: true,
          initialPhaseIndex: 2,
        }),
      ),
    );
    act(() => {
      result.current.goToPhaseIndex(0);
    });
    expect(result.current.phaseIndex).toBe(2);
    act(() => {
      result.current.goToPhaseIndex(99);
    });
    expect(result.current.phaseIndex).toBe(result.current.flow.length - 1);
    act(() => {
      result.current.goToPhaseIndex(-1);
    });
    expect(result.current.phaseIndex).toBe(0);
  });

  it("toggleAddon adds and removes addons", () => {
    const { result } = renderHook(() =>
      useWizardHarness(baseArgs({ initialData: emptyWizard("PRIVATE_GALA") })),
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

  it("toggleUuidList adds and removes ids", () => {
    const { result } = renderHook(() => useWizardHarness(baseArgs()));
    act(() => {
      result.current.toggleUuidList("occasionTypeIdsProject", "p1");
    });
    expect(result.current.data.occasionTypeIdsProject).toEqual(["p1"]);
    act(() => {
      result.current.toggleUuidList("occasionTypeIdsProject", "p1");
    });
    expect(result.current.data.occasionTypeIdsProject).toEqual([]);
    act(() => {
      result.current.toggleUuidList("occasionTypeIdsRole", "r1");
    });
    expect(result.current.data.occasionTypeIdsRole).toEqual(["r1"]);
  });

  it("selectContactLine resets dependent fields", () => {
    const { result } = renderHook(() =>
      useWizardHarness(
        baseArgs({
          initialData: makeWizardData({
            inquiryCode: "GENERAL",
            occasionTypeId: FIXTURE_OCCASION_ID,
          }),
        }),
      ),
    );
    act(() => {
      result.current.selectContactLine(contactLines[0]!);
    });
    expect(result.current.data.contactLineId).toBe(FIXTURE_CONTACT_LINE_ID);
    expect(result.current.data.inquiryCode).toBe("");
    expect(result.current.data.occasionTypeId).toBe("");
    expect(result.current.phaseIndex).toBe(0);
  });

  it("selectContactLine keeps inquiry code from the URL and defaults line kind", () => {
    const { result } = renderHook(() =>
      useWizardHarness(
        baseArgs({
          hadServiceTypeInUrl: true,
          initialData: makeWizardData({ inquiryCode: "VIP_EVENT" }),
        }),
      ),
    );
    act(() => {
      result.current.selectContactLine({
        ...contactLines[0]!,
        lineKind: undefined,
      });
    });
    expect(result.current.data.inquiryCode).toBe("VIP_EVENT");
    expect(result.current.data.contactLineKind).toBe("event");
  });

  it("labels every wizard phase", () => {
    const { result } = renderHook(() => useWizardHarness(baseArgs()));
    const labels: Record<Phase, string> = {
      service: "Offering",
      detail: "Event or project",
      serviceType: "Service type",
      experiences: "Performance add-ons",
      logistics: "Date and venue",
      expectations: "Your vision",
      contact: "Contact",
      review: "Review",
    };
    for (const [phase, label] of Object.entries(labels) as [Phase, string][]) {
      expect(result.current.phaseLabel(phase)).toBe(label);
    }
    expect(result.current.phaseLabel("unknown" as Phase)).toBe("unknown");
  });
});
