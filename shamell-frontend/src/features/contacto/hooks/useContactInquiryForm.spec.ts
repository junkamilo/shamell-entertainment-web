/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import {
  makeCatalogSnapshot,
  makeContactLine,
  makePublicServiceOption,
  makeWizardData,
} from "../test/fixtures/contacto.fixture";
import {
  FIXTURE_CONTACT_LINE_ID,
  FIXTURE_OCCASION_ID,
  FIXTURE_SERVICE_ID,
} from "../test/fixtures/uuids.fixture";

const replace = vi.fn();
const submitContactInquiryMock = vi.fn();
let wizardFactoryArgs: { onResetSubmitFeedback?: () => void; onClearApiError?: () => void } = {};

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
  catalogSnapshot: null as ReturnType<typeof makeCatalogSnapshot> | null,
  serviceTypeOptions: [] as ReturnType<typeof makePublicServiceOption>[],
  setCatalogSnapshot: vi.fn(),
  setCatalogDismissed: vi.fn(),
  setCatalogFetchError: vi.fn(),
  detailModal: null as
    | null
    | { kind: "contactLine"; line: ReturnType<typeof makeContactLine> }
    | { kind: "service"; option: ReturnType<typeof makePublicServiceOption> },
};

const availabilityMock = {
  datePickerOpen: false,
  setDatePickerOpen: vi.fn(),
  occupiedRanges: [],
};

vi.mock("./useContactInquiryWizard", () => ({
  useContactInquiryWizard: (args: typeof wizardFactoryArgs) => {
    wizardFactoryArgs = args;
    return wizardMock;
  },
}));

vi.mock("./useContactInquiryCatalog", () => ({
  useContactInquiryCatalog: () => catalogMock,
}));

vi.mock("./useContactInquiryAvailability", () => ({
  useContactInquiryAvailability: () => availabilityMock,
}));

import { useContactInquiryForm } from "./useContactInquiryForm";

function validSubmitData(
  overrides: Parameters<typeof makeWizardData>[0] = {},
) {
  return makeWizardData({
    inquiryCode: "GENERAL",
    eventAddress: "123 Ocean Drive, Miami",
    occasionTypeId: FIXTURE_OCCASION_ID,
    serviceOptionIds: [FIXTURE_SERVICE_ID],
    ...overrides,
  });
}

