/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { makeContactLine, makeWizardData } from "../test/fixtures/contacto.fixture";
import { FIXTURE_CONTACT_LINE_ID } from "../test/fixtures/uuids.fixture";

const replace = vi.fn();
const submitContactInquiryMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

vi.mock("../services/submitContactInquiry", () => ({
  submitContactInquiry: (...args: unknown[]) => submitContactInquiryMock(...args),
}));

const wizardMock = {
  data: makeWizardData(),
  setData: vi.fn(),
  phaseIndex: 0,
  setPhaseIndex: vi.fn(),
  stepError: null as string | null,
  setStepError: vi.fn(),
  flow: ["service", "detail", "serviceType", "logistics", "expectations", "contact", "review"],
  currentPhase: "review" as const,
  validationOpts: {
    catalogDismissed: false,
    catalogSnapshot: null,
    hadServiceTypeInUrl: false,
  },
  goNext: vi.fn(),
  goBack: vi.fn(),
  update: vi.fn(),
  canContinue: true,
};

const catalogMock = {
  contactLines: [makeContactLine()],
  catalogDismissed: false,
  catalogSnapshot: null,
  serviceTypeOptions: [],
  setCatalogSnapshot: vi.fn(),
  setCatalogDismissed: vi.fn(),
  setCatalogFetchError: vi.fn(),
  detailModal: null,
};

const availabilityMock = {
  datePickerOpen: false,
  setDatePickerOpen: vi.fn(),
  occupiedRanges: [],
};

vi.mock("./useContactInquiryWizard", () => ({
  useContactInquiryWizard: () => wizardMock,
}));

vi.mock("./useContactInquiryCatalog", () => ({
  useContactInquiryCatalog: () => catalogMock,
}));

vi.mock("./useContactInquiryAvailability", () => ({
  useContactInquiryAvailability: () => availabilityMock,
}));

import { useContactInquiryForm } from "./useContactInquiryForm";

describe("useContactInquiryForm", () => {
  beforeEach(() => {
    replace.mockClear();
    submitContactInquiryMock.mockReset();
    submitContactInquiryMock.mockResolvedValue({ ok: true });
    wizardMock.setStepError.mockClear();
    catalogMock.setCatalogSnapshot.mockClear();
    Object.assign(wizardMock, {
      data: makeWizardData({
        inquiryCode: "GENERAL",
        eventAddress: "123 Ocean Drive, Miami",
        occasionTypeId: "oc111111-1111-4111-8111-111111111111",
        serviceOptionIds: ["11111111-1111-4111-8111-111111111111"],
      }),
      stepError: null,
    });
  });

  it("composes wizard, catalog, and availability", () => {
    const { result } = renderHook(() =>
      useContactInquiryForm({ entrySource: "contact_page" }),
    );

    expect(result.current.wizard).toBe(wizardMock);
    expect(result.current.catalog).toBe(catalogMock);
    expect(result.current.availability).toBe(availabilityMock);
    expect(result.current.selectedLine?.id).toBe(FIXTURE_CONTACT_LINE_ID);
  });

  it("submits inquiry and shows done feedback", async () => {
    const { result } = renderHook(() =>
      useContactInquiryForm({ entrySource: "home_service_card" }),
    );

    await act(async () => {
      await result.current.onSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent<HTMLFormElement>);
    });

    expect(submitContactInquiryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        fullName: "Ada Lovelace",
        email: "ada@example.com",
        inquiryDetails: expect.objectContaining({ entrySource: "home_service_card" }),
      }),
    );
    expect(result.current.submitFeedbackPhase).toBe("done");
    expect(result.current.apiError).toBeNull();
  });

  it("sets apiError when submit fails", async () => {
    submitContactInquiryMock.mockResolvedValue({ ok: false, message: "Invalid payload" });

    const { result } = renderHook(() => useContactInquiryForm({}));
    await act(async () => {
      await result.current.onSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent<HTMLFormElement>);
    });

    expect(result.current.apiError).toBe("Invalid payload");
    expect(result.current.submitFeedbackPhase).toBe("idle");
  });

  it("sets step error when validation fails", async () => {
    Object.assign(wizardMock, {
      data: makeWizardData({ fullName: "A", email: "bad" }),
    });

    const { result } = renderHook(() => useContactInquiryForm({}));
    await act(async () => {
      await result.current.onSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent<HTMLFormElement>);
    });

    expect(submitContactInquiryMock).not.toHaveBeenCalled();
    expect(wizardMock.setStepError).toHaveBeenCalled();
    expect(result.current.isSubmitting).toBe(false);
  });

  it("handleInquirySubmitComplete resets wizard and navigates home", () => {
    const { result } = renderHook(() =>
      useContactInquiryForm({ initialServiceType: "VIP_EVENT" }),
    );

    act(() => {
      result.current.handleInquirySubmitComplete();
    });

    expect(catalogMock.setCatalogSnapshot).toHaveBeenCalledWith(null);
    expect(replace).toHaveBeenCalledWith("/");
  });
});
