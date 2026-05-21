"use client";

import { ChevronDown, Eye, Loader2 } from "lucide-react";
import Image from "next/image";
import RevealFromDepth from "@/components/shared/RevealFromDepth";
import bailarinaLogo from "@/public/01_bailarina.png";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  EXPERIENCE_ADDON_OPTIONS,
  SERVICE_TYPE_CODES,
  isValidInquiryCode,
} from "@/lib/contactInquiryConstants";
import {
  formatDateDisplayUs,
  formatTimeDisplayUs,
} from "@/lib/contactLogisticsUtils";
import { cn } from "@/lib/utils";
import { formatCatalogPriceWithSuffix } from "@/lib/formatCatalogPrice";
import {
  isBespoke,
  isGalaOrVip,
  mergedInquiryCodeFromSelections,
  readableInquiryCode,
} from "../lib/inquiry/inquiryCodeUtils";
import { lineDescriptionPreview } from "../lib/inquiry/inquiryDetailsBuilder";
import { useContactInquiryForm } from "../hooks/useContactInquiryForm";
import CatalogOfferingDetailModal from "./CatalogOfferingDetailModal";
import ContactDatePickerModal from "./ContactDatePickerModal";
import ContactOccasionPickerModal from "./ContactOccasionPickerModal";
import ContactTimePickerModal from "./ContactTimePickerModal";
import InquirySelectionSummary from "./InquirySelectionSummary";
import InquirySubmitFeedbackLayer from "./InquirySubmitFeedbackLayer";
import ContactInquiryField from "./contact-inquiry/ContactInquiryField";
import ContactInquiryPhaseContact from "./contact-inquiry/ContactInquiryPhaseContact";
import ContactInquiryPhaseDetail from "./contact-inquiry/ContactInquiryPhaseDetail";
import ContactInquiryPhaseExpectations from "./contact-inquiry/ContactInquiryPhaseExpectations";
import ContactInquiryPhaseExperiences from "./contact-inquiry/ContactInquiryPhaseExperiences";
import ContactInquiryPhaseLogistics from "./contact-inquiry/ContactInquiryPhaseLogistics";
import ContactInquiryPhaseReview from "./contact-inquiry/ContactInquiryPhaseReview";
import ContactInquiryPhaseService from "./contact-inquiry/ContactInquiryPhaseService";
import ContactInquiryPhaseServiceType from "./contact-inquiry/ContactInquiryPhaseServiceType";
import type { ContactInquiryPhaseProps } from "./contact-inquiry/contactInquiryPhase.types";


export type { ContactInquiryFormProps, ContactLine } from "../types/contacto.types";
import type { ContactInquiryFormProps } from "../types/contacto.types";

