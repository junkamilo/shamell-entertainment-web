import { vi } from "vitest";
import type { ContactInquiryPhaseProps } from "../../components/contact-inquiry/contactInquiryPhase.types";
import {
  makeCatalogSnapshot,
  makeContactLine,
  makePublicServiceOption,
  makeWizardData,
} from "../fixtures/contacto.fixture";
import { emptyWizard } from "../../lib/inquiry/wizardValidation";

export function createMockContactInquiryFormState(
  overrides: Record<string, unknown> = {},
) {
  return {
    phase: "service" as const,
    data: makeWizardData(),
    setData: vi.fn(),
    update: vi.fn(),
    contactLines: [makeContactLine()],
    publicServices: [makePublicServiceOption()],
    catalog: null as ReturnType<typeof makeCatalogSnapshot> | null,
    loadingCatalog: false,
    loadingLines: false,
    submitting: false,
    error: null as string | null,
    goNext: vi.fn(),
    goBack: vi.fn(),
    onSubmit: vi.fn(async () => undefined),
    submitPhase: "idle" as const,
    ...overrides,
  };
}

export function createMockContactInquiryGateState(
  overrides: Record<string, unknown> = {},
) {
  return {
    mode: "gate" as const,
    formProps: undefined,
    ...overrides,
  };
}

export function createEmptyWizardFixture() {
  return emptyWizard();
}

export function createMockContactInquiryPhaseProps(
  overrides: Partial<ContactInquiryPhaseProps> = {},
): ContactInquiryPhaseProps {
  const contactLine = makeContactLine();
  const data = makeWizardData({ contactLineId: contactLine.id });
  return {
    currentPhase: "service",
    data,
    setData: vi.fn(),
    setStepError: vi.fn(),
    contactLines: [contactLine],
    selectedLine: contactLine,
    serviceTypeOptions: [makePublicServiceOption()],
    selectContactLine: vi.fn(),
    setDetailModal: vi.fn(),
    toggleUuidList: vi.fn(),
    toggleAddon: vi.fn(),
    update: vi.fn(),
    occasionSingleLabel: "Wedding",
    logisticsPickerTriggerClass: "picker-trigger",
    logisticsUsesBespokeDeadlineRule: false,
    setOccasionPickerOpen: vi.fn(),
    setDatePickerOpen: vi.fn(),
    setTimePickerWhich: vi.fn(),
    catalogSnapshot: null,
    catalogDismissed: false,
    serviceSummary: null,
    serviceSummaryLoading: false,
    pricingPreviewEventLine: null,
    pricingPreviewServiceLines: [],
    pricingPreviewOccasionLines: [],
    pricingGuidePreview: null,
    reviewProjectLabels: "",
    reviewRoleLabels: "",
    ...overrides,
  };
}

export function createMockUseContactInquiryFormReturn(
  overrides: Record<string, unknown> = {},
) {
  const contactLine = makeContactLine();
  const data = makeWizardData({ contactLineId: contactLine.id });
  const flow = [
    "service",
    "detail",
    "serviceType",
    "experiences",
    "logistics",
    "expectations",
    "contact",
    "review",
  ] as const;

  return {
    wizard: {
      data,
      setData: vi.fn(),
      flow: [...flow],
      currentPhase: "service" as const,
      phaseIndex: 0,
      stepError: null as string | null,
      setStepError: vi.fn(),
      update: vi.fn(),
      goNext: vi.fn(),
      goBack: vi.fn(),
      goToPhaseIndex: vi.fn(),
      toggleAddon: vi.fn(),
      toggleUuidList: vi.fn(),
      selectContactLine: vi.fn(),
      phaseLabel: (p: string) =>
        (
          ({
            service: "Offering",
            detail: "Event or project",
            serviceType: "Service type",
            experiences: "Performance add-ons",
            logistics: "Date and venue",
            expectations: "Your vision",
            contact: "Contact",
            review: "Review",
          }) as Record<string, string>
        )[p] ?? p,
      canContinue: true,
      occasionPickerOpen: false,
      setOccasionPickerOpen: vi.fn(),
      offeringStepLocked: false,
      detailPhaseIndex: 1,
    },
    catalog: {
      contactLines: [contactLine],
      linesLoading: false,
      linesError: null as string | null,
      catalogSnapshot: null,
      catalogLoading: false,
      catalogFetchError: null as string | null,
      catalogDismissed: false,
      dismissCatalogContext: vi.fn(),
      serviceSummary: null,
      serviceSummaryLoading: false,
      serviceTypeOptions: [makePublicServiceOption()],
      detailModal: null,
      setDetailModal: vi.fn(),
    },
    availability: {
      datePickerOpen: false,
      setDatePickerOpen: vi.fn(),
      timePickerWhich: null as null | "start" | "end",
      setTimePickerWhich: vi.fn(),
      blockedIsoDates: new Set<string>(),
      blockedReasonByIso: new Map<string, string>(),
      startTimeClamp: undefined,
      minSelectableIso: undefined,
      bookingTz: "America/New_York",
      occupiedRanges: [] as Array<{ startMinutes: number; endMinutes: number }>,
    },
    isSubmitting: false,
    submitFeedbackPhase: "idle" as const,
    apiError: null as string | null,
    onSubmit: vi.fn((e: { preventDefault: () => void }) => e.preventDefault()),
    handleInquirySubmitComplete: vi.fn(),
    selectedLine: contactLine,
    logisticsUsesBespokeDeadlineRule: false,
    logisticsPickerTriggerClass: "picker-trigger",
    occasionSingleLabel: "Wedding",
    reviewProjectLabels: "",
    reviewRoleLabels: "",
    pricingPreviewEventLine: {
      name: contactLine.eventTypeName,
      price: contactLine.price ?? null,
    },
    pricingPreviewServiceLines: [],
    pricingPreviewOccasionLines: [],
    pricingGuidePreview: null,
    catalogDetailModalProps: null,
    ...overrides,
  };
}
