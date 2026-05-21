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

export default function ContactInquiryPhaseReview(props: ContactInquiryPhaseProps) {
  if (props.currentPhase !== "review") return null;
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
      <div className="space-y-4 font-body text-base leading-relaxed text-foreground/90 sm:text-lg">
        <p className="text-foreground/80">Please confirm before sending.</p>
        <ul className="space-y-3 rounded border border-gold/20 bg-black/30 p-4 text-foreground/90 sm:p-5 sm:space-y-4">
          {data.contactLineId ? (
            <li>
              <span className="text-gold font-brand text-sm tracking-[0.14em] sm:text-base md:text-lg">
                CATALOG LINE
              </span>
              <br />
              {selectedLine?.eventTypeName ?? data.contactLineId}
            </li>
          ) : null}
          {data.serviceOptionIds.length > 0 || data.inquiryCode ? (
            <li>
              <span className="text-gold font-brand text-sm tracking-[0.14em] sm:text-base md:text-lg">SERVICE</span>
              <br />
              {data.serviceOptionIds.length > 0
                ? data.serviceOptionIds
                    .map((sid) => {
                      const opt = serviceTypeOptions.find((s) => s.id === sid);
                      if (opt) return opt.title;
                      return isValidInquiryCode(sid) ? readableInquiryCode(sid) : sid;
                    })
                    .filter(Boolean)
                    .join(" · ")
                : readableInquiryCode(data.inquiryCode)}
            </li>
          ) : null}
          {data.occasionTypeId ? (
            <li>
              <span className="text-gold font-brand text-sm tracking-[0.14em] sm:text-base md:text-lg">
                OCCASION
              </span>
              <br />
              {occasionSingleLabel || data.occasionTypeId}
            </li>
          ) : null}
          {data.occasionTypeIdsProject.length > 0 || data.occasionTypeIdsRole.length > 0 ? (
            <li>
              <span className="text-gold font-brand text-sm tracking-[0.14em] sm:text-base md:text-lg">PROJECT</span>
              <br />
              {reviewProjectLabels || "—"}
              {reviewRoleLabels ? (
                <>
                  <br />
                  <span className="text-gold/90">Roles:</span> {reviewRoleLabels}
                </>
              ) : null}
            </li>
          ) : null}
          {data.experienceAddons.length > 0 ? (
            <li>
              <span className="text-gold font-brand text-sm tracking-[0.14em] sm:text-base md:text-lg">ADD-ONS</span>
              <br />
              {data.experienceAddons.join(", ")}
            </li>
          ) : null}
          <li>
            <span className="text-gold font-brand text-sm tracking-[0.14em] sm:text-base md:text-lg">
              LOGISTICS
            </span>
            <br />
            {data.eventDate ? `Date: ${formatDateDisplayUs(data.eventDate)}` : "Date: —"}
            {data.eventTimeStart || data.eventTimeEnd ? (
              <>
                {" · Time: "}
                {data.eventTimeStart ? formatTimeDisplayUs(data.eventTimeStart) : "—"}
                {" – "}
                {data.eventTimeEnd ? formatTimeDisplayUs(data.eventTimeEnd) : "—"}
              </>
            ) : null}
            <br />
            {data.location ? `City / venue: ${data.location}` : "City / venue: —"}
            {data.eventAddress.trim() ? (
              <>
                <br />
                {`Address: ${data.eventAddress.trim()}`}
              </>
            ) : null}
            {data.guestCount ? ` · Guests: ${data.guestCount}` : ""}
            {data.venueIndoor === "indoor"
              ? " · Indoor"
              : data.venueIndoor === "outdoor"
                ? " · Outdoor"
                : ""}
          </li>
          {data.projectDeadlineNote.trim() ? (
            <li>
              <span className="text-gold font-brand text-sm tracking-[0.14em] sm:text-base md:text-lg">
                DEADLINE / WINDOW
              </span>
              <br />
              {data.projectDeadlineNote}
            </li>
          ) : null}
          <li>
            <span className="text-gold font-brand text-sm tracking-[0.14em] sm:text-base md:text-lg">MESSAGE</span>
            <br />
            <span className="whitespace-pre-wrap">{data.message}</span>
          </li>
          <li>
            <span className="text-gold font-brand text-sm tracking-[0.14em] sm:text-base md:text-lg">CONTACT</span>
            <br />
            {data.fullName} · {data.email}
            {data.phone ? ` · ${data.phone}` : ""}
          </li>
        </ul>
        <p className="text-sm leading-relaxed text-foreground/55 sm:text-base">
          Use the step tabs above to edit any section, or Back below. Your selection preview is below the form.
        </p>
      </div>
  );
}
