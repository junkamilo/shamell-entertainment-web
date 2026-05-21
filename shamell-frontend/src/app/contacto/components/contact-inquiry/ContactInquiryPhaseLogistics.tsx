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

export default function ContactInquiryPhaseLogistics(props: ContactInquiryPhaseProps) {
  if (props.currentPhase !== "logistics") return null;
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
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <span className="font-brand text-base tracking-[0.12em] text-gold sm:text-lg sm:tracking-[0.14em]">
              {logisticsUsesBespokeDeadlineRule ? "Key date (if any)" : "Event date"}
              {isGalaOrVip(data.inquiryCode) ? <span className="text-red-300"> *</span> : null}
            </span>
            <button
              type="button"
              onClick={() => setDatePickerOpen(true)}
              className={logisticsPickerTriggerClass}
            >
              <span
                className={`font-body ${data.eventDate ? "text-foreground" : "text-foreground/50"} sm:text-lg`}
              >
                {data.eventDate ? formatDateDisplayUs(data.eventDate) : "Select date"}
              </span>
              <span className="shrink-0 font-brand text-[11px] tracking-[0.14em] text-gold/80 sm:text-xs sm:tracking-[0.16em]">
                CALENDAR
              </span>
            </button>
          </div>
          <ContactInquiryField
            label="Approx. guest count"
            name="guestCount"
            type="number"
            min={0}
            value={data.guestCount}
            onChange={(v) => update("guestCount", v)}
            inputMode="numeric"
            inputClassName="rounded-xl py-3.5 text-base sm:py-4 sm:text-lg"
            labelClassName="font-brand text-base tracking-[0.12em] text-gold sm:text-lg sm:tracking-[0.14em]"
          />
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <span className="font-brand text-base tracking-[0.12em] text-gold sm:text-lg sm:tracking-[0.14em]">
              Performance start
            </span>
            <button
              type="button"
              onClick={() => setTimePickerWhich("start")}
              className={logisticsPickerTriggerClass}
            >
              <span
                className={`font-body sm:text-lg ${data.eventTimeStart ? "text-foreground" : "text-foreground/50"}`}
              >
                {data.eventTimeStart ? formatTimeDisplayUs(data.eventTimeStart) : "Select start time"}
              </span>
              <span className="shrink-0 font-brand text-[11px] tracking-[0.14em] text-gold/80 sm:text-xs sm:tracking-[0.16em]">
                TIME
              </span>
            </button>
          </div>
          <div>
            <span className="font-brand text-base tracking-[0.12em] text-gold sm:text-lg sm:tracking-[0.14em]">
              Performance end
            </span>
            <button
              type="button"
              onClick={() => setTimePickerWhich("end")}
              className={logisticsPickerTriggerClass}
            >
              <span
                className={`font-body sm:text-lg ${data.eventTimeEnd ? "text-foreground" : "text-foreground/50"}`}
              >
                {data.eventTimeEnd ? formatTimeDisplayUs(data.eventTimeEnd) : "Select end time"}
              </span>
              <span className="shrink-0 font-brand text-[11px] tracking-[0.14em] text-gold/80 sm:text-xs sm:tracking-[0.16em]">
                TIME
              </span>
            </button>
          </div>
        </div>
        <ContactInquiryField
          label="City / venue"
          name="location"
          value={data.location}
          onChange={(v) => update("location", v)}
          inputClassName="rounded-xl py-3.5 text-base sm:py-4 sm:text-lg"
          labelClassName="font-brand text-base tracking-[0.12em] text-gold sm:text-lg sm:tracking-[0.14em]"
        />
        <label className="block">
          <span className="font-brand text-base tracking-[0.12em] text-gold sm:text-lg sm:tracking-[0.14em]">
            Event address
          </span>
          <textarea
            name="eventAddress"
            value={data.eventAddress}
            onChange={(e) => update("eventAddress", e.target.value)}
            rows={2}
            maxLength={400}
            placeholder="Street, suite, venue name…"
            className="mt-2 min-h-[88px] w-full resize-y rounded-xl border border-gold/40 bg-black/30 px-4 py-3.5 font-body text-base text-foreground outline-none placeholder:text-foreground/45 focus:border-gold sm:min-h-[96px] sm:px-5 sm:py-4 sm:text-lg"
          />
          <p className="mt-1.5 text-end font-body text-sm text-foreground/45 sm:text-base">
            {data.eventAddress.length}/400
          </p>
        </label>
        {logisticsUsesBespokeDeadlineRule ? (
          <div>
            <label className="block">
              <span className="font-brand text-base tracking-[0.12em] text-gold sm:text-lg sm:tracking-[0.14em]">
                Project deadline or date window <span className="text-red-300">*</span>
                <span className="font-body text-sm normal-case text-foreground/50 sm:text-base">
                  {" "}
                  (required if no key date)
                </span>
              </span>
              <textarea
                value={data.projectDeadlineNote}
                onChange={(e) => update("projectDeadlineNote", e.target.value)}
                rows={3}
                className="mt-2 min-h-[100px] w-full resize-y border border-gold/40 bg-black/30 px-4 py-3.5 font-body text-base text-foreground outline-none focus:border-gold sm:px-5 sm:py-4 sm:text-lg"
              />
            </label>
          </div>
        ) : null}
        <div>
          <span className="font-brand text-base tracking-[0.12em] text-gold sm:text-lg sm:tracking-[0.14em]">
            Venue setting
          </span>
          <div className="mt-2 flex flex-wrap gap-4 font-body text-base sm:text-lg">
            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="radio"
                name="venueIndoor"
                checked={data.venueIndoor === ""}
                onChange={() => update("venueIndoor", "")}
                className="border-gold/50 text-gold focus:ring-gold"
              />
              Prefer not to say
            </label>
            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="radio"
                name="venueIndoor"
                checked={data.venueIndoor === "indoor"}
                onChange={() => update("venueIndoor", "indoor")}
                className="border-gold/50 text-gold focus:ring-gold"
              />
              Indoor
            </label>
            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="radio"
                name="venueIndoor"
                checked={data.venueIndoor === "outdoor"}
                onChange={() => update("venueIndoor", "outdoor")}
                className="border-gold/50 text-gold focus:ring-gold"
              />
              Outdoor
            </label>
          </div>
        </div>
      </div>
  );
}
