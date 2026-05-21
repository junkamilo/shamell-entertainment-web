"use client";

import { FormEvent, useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  InquiryPreviewOccasionLine,
  InquiryPricingPreviewLine,
} from "../components/InquirySelectionSummary";
import type { InquirySubmitFeedbackPhase } from "../components/InquirySubmitFeedbackLayer";
import { buildInquiryDetails } from "../lib/inquiry/inquiryDetailsBuilder";
import { isBespoke, readableInquiryCode } from "../lib/inquiry/inquiryCodeUtils";
import { emptyWizard, validateLogisticsFields, validatePhase } from "../lib/inquiry/wizardValidation";
import type { ContactInquiryFormProps } from "../types/contacto.types";
import { isValidInquiryCode, type ServiceTypeCode } from "@/lib/contactInquiryConstants";
import { submitContactInquiry } from "../services/submitContactInquiry";
import { useContactInquiryAvailability } from "./useContactInquiryAvailability";
import { useContactInquiryCatalog } from "./useContactInquiryCatalog";
import { useContactInquiryWizard } from "./useContactInquiryWizard";

export function useContactInquiryForm({
  initialServiceType,
  hadServiceTypeInUrl = false,
  initialEventId,
  hadEventIdInUrl = false,
  entrySource = "contact_page",
  initialCatalog,
}: ContactInquiryFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitFeedbackPhase, setSubmitFeedbackPhase] = useState<InquirySubmitFeedbackPhase>("idle");
  const [apiError, setApiError] = useState<string | null>(null);

  const [data, setData] = useState(() => emptyWizard(initialServiceType));
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [stepError, setStepError] = useState<string | null>(null);

  const resetWizard = useCallback((serviceType?: ServiceTypeCode) => {
    setData(emptyWizard(serviceType));
    setPhaseIndex(0);
    setStepError(null);
  }, []);

  const wizardState = useMemo(
    () => ({ data, setData, phaseIndex, setPhaseIndex, stepError, setStepError, resetWizard }),
    [data, phaseIndex, stepError, resetWizard],
  );

  const onResetSubmitFeedback = useCallback(() => setSubmitFeedbackPhase("idle"), []);
  const onClearApiError = useCallback(() => setApiError(null), []);

  const catalog = useContactInquiryCatalog({
    initialCatalog,
    initialEventId,
    hadEventIdInUrl,
    hadServiceTypeInUrl,
    wizardState,
  });

  const wizard = useContactInquiryWizard({
    wizardState,
    initialServiceType,
    hadServiceTypeInUrl,
    hadEventIdInUrl,
    contactLines: catalog.contactLines,
    catalogDismissed: catalog.catalogDismissed,
    catalogSnapshot: catalog.catalogSnapshot,
    onResetSubmitFeedback,
    onClearApiError,
  });

  const availability = useContactInquiryAvailability({
    data: wizard.data,
    setData: wizard.setData,
    setStepError: wizard.setStepError,
  });

  const submitInFlightRef = useRef(false);

  const handleInquirySubmitComplete = useCallback(() => {
    resetWizard(initialServiceType);
    catalog.setCatalogSnapshot(null);
    catalog.setCatalogDismissed(false);
    catalog.setCatalogFetchError(null);
    setSubmitFeedbackPhase("idle");
    router.replace("/");
  }, [initialServiceType, resetWizard, catalog, router]);

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (submitInFlightRef.current) return;
    const errContact = validatePhase("contact", wizard.data, catalog.contactLines, wizard.validationOpts);
    const errExp = validatePhase("expectations", wizard.data, catalog.contactLines, wizard.validationOpts);
    const errLog =
      validatePhase("logistics", wizard.data, catalog.contactLines, wizard.validationOpts) ||
      validateLogisticsFields(wizard.data);
    if (errContact || errExp || errLog) {
      wizard.setStepError(errContact ?? errExp ?? errLog);
      return;
    }
    setApiError(null);
    submitInFlightRef.current = true;
    setSubmitFeedbackPhase("sending");
    setIsSubmitting(true);
    try {
      const activeCatalog = catalog.catalogDismissed ? null : catalog.catalogSnapshot;
      const inquiryDetails = buildInquiryDetails(
        wizard.data,
        entrySource,
        activeCatalog,
        catalog.serviceTypeOptions,
      );
      const result = await submitContactInquiry({
        fullName: wizard.data.fullName.trim(),
        email: wizard.data.email.trim(),
        phone: wizard.data.phone.trim() || undefined,
        eventDate: wizard.data.eventDate || undefined,
        location: wizard.data.location.trim() || undefined,
        serviceType: wizard.data.inquiryCode || undefined,
        message: wizard.data.message.trim(),
        inquiryDetails: inquiryDetails ?? {},
      });
      if (!result.ok) {
        setApiError(result.message);
        setSubmitFeedbackPhase("idle");
        return;
      }
      setSubmitFeedbackPhase("done");
    } catch {
      setApiError("Cannot reach the server. Check that the API is running.");
      setSubmitFeedbackPhase("idle");
    } finally {
      submitInFlightRef.current = false;
      setIsSubmitting(false);
    }
  };

  const selectedLine = catalog.contactLines.find((l) => l.id === wizard.data.contactLineId);

  const lineHasBespokeGroups =
    (selectedLine?.occasionBespokeProject?.length ?? 0) > 0 ||
    (selectedLine?.occasionBespokeRole?.length ?? 0) > 0;
  const logisticsUsesBespokeDeadlineRule = isBespoke(wizard.data.inquiryCode) || lineHasBespokeGroups;

  const logisticsPickerTriggerClass =
    "mt-2 flex min-h-[52px] w-full items-center justify-between gap-3 rounded-xl border border-gold/40 bg-black/30 px-4 py-3.5 text-left text-base text-foreground outline-none transition hover:border-gold focus:border-gold focus:ring-1 focus:ring-gold/30 sm:min-h-14 sm:px-5 sm:py-4 sm:text-lg";

  const occasionSingleLabel =
    selectedLine?.occasionSingle.find((o) => o.id === wizard.data.occasionTypeId)?.name ?? "";

  const reviewProjectLabels = wizard.data.occasionTypeIdsProject
    .map((id) => selectedLine?.occasionBespokeProject.find((o) => o.id === id)?.name ?? id)
    .join(", ");

  const reviewRoleLabels = wizard.data.occasionTypeIdsRole
    .map((id) => selectedLine?.occasionBespokeRole.find((o) => o.id === id)?.name ?? id)
    .join(", ");

  const pricingPreviewEventLine = useMemo((): InquiryPricingPreviewLine | null => {
    if (selectedLine) {
      return { name: selectedLine.eventTypeName, price: selectedLine.price ?? null };
    }
    if (!catalog.catalogDismissed && catalog.catalogSnapshot?.kind === "event") {
      return { name: catalog.catalogSnapshot.title, price: null };
    }
    return null;
  }, [selectedLine, catalog.catalogDismissed, catalog.catalogSnapshot]);

  const pricingPreviewServiceLines = useMemo((): InquiryPricingPreviewLine[] => {
    const fromOpts = wizard.data.serviceOptionIds
      .map((id) => catalog.serviceTypeOptions.find((s) => s.id === id))
      .filter((s): s is NonNullable<typeof s> => Boolean(s));
    if (fromOpts.length > 0) {
      return fromOpts.map((o) => ({ name: o.title, price: o.price ?? null }));
    }
    return wizard.data.serviceOptionIds
      .filter((id): id is ServiceTypeCode => isValidInquiryCode(id))
      .map((code) => ({ name: readableInquiryCode(code), price: null as number | null }));
  }, [wizard.data.serviceOptionIds, catalog.serviceTypeOptions]);

  const pricingPreviewOccasionLines = useMemo((): InquiryPreviewOccasionLine[] => {
    const lines: InquiryPreviewOccasionLine[] = [];
    if (occasionSingleLabel.trim()) lines.push({ name: occasionSingleLabel });
    if (reviewProjectLabels.trim()) {
      reviewProjectLabels
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((name) => lines.push({ name }));
    }
    if (reviewRoleLabels.trim()) {
      reviewRoleLabels
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((name) => lines.push({ name }));
    }
    return lines;
  }, [occasionSingleLabel, reviewProjectLabels, reviewRoleLabels]);

  const pricingGuidePreview = useMemo(() => {
    const hasEvent = pricingPreviewEventLine != null;
    const hasServices = pricingPreviewServiceLines.length > 0;
    if (!hasEvent && !hasServices) {
      return null;
    }
    let sum = 0;
    let partial = false;
    if (pricingPreviewEventLine) {
      const p = pricingPreviewEventLine.price;
      if (p == null || Number.isNaN(Number(p))) partial = true;
      else sum += Number(p);
    }
    for (const row of pricingPreviewServiceLines) {
      const p = row.price;
      if (p == null || Number.isNaN(Number(p))) partial = true;
      else sum += Number(p);
    }
    const totalUsd = sum > 0 ? Math.round(sum * 100) / 100 : null;
    return { totalUsd, isPartial: partial };
  }, [pricingPreviewEventLine, pricingPreviewServiceLines]);

  const catalogDetailModalProps = useMemo(() => {
    if (!catalog.detailModal) return null;
    if (catalog.detailModal.kind === "contactLine") {
      const line = catalog.detailModal.line;
      const imageUrl = line.heroImageUrl ?? line.images[0] ?? undefined;
      const imageMediaType: "IMAGE" | "VIDEO" | undefined =
        imageUrl &&
        typeof line.heroMediaType === "string" &&
        line.heroMediaType.trim().toUpperCase() === "VIDEO"
          ? "VIDEO"
          : imageUrl
            ? "IMAGE"
            : undefined;
      return {
        title: line.eventTypeName,
        description: line.description,
        items: line.items,
        imageUrl: imageUrl ?? null,
        imageMediaType,
        price: line.price ?? null,
      };
    }
    const o = catalog.detailModal.option;
    return {
      title: o.title,
      description: o.description ?? "",
      items: o.items,
      imageUrl: o.imageUrl ?? null,
      imageMediaType: o.imageMediaType,
      price: o.price ?? null,
    };
  }, [catalog.detailModal]);

  return {
    wizard,
    catalog,
    availability,
    isSubmitting,
    submitFeedbackPhase,
    apiError,
    onSubmit,
    handleInquirySubmitComplete,
    selectedLine,
    lineHasBespokeGroups,
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
  };
}
