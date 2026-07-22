import type { Dispatch, SetStateAction } from "react";
import type { InquiryPreviewOccasionLine, InquiryPricingPreviewLine } from "../InquirySelectionSummary";
import type {
  CatalogSnapshot,
  ContactLine,
  PublicServiceOption,
  WizardData,
} from "../../lib/inquiry/wizardTypes";

export type ContactInquiryPhaseProps = {
  currentPhase: string;
  data: WizardData;
  setData: Dispatch<SetStateAction<WizardData>>;
  setStepError: Dispatch<SetStateAction<string | null>>;
  contactLines: ContactLine[];
  selectedLine: ContactLine | undefined;
  serviceTypeOptions: PublicServiceOption[];
  selectContactLine: (line: ContactLine) => void;
  setDetailModal: Dispatch<
    SetStateAction<
      | { kind: "contactLine"; line: ContactLine }
      | { kind: "service"; option: PublicServiceOption }
      | null
    >
  >;
  toggleUuidList: (field: "occasionTypeIdsProject" | "occasionTypeIdsRole", id: string) => void;
  toggleAddon: (code: WizardData["experienceAddons"][number]) => void;
  update: <K extends keyof WizardData>(key: K, value: WizardData[K]) => void;
  occasionSingleLabel: string;
  logisticsPickerTriggerClass: string;
  logisticsUsesBespokeDeadlineRule: boolean;
  setOccasionPickerOpen: Dispatch<SetStateAction<boolean>>;
  setDatePickerOpen: Dispatch<SetStateAction<boolean>>;
  setTimePickerWhich: Dispatch<SetStateAction<null | "start" | "end">>;
  catalogSnapshot: CatalogSnapshot | null;
  catalogDismissed: boolean;
  serviceSummary: { title: string } | null;
  serviceSummaryLoading: boolean;
  pricingPreviewEventLine: InquiryPricingPreviewLine | null;
  pricingPreviewServiceLines: InquiryPricingPreviewLine[];
  pricingPreviewOccasionLines: InquiryPreviewOccasionLine[];
  pricingGuidePreview: { totalUsd: number | null; isPartial: boolean } | null;
  reviewProjectLabels: string;
  reviewRoleLabels: string;
};