describe("useContactInquiryForm", () => {
  beforeEach(() => {
    replace.mockClear();
    submitContactInquiryMock.mockReset();
    submitContactInquiryMock.mockResolvedValue({ ok: true });
    wizardMock.setStepError.mockClear();
    catalogMock.setCatalogSnapshot.mockClear();
    catalogMock.setCatalogDismissed.mockClear();
    catalogMock.setCatalogFetchError.mockClear();
    catalogMock.contactLines = [makeContactLine()];
    catalogMock.catalogDismissed = false;
    catalogMock.catalogSnapshot = null;
    catalogMock.serviceTypeOptions = [];
    catalogMock.detailModal = null;
    Object.assign(wizardMock, {
      data: validSubmitData(),
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
    expect(result.current.occasionSingleLabel).toBe("Wedding");
  });

  it("submits inquiry and shows done feedback", async () => {
    wizardMock.data = validSubmitData({
      phone: "   ",
      inquiryCode: "",
    });
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
        phone: undefined,
        serviceType: undefined,
        inquiryDetails: expect.objectContaining({ entrySource: "home_service_card" }),
      }),
    );
    expect(result.current.submitFeedbackPhase).toBe("done");
    expect(result.current.apiError).toBeNull();
  });

  it("omits empty event date for a bespoke deadline note", async () => {
    wizardMock.data = validSubmitData({
      inquiryCode: "BESPOKE",
      eventDate: "",
      eventTimeStart: "",
      eventTimeEnd: "",
      projectDeadlineNote: "Need it in June",
    });
    const { result } = renderHook(() => useContactInquiryForm({}));
    await act(async () => {
      await result.current.onSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent<HTMLFormElement>);
    });
    expect(submitContactInquiryMock).toHaveBeenCalledWith(
      expect.objectContaining({ eventDate: undefined, serviceType: "BESPOKE" }),
    );
  });

  it("omits dismissed catalog from inquiry details", async () => {
    catalogMock.catalogDismissed = true;
    catalogMock.catalogSnapshot = makeCatalogSnapshot();
    const { result } = renderHook(() => useContactInquiryForm({}));
    await act(async () => {
      await result.current.onSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent<HTMLFormElement>);
    });
    expect(submitContactInquiryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        inquiryDetails: expect.not.objectContaining({ sourceCatalogId: expect.anything() }),
      }),
    );
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

  it("sets a network error when submit throws", async () => {
    submitContactInquiryMock.mockRejectedValue(new Error("offline"));
    const { result } = renderHook(() => useContactInquiryForm({}));
    await act(async () => {
      await result.current.onSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent<HTMLFormElement>);
    });
    expect(result.current.apiError).toBe(
      "Cannot reach the server. Check that the API is running.",
    );
    expect(result.current.submitFeedbackPhase).toBe("idle");
  });

  it("ignores a second submit while one is in flight", async () => {
    let resolveSubmit: ((value: { ok: true }) => void) | undefined;
    submitContactInquiryMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSubmit = resolve;
        }),
    );
    const { result } = renderHook(() => useContactInquiryForm({}));
    const event = { preventDefault: vi.fn() } as unknown as React.FormEvent<HTMLFormElement>;
    let first: Promise<void> | undefined;
    act(() => {
      first = result.current.onSubmit(event);
    });
    await act(async () => {
      await result.current.onSubmit(event);
    });
    expect(submitContactInquiryMock).toHaveBeenCalledTimes(1);
    await act(async () => {
      resolveSubmit?.({ ok: true });
      await first;
    });
  });

  it("sets step error when contact validation fails", async () => {
    wizardMock.data = validSubmitData({ fullName: "A", email: "bad" });
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

  it("sets step error from expectations when contact is valid", async () => {
    wizardMock.data = validSubmitData({ message: "short" });
    const { result } = renderHook(() => useContactInquiryForm({}));
    await act(async () => {
      await result.current.onSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent<HTMLFormElement>);
    });
    expect(wizardMock.setStepError).toHaveBeenCalledWith(
      expect.stringMatching(/at least 10 characters/i),
    );
  });

  it("sets step error from logistics when contact and vision are valid", async () => {
    wizardMock.data = validSubmitData({ location: "", eventAddress: "" });
    const { result } = renderHook(() => useContactInquiryForm({}));
    await act(async () => {
      await result.current.onSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent<HTMLFormElement>);
    });
    expect(wizardMock.setStepError).toHaveBeenCalledWith(
      expect.stringMatching(/city \/ venue is required/i),
    );
  });

  it("handleInquirySubmitComplete resets wizard and navigates home", () => {
    const { result } = renderHook(() =>
      useContactInquiryForm({ initialServiceType: "VIP_EVENT" }),
    );
    act(() => {
      result.current.handleInquirySubmitComplete();
    });
    expect(catalogMock.setCatalogSnapshot).toHaveBeenCalledWith(null);
    expect(catalogMock.setCatalogDismissed).toHaveBeenCalledWith(false);
    expect(catalogMock.setCatalogFetchError).toHaveBeenCalledWith(null);
    expect(replace).toHaveBeenCalledWith("/");
  });

  it("invokes submit-feedback and api-error resets from the wizard", () => {
    const { result } = renderHook(() => useContactInquiryForm({}));
    act(() => {
      result.current.onSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent<HTMLFormElement>);
    });
    act(() => {
      wizardFactoryArgs.onResetSubmitFeedback?.();
      wizardFactoryArgs.onClearApiError?.();
    });
    expect(result.current.submitFeedbackPhase).toBe("idle");
    expect(result.current.apiError).toBeNull();
  });

  it("flags bespoke logistics from occasion groups", () => {
    catalogMock.contactLines = [
      makeContactLine({
        occasionBespokeProject: [{ id: "p1", name: "Brand film" }],
        occasionBespokeRole: [{ id: "r1", name: "Choreography" }],
      }),
    ];
    wizardMock.data = validSubmitData({
      occasionTypeIdsProject: ["p1", "missing"],
      occasionTypeIdsRole: ["r1", "missing-role"],
    });
    const { result } = renderHook(() => useContactInquiryForm({}));
    expect(result.current.lineHasBespokeGroups).toBe(true);
    expect(result.current.logisticsUsesBespokeDeadlineRule).toBe(true);
    expect(result.current.reviewProjectLabels).toContain("Brand film");
    expect(result.current.reviewProjectLabels).toContain("missing");
    expect(result.current.reviewRoleLabels).toContain("Choreography");
  });

  it("builds pricing from the selected line and catalog services", () => {
    catalogMock.serviceTypeOptions = [
      makePublicServiceOption({ id: FIXTURE_SERVICE_ID, title: "Show", price: 1500 }),
      makePublicServiceOption({ id: "svc-na", title: "Open", price: null }),
    ];
    wizardMock.data = validSubmitData({
      serviceOptionIds: [FIXTURE_SERVICE_ID, "svc-na"],
    });
    const { result } = renderHook(() => useContactInquiryForm({}));
    expect(result.current.pricingPreviewEventLine).toEqual({
      name: "Private weddings",
      price: 2500,
    });
    expect(result.current.pricingPreviewServiceLines).toEqual([
      { name: "Show", price: 1500 },
      { name: "Open", price: null },
    ]);
    expect(result.current.pricingGuidePreview).toEqual({
      totalUsd: 4000,
      isPartial: true,
    });
    expect(result.current.pricingPreviewOccasionLines.some((l) => l.name === "Wedding")).toBe(
      true,
    );
  });

  it("falls back to event catalog snapshot and inquiry-code services", () => {
    catalogMock.contactLines = [];
    catalogMock.catalogSnapshot = makeCatalogSnapshot({ kind: "event", title: "Gala" });
    wizardMock.data = validSubmitData({
      contactLineId: "",
      serviceOptionIds: ["PRIVATE_GALA", "not-a-code"],
      occasionTypeId: "",
    });
    const { result } = renderHook(() => useContactInquiryForm({}));
    expect(result.current.pricingPreviewEventLine).toEqual({ name: "Gala", price: null });
    expect(result.current.pricingPreviewServiceLines).toEqual([
      { name: "PRIVATE GALA", price: null },
    ]);
    expect(result.current.pricingGuidePreview?.isPartial).toBe(true);
    expect(result.current.pricingGuidePreview?.totalUsd).toBeNull();
  });

  it("builds a services-only pricing guide", () => {
    catalogMock.contactLines = [];
    catalogMock.catalogDismissed = true;
    catalogMock.serviceTypeOptions = [
      makePublicServiceOption({ id: FIXTURE_SERVICE_ID, title: "Show", price: 99.99 }),
    ];
    wizardMock.data = validSubmitData({
      contactLineId: "",
      serviceOptionIds: [FIXTURE_SERVICE_ID],
    });
    const { result } = renderHook(() => useContactInquiryForm({}));
    expect(result.current.pricingPreviewEventLine).toBeNull();
    expect(result.current.pricingGuidePreview).toEqual({
      totalUsd: 99.99,
      isPartial: false,
    });
  });

  it("ignores a non-event catalog snapshot for event pricing", () => {
    catalogMock.contactLines = [];
    catalogMock.catalogDismissed = false;
    catalogMock.catalogSnapshot = makeCatalogSnapshot({ kind: "service" });
    wizardMock.data = validSubmitData({ contactLineId: "", serviceOptionIds: [] });
    const { result } = renderHook(() => useContactInquiryForm({}));
    expect(result.current.pricingPreviewEventLine).toBeNull();
  });

  it("returns no pricing guide without event or services", () => {
    catalogMock.contactLines = [];
    catalogMock.catalogDismissed = true;
    wizardMock.data = validSubmitData({
      contactLineId: "",
      serviceOptionIds: [],
    });
    const { result } = renderHook(() => useContactInquiryForm({}));
    expect(result.current.pricingPreviewEventLine).toBeNull();
    expect(result.current.pricingGuidePreview).toBeNull();
  });

  it("uses null when the selected line has no price", () => {
    catalogMock.contactLines = [makeContactLine({ price: undefined })];
    wizardMock.data = validSubmitData({ serviceOptionIds: [] });
    const { result } = renderHook(() => useContactInquiryForm({}));
    expect(result.current.pricingPreviewEventLine?.price).toBeNull();
  });

  it("treats NaN event and service prices as partial", () => {
    catalogMock.contactLines = [makeContactLine({ price: Number.NaN })];
    catalogMock.serviceTypeOptions = [
      makePublicServiceOption({ id: FIXTURE_SERVICE_ID, price: Number.NaN }),
    ];
    wizardMock.data = validSubmitData({ serviceOptionIds: [FIXTURE_SERVICE_ID] });
    const { result } = renderHook(() => useContactInquiryForm({}));
    expect(result.current.pricingGuidePreview).toEqual({
      totalUsd: null,
      isPartial: true,
    });
  });

  it("maps a contact-line detail modal including video and missing media", () => {
    catalogMock.detailModal = {
      kind: "contactLine",
      line: makeContactLine({
        heroImageUrl: "https://cdn.example.com/hero.mp4",
        heroMediaType: "VIDEO",
        images: [],
      }),
    };
    const { result, rerender } = renderHook(() => useContactInquiryForm({}));
    expect(result.current.catalogDetailModalProps).toEqual(
      expect.objectContaining({
        title: "Private weddings",
        imageMediaType: "VIDEO",
        price: 2500,
      }),
    );

    catalogMock.detailModal = {
      kind: "contactLine",
      line: makeContactLine({
        heroImageUrl: "https://cdn.example.com/hero.jpg",
        heroMediaType: "IMAGE",
      }),
    };
    rerender();
    expect(result.current.catalogDetailModalProps?.imageMediaType).toBe("IMAGE");

    catalogMock.detailModal = {
      kind: "contactLine",
      line: makeContactLine({
        heroImageUrl: null,
        images: ["https://cdn.example.com/from-gallery.jpg"],
        heroMediaType: "image",
      }),
    };
    rerender();
    expect(result.current.catalogDetailModalProps?.imageUrl).toBe(
      "https://cdn.example.com/from-gallery.jpg",
    );

    catalogMock.detailModal = {
      kind: "contactLine",
      line: makeContactLine({ heroImageUrl: null, images: [], heroMediaType: null, price: undefined }),
    };
    rerender();
    expect(result.current.catalogDetailModalProps?.imageUrl).toBeNull();
    expect(result.current.catalogDetailModalProps?.price).toBeNull();
  });

  it("maps a service option detail modal", () => {
    catalogMock.detailModal = {
      kind: "service",
      option: makePublicServiceOption({
        description: undefined,
        imageUrl: null,
        price: undefined,
      }),
    };
    const { result } = renderHook(() => useContactInquiryForm({}));
    expect(result.current.catalogDetailModalProps).toEqual(
      expect.objectContaining({
        title: "Performance",
        description: "",
        imageUrl: null,
      }),
    );
  });
});
