import { ChevronDown, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCatalogPriceWithSuffix } from "@/lib/formatCatalogPrice";
import {
  EXPERIENCE_ADDON_OPTIONS,
  SERVICE_TYPE_CODES,
  isValidInquiryCode,
} from "@/lib/contactInquiryConstants";
import {
  formatDateDisplayUs,
  formatTimeDisplayUs,
} from "@/lib/contactLogisticsUtils";
import {
  isBespoke,
  isGalaOrVip,
  mergedInquiryCodeFromSelections,
  readableInquiryCode,
} from "../../lib/inquiry/inquiryCodeUtils";
import { lineDescriptionPreview } from "../../lib/inquiry/inquiryDetailsBuilder";
import ContactInquiryField from "./ContactInquiryField";
import type { ContactInquiryPhaseProps } from "./contactInquiryPhase.types";

export default function ContactInquiryPhaseContact(props: ContactInquiryPhaseProps) {
  if (props.currentPhase !== "contact") return null;
  const {
    data,
    setData,
    setStepError,
    contactLines,
    selectedLine,
    serviceTypeOptions,
    selectContactLine,
    setDetailModal,
    toggleUuidList,
    toggleAddon,
    update,
    occasionSingleLabel,
    logisticsPickerTriggerClass,
    logisticsUsesBespokeDeadlineRule,
    setOccasionPickerOpen,
    setDatePickerOpen,
    setTimePickerWhich,
    catalogSnapshot,
    catalogDismissed,
    serviceSummary,
    serviceSummaryLoading,
    pricingPreviewEventLine,
    pricingPreviewServiceLines,
    pricingPreviewOccasionLines,
    pricingGuidePreview,
    reviewProjectLabels,
    reviewRoleLabels,
  } = props;
  return (
      <div className="space-y-5">
        <ContactInquiryField
          label="Full name"
          name="fullName"
          value={data.fullName}
          onChange={(v) => update("fullName", v)}
          required
        />
        <ContactInquiryField
          label="Email"
          name="email"
          type="email"
          value={data.email}
          onChange={(v) => update("email", v)}
          required
        />
        <ContactInquiryField
          label="Phone"
          name="phone"
          type="tel"
          value={data.phone}
          onChange={(v) => update("phone", v)}
          hint="Optional — include country code if outside your region."
        />
      </div>
  );
}
