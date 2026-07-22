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

export default function ContactInquiryPhaseService(props: ContactInquiryPhaseProps) {
  if (props.currentPhase !== "service") return null;
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
        <p className="font-body text-lg leading-relaxed text-foreground/80 md:text-xl md:leading-relaxed">
          Which catalog offering best matches what you are planning? Tap the eye to read the full description,
          inclusions, and guide investment.
        </p>
        <div className="space-y-3">
          {contactLines.map((line) => {
            const checked = data.contactLineId === line.id;
            const rowId = `inquiry-contact-line-${line.id}`;
            const priceLabel = formatCatalogPriceWithSuffix(line.price ?? null);
            return (
              <div
                key={line.id}
                className={`flex overflow-hidden rounded border transition-colors ${
                  checked ? "border-gold bg-gold/10" : "border-gold/25 hover:border-gold/45"
                }`}
              >
                <label htmlFor={rowId} className="flex min-w-0 flex-1 cursor-pointer flex-col gap-1 p-4">
                  <div className="flex items-start gap-3">
                    <input
                      id={rowId}
                      type="radio"
                      name="contactLine"
                      value={line.id}
                      checked={checked}
                      onChange={() => selectContactLine(line)}
                      className="mt-1 border-gold/50 text-gold focus:ring-gold"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="font-brand text-base tracking-[0.14em] text-gold sm:text-lg md:text-xl">
                        {line.eventTypeName}
                      </span>
                      {priceLabel ? (
                        <p className="mt-1 font-body text-sm text-foreground/65 sm:text-base">
                          Guide from {priceLabel}
                        </p>
                      ) : null}
                      {line.description.trim() ? (
                        <p className="mt-2 line-clamp-3 font-body text-base leading-relaxed text-foreground/78 sm:text-lg sm:leading-relaxed">
                          {lineDescriptionPreview(line.description, 140)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </label>
                <div className="flex shrink-0 flex-col justify-stretch border-l border-gold/25 bg-black/15">
                  <button
                    type="button"
                    className="inline-flex min-h-13 min-w-13 flex-1 items-center justify-center text-gold transition hover:bg-gold/10 sm:min-h-11 sm:min-w-11"
                    aria-label={`View details for ${line.eventTypeName}`}
                    onClick={() => setDetailModal({ kind: "contactLine", line })}
                  >
                    <Eye className="h-5 w-5" strokeWidth={1.5} aria-hidden />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
  );
}
