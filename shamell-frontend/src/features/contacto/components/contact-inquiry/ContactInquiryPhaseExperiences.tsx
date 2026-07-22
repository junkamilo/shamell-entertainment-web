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

export default function ContactInquiryPhaseExperiences(props: ContactInquiryPhaseProps) {
  if (props.currentPhase !== "experiences") return null;
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
      <div className="space-y-4">
        <p className="text-sm text-foreground/75 font-body">
          Optional performance elements. Select any that interest you — we will confirm feasibility for your venue.
        </p>
        <div className="space-y-3">
          {EXPERIENCE_ADDON_OPTIONS.map((o) => (
            <label
              key={o.value}
              className={`flex cursor-pointer flex-col gap-1 rounded border p-4 transition-colors ${
                data.experienceAddons.includes(o.value)
                  ? "border-gold bg-gold/10"
                  : "border-gold/25 hover:border-gold/45"
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={data.experienceAddons.includes(o.value)}
                  onChange={() => toggleAddon(o.value)}
                  className="mt-1 border-gold/50 text-gold focus:ring-gold"
                />
                <div>
                  <span className="font-brand text-sm tracking-[0.12em] text-gold">{o.label}</span>
                  {o.note ? <p className="mt-1 text-sm text-foreground/60 font-body">{o.note}</p> : null}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>
  );
}
