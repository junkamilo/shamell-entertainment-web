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

export default function ContactInquiryPhaseDetail(props: ContactInquiryPhaseProps) {
  if (props.currentPhase !== "detail") return null;
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
        {(selectedLine?.occasionSingle.length ?? 0) > 0 ? (
          <div className="mx-auto w-full max-w-lg text-center">
            <p className="font-body text-base leading-relaxed text-foreground/80 md:text-lg">
              What kind of occasion are you hosting?
            </p>
            <button
              type="button"
              onClick={() => setOccasionPickerOpen(true)}
              className={cn(
                logisticsPickerTriggerClass,
                "mx-auto mt-3 block max-w-md text-base md:text-lg",
              )}
            >
              <span
                className={cn(
                  "min-w-0 flex-1 truncate font-body",
                  !data.occasionTypeId ? "text-foreground/55" : "font-medium text-foreground",
                )}
              >
                {occasionSingleLabel || "Select occasion"}
              </span>
              <ChevronDown className="h-5 w-5 shrink-0 text-gold/80" strokeWidth={2} aria-hidden />
            </button>
          </div>
        ) : null}

        {(selectedLine?.occasionSingle.length ?? 0) === 0 ? (
          <p className="text-sm text-foreground/75 font-body">
            Optional: add any occasion notes for our team if your catalog line does not list a specific occasion type.
          </p>
        ) : null}

        {(selectedLine?.occasionBespokeProject.length ?? 0) > 0 ? (
          <>
            <p className="text-sm text-foreground/75 font-body">Project focus (select all that apply)</p>
            <div className="grid gap-2">
              {(selectedLine?.occasionBespokeProject ?? []).map((o) => (
                <label
                  key={o.id}
                  className="flex cursor-pointer items-center gap-3 rounded border border-gold/20 px-3 py-2 text-sm hover:border-gold/40"
                >
                  <input
                    type="checkbox"
                    checked={data.occasionTypeIdsProject.includes(o.id)}
                    onChange={() => toggleUuidList("occasionTypeIdsProject", o.id)}
                    className="border-gold/50 text-gold focus:ring-gold"
                  />
                  {o.name}
                </label>
              ))}
            </div>
          </>
        ) : null}

        {(selectedLine?.occasionBespokeRole.length ?? 0) > 0 ? (
          <>
            <p className="text-sm text-foreground/75 font-body pt-2">How can Shamell contribute?</p>
            <div className="grid gap-2">
              {(selectedLine?.occasionBespokeRole ?? []).map((o) => (
                <label
                  key={o.id}
                  className="flex cursor-pointer items-center gap-3 rounded border border-gold/20 px-3 py-2 text-sm hover:border-gold/40"
                >
                  <input
                    type="checkbox"
                    checked={data.occasionTypeIdsRole.includes(o.id)}
                    onChange={() => toggleUuidList("occasionTypeIdsRole", o.id)}
                    className="border-gold/50 text-gold focus:ring-gold"
                  />
                  {o.name}
                </label>
              ))}
            </div>
          </>
        ) : null}

        {isBespoke(data.inquiryCode) ||
        (selectedLine?.occasionBespokeProject.length ?? 0) > 0 ||
        (selectedLine?.occasionBespokeRole.length ?? 0) > 0 ? (
          <div>
            <label className="block">
              <span className="font-brand text-gold text-sm tracking-[0.14em]">
                Timeline / deadline notes <span className="text-foreground/40 font-body">(optional here)</span>
              </span>
              <textarea
                value={data.projectDeadlineNote}
                onChange={(e) => update("projectDeadlineNote", e.target.value)}
                rows={3}
                className="mt-2 w-full border border-gold/40 bg-black/30 px-4 py-3 text-foreground outline-none focus:border-gold resize-y min-h-[88px]"
              />
            </label>
          </div>
        ) : null}
      </div>
  );
}
