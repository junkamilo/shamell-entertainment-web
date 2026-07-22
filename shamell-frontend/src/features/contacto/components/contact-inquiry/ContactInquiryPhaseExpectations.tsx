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

export default function ContactInquiryPhaseExpectations(props: ContactInquiryPhaseProps) {
  if (props.currentPhase !== "expectations") return null;
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
        <div>
          <label className="block">
            <span className="font-brand text-base tracking-[0.12em] text-gold sm:text-lg sm:tracking-[0.14em]">
              Main description <span className="text-red-300">*</span>
            </span>
            <textarea
              value={data.message}
              onChange={(e) => update("message", e.target.value)}
              rows={6}
              required
              className="mt-2 min-h-[160px] w-full resize-y border border-gold/40 bg-black/30 px-4 py-3.5 font-body text-base leading-relaxed text-foreground outline-none transition-colors placeholder:text-foreground/45 focus:border-gold sm:min-h-[180px] sm:px-5 sm:py-4 sm:text-lg"
            />
          </label>
          <p className="mt-1 text-right text-sm text-foreground/40 sm:text-base">{data.message.length}/4000</p>
        </div>
      </div>
  );
}