export default function ContactInquiryForm(props: ContactInquiryFormProps) {
  const { initialCatalog, hadServiceTypeInUrl } = props;
  const isLg = useMediaQuery("(min-width: 1024px)");
  const {
    wizard,
    catalog,
    availability,
    isSubmitting,
    submitFeedbackPhase,
    apiError,
    onSubmit,
    handleInquirySubmitComplete,
    selectedLine,
    logisticsUsesBespokeDeadlineRule,
    logisticsPickerTriggerClass,
    occasionSingleLabel,
    reviewProjectLabels,
    reviewRoleLabels,
    pricingPreviewEventLine,
    pricingPreviewServiceLines,
    pricingPreviewOccasionLines,
    pricingGuidePreview,
    catalogDetailModalProps,
  } = useContactInquiryForm(props);

  const {
    data,
    setData,
    flow,
    currentPhase,
    phaseIndex,
    stepError,
    setStepError,
    update,
    goNext,
    goBack,
    goToPhaseIndex,
    toggleAddon,
    toggleUuidList,
    selectContactLine,
    offeringStepLocked,
    detailPhaseIndex,
    phaseLabel,
    occasionPickerOpen,
    setOccasionPickerOpen,
  } = wizard;

  const {
    contactLines,
    linesLoading,
    linesError,
    catalogSnapshot,
    catalogLoading,
    catalogFetchError,
    catalogDismissed,
    dismissCatalogContext,
    serviceSummary,
    serviceSummaryLoading,
    serviceTypeOptions,
    detailModal,
    setDetailModal,
  } = catalog;

  const {
    datePickerOpen,
    setDatePickerOpen,
    timePickerWhich,
    setTimePickerWhich,
    blockedIsoDates,
    blockedReasonByIso,
    startTimeClamp,
    minSelectableIso,
    bookingTz,
    occupiedRanges,
  } = availability;

  return (
    <div className="w-full max-w-none text-left">
      <header className="mb-10 px-0 pt-2 text-center sm:mb-12 sm:pt-4">
        <RevealFromDepth delay={0}>
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center sm:mb-8 sm:h-24 sm:w-24">
            <Image
              src={bailarinaLogo}
              alt="Shamell bailarina"
              className="h-full w-auto object-contain drop-shadow-[0_0_18px_rgba(197,165,90,0.2)]"
              priority
            />
          </div>
        </RevealFromDepth>
        <RevealFromDepth delay={110}>
          <p className="mb-3 font-brand text-xs tracking-[0.28em] text-[#c5a059]/90 uppercase">
            Begin your Shamell experience
          </p>
        </RevealFromDepth>
        <RevealFromDepth delay={220}>
          <h1 className="mx-auto max-w-4xl font-brand text-3xl tracking-[0.14em] text-gold uppercase md:text-5xl">
            <span className="block leading-tight">Booking</span>
            <span className="mt-1 block leading-tight md:mt-1.5">inquiry</span>
          </h1>
        </RevealFromDepth>
        <RevealFromDepth delay={340}>
          <p className="mx-auto mt-5 max-w-2xl font-elegant text-lg leading-relaxed text-[#d1d1d1]/95 md:mt-6 md:text-xl">
            Every celebration is different. Tell us about yours step by step — we review each inquiry
            personally and respond as soon as possible.
          </p>
        </RevealFromDepth>
      </header>

      {linesLoading ? (
        <p className="mb-6 flex items-center justify-center gap-2 text-sm text-foreground/65">
          <Loader2 className="h-4 w-4 animate-spin text-gold" aria-hidden />
          Loading offerings…
        </p>
      ) : null}
      {linesError ? <p className="mb-6 text-center text-sm text-amber-200/85">{linesError}</p> : null}

      <nav aria-label="Form progress" className="mb-8">
        <ol className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
          {flow.map((p, i) => {
            const offeringNavLocked = offeringStepLocked && i === 0 && phaseIndex > 0;
            const stepReachable = i <= phaseIndex && !offeringNavLocked;
            const stepDisabled = i > phaseIndex || offeringNavLocked;
            return (
              <li key={`${p}-${i}`}>
                <button
                  type="button"
                  onClick={() => {
                    if (stepReachable) goToPhaseIndex(i);
                  }}
                  disabled={stepDisabled}
                  title={
                    offeringNavLocked
                      ? "Remove catalog context below the form to change the catalog offering."
                      : undefined
                  }
                  className={`rounded border px-2 py-1.5 text-xs font-brand tracking-[0.12em] uppercase transition-colors sm:text-sm ${
                    i === phaseIndex
                      ? "border-gold bg-gold/15 text-gold-light"
                      : stepReachable
                        ? "border-gold/35 text-gold/90 hover:bg-gold/10"
                        : "border-white/15 text-foreground/35 cursor-default"
                  }`}
                >
                  {i + 1}. {phaseLabel(p)}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="relative flex min-h-0 flex-col gap-6 lg:max-h-[calc(100vh-8rem)] lg:min-h-0 lg:flex-row lg:items-stretch lg:gap-8">
        <div className="min-w-0 flex-1 lg:flex lg:min-h-0 lg:flex-col">
          <div className="rounded border border-gold/25 bg-black/20 p-5 md:p-6 lg:flex lg:h-full lg:min-h-0 lg:max-h-full lg:flex-1 lg:flex-col lg:overflow-hidden">
            <div className="shamell-scrollbar min-h-0 overflow-x-hidden lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:overflow-y-auto lg:pr-1">
            <div className="my-0 w-full shrink-0 py-6 lg:my-auto">
        {(() => {
          const phaseProps: ContactInquiryPhaseProps = {
            currentPhase,
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
          };
          return (
            <>
              <ContactInquiryPhaseService {...phaseProps} />
              <ContactInquiryPhaseDetail {...phaseProps} />
              <ContactInquiryPhaseServiceType {...phaseProps} />
              <ContactInquiryPhaseExperiences {...phaseProps} />
              <ContactInquiryPhaseLogistics {...phaseProps} />
              <ContactInquiryPhaseExpectations {...phaseProps} />
              <ContactInquiryPhaseContact {...phaseProps} />
              <ContactInquiryPhaseReview {...phaseProps} />
            </>
          );
        })()}

        {stepError ? (
          <p className="mt-4 text-sm text-red-300" role="alert">
            {stepError}
          </p>
        ) : null}
        {apiError ? (
          <p className="mt-4 text-sm text-red-300" role="alert">
            {apiError}
          </p>
        ) : null}

        {currentPhase !== "review" ? (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={goBack}
              disabled={
                phaseIndex === 0 ||
                (offeringStepLocked && detailPhaseIndex >= 0 && phaseIndex === detailPhaseIndex)
              }
              title={
                offeringStepLocked && detailPhaseIndex >= 0 && phaseIndex === detailPhaseIndex
                  ? "Remove catalog context to go back and change offering."
                  : undefined
              }
              className="border border-gold/35 px-4 py-2.5 text-sm font-brand tracking-[0.14em] text-gold hover:bg-gold/10 disabled:opacity-40 disabled:pointer-events-none"
            >
              Back
            </button>
            <button
              type="button"
              onClick={goNext}
              className="btn-outline-gold min-w-40 justify-center px-4 py-2.5 text-sm font-brand tracking-[0.14em] sm:min-w-48"
            >
              {currentPhase === "contact" ? "Continue to review" : "Continue"}
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={goBack}
              className="border border-gold/35 px-4 py-2.5 text-sm font-brand tracking-[0.14em] text-gold hover:bg-gold/10"
            >
              Back
            </button>
            <button
              type="submit"
              className="btn-outline-gold flex-1 min-w-40 justify-center gap-2 font-brand disabled:opacity-60 disabled:pointer-events-none"
              disabled={isSubmitting || submitFeedbackPhase !== "idle"}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Sending...
                </>
              ) : (
                "Submit inquiry"
              )}
            </button>
          </form>
        )}
            </div>
            </div>
          </div>
        </div>
        <aside className="w-full min-w-0 shrink-0 lg:flex lg:min-h-0 lg:w-[min(100%,420px)] lg:flex-col xl:w-[480px]">
          <div className="shamell-scrollbar min-h-0 lg:flex lg:h-full lg:min-h-0 lg:flex-1 lg:overflow-x-hidden lg:overflow-y-auto lg:pr-1 lg:pb-2">
            <InquirySelectionSummary
              eventLine={pricingPreviewEventLine}
              occasionLines={pricingPreviewOccasionLines}
              serviceLines={pricingPreviewServiceLines}
              guideInvestment={pricingGuidePreview}
              loadingService={serviceSummaryLoading}
              stackCards={isLg}
            />
          </div>
        </aside>
      </div>

      {initialCatalog && !catalogDismissed ? (
        <div
          className="mt-6 rounded border border-gold/30 bg-gold/5 px-5 py-4 text-left text-base font-body text-foreground/85 md:px-6 md:py-5 md:text-lg"
          role="status"
        >
          {catalogLoading ? (
            <p className="flex items-center gap-2 text-base text-foreground/70 md:text-lg">
              <Loader2 className="h-5 w-5 shrink-0 animate-spin text-gold md:h-6 md:w-6" aria-hidden />
              Loading what you selected from the site…
            </p>
          ) : null}
          {!catalogLoading && catalogFetchError && !catalogSnapshot ? (
            <p className="text-base text-amber-200/90 md:text-lg">{catalogFetchError}</p>
          ) : null}
          {!catalogLoading && catalogSnapshot ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div>
                <p className="text-sm font-brand uppercase tracking-[0.14em] text-gold/90 sm:text-base md:text-lg">
                  Catalog context
                </p>
                <p className="mt-2 text-base leading-snug text-foreground/90 md:text-lg md:leading-snug">
                  You are inquiring about:{" "}
                  <span className="font-semibold text-foreground md:text-xl">{catalogSnapshot.title}</span>
                  {catalogSnapshot.descriptionPreview ? (
                    <span className="mt-2 block text-base leading-relaxed text-foreground/65 line-clamp-2 md:text-lg">
                      {catalogSnapshot.descriptionPreview}
                    </span>
                  ) : null}
                </p>
                {!hadServiceTypeInUrl && catalogSnapshot.contactInquiryCode ? (
                  <p className="mt-3 text-base leading-relaxed text-foreground/55 md:text-lg">
                    Inquiry type was suggested from this catalog entry; change your selection in step 1 if needed.
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={dismissCatalogContext}
                className="shrink-0 self-start rounded border border-white/20 bg-black/30 px-4 py-2.5 text-sm font-brand uppercase tracking-[0.12em] text-foreground/85 transition-colors hover:border-gold/40 hover:text-gold sm:text-base md:px-5 md:py-3"
              >
                Remove context
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      <ContactOccasionPickerModal
        isOpen={occasionPickerOpen}
        title="What kind of occasion?"
        options={(selectedLine?.occasionSingle ?? []).map((o) => ({ id: o.id, name: o.name }))}
        selectedId={data.occasionTypeId}
        onClose={() => setOccasionPickerOpen(false)}
        onSelect={(id) => {
          update("occasionTypeId", id);
          setStepError(null);
        }}
      />
      <ContactDatePickerModal
        isOpen={datePickerOpen}
        title={logisticsUsesBespokeDeadlineRule ? "Key date" : "Event date"}
        value={data.eventDate}
        onClose={() => setDatePickerOpen(false)}
        onConfirm={(iso) => update("eventDate", iso)}
        blockedIsoDates={blockedIsoDates}
        blockedReasonByIso={blockedReasonByIso}
        minSelectableIso={minSelectableIso}
      />
      <ContactTimePickerModal
        isOpen={timePickerWhich === "start"}
        title="Performance start"
        value={data.eventTimeStart}
        onClose={() => setTimePickerWhich(null)}
        onConfirm={(hhmm) => update("eventTimeStart", hhmm)}
        timeClamp={startTimeClamp}
        blockedRanges={occupiedRanges}
      />
      <ContactTimePickerModal
        isOpen={timePickerWhich === "end"}
        title="Performance end"
        value={data.eventTimeEnd}
        onClose={() => setTimePickerWhich(null)}
        onConfirm={(hhmm) => update("eventTimeEnd", hhmm)}
        timeClamp={startTimeClamp}
        blockedRanges={occupiedRanges}
      />
      {detailModal && catalogDetailModalProps ? (
        <CatalogOfferingDetailModal
          isOpen
          onClose={() => setDetailModal(null)}
          {...catalogDetailModalProps}
          showCloseButton={
            detailModal.kind !== "contactLine" || data.contactLineId === detailModal.line.id
          }
          primaryAction={
            detailModal.kind === "contactLine"
              ? {
                  label: data.contactLineId === detailModal.line.id ? "Selected" : "Add",
                  disabled: data.contactLineId === detailModal.line.id,
                  onClick: () => {
                    selectContactLine(detailModal.line);
                    setDetailModal(null);
                  },
                }
              : detailModal.kind === "service"
                ? {
                    label: data.serviceOptionIds.includes(detailModal.option.id) ? "Remove" : "Add",
                    onClick: () => {
                      const opt = detailModal.option;
                      setData((prev) => {
                        const has = prev.serviceOptionIds.includes(opt.id);
                        const serviceOptionIds = has
                          ? prev.serviceOptionIds.filter((x) => x !== opt.id)
                          : [...prev.serviceOptionIds, opt.id];
                        const inquiryCode = mergedInquiryCodeFromSelections(
                          serviceOptionIds,
                          serviceTypeOptions,
                        );
                        return { ...prev, serviceOptionIds, inquiryCode };
                      });
                      setStepError(null);
                      setDetailModal(null);
                    },
                  }
                : undefined
          }
        />
      ) : null}
      <InquirySubmitFeedbackLayer phase={submitFeedbackPhase} onAccept={handleInquirySubmitComplete} />
    </div>
  );
}
