"use client";

import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import {
  emptyWizard,
  phaseFlow,
  validateLogisticsFields,
  validatePhase,
} from "../lib/inquiry/wizardValidation";
import type { CatalogSnapshot, ContactLine, ExperienceAddon, Phase, WizardData } from "../lib/inquiry/wizardTypes";
import type { ServiceTypeCode } from "@/lib/contactInquiryConstants";

export type WizardStateApi = {
  data: WizardData;
  setData: Dispatch<SetStateAction<WizardData>>;
  phaseIndex: number;
  setPhaseIndex: Dispatch<SetStateAction<number>>;
  stepError: string | null;
  setStepError: Dispatch<SetStateAction<string | null>>;
  resetWizard: (serviceType?: ServiceTypeCode) => void;
};

type UseContactInquiryWizardArgs = {
  wizardState: WizardStateApi;
  initialServiceType?: ServiceTypeCode;
  hadServiceTypeInUrl: boolean;
  hadEventIdInUrl: boolean;
  contactLines: ContactLine[];
  catalogDismissed: boolean;
  catalogSnapshot: CatalogSnapshot | null;
  onResetSubmitFeedback: () => void;
  onClearApiError: () => void;
};

export function useContactInquiryWizard({
  wizardState: { data, setData, phaseIndex, setPhaseIndex, stepError, setStepError },
  hadServiceTypeInUrl,
  hadEventIdInUrl,
  contactLines,
  catalogDismissed,
  catalogSnapshot,
  onResetSubmitFeedback,
  onClearApiError,
}: UseContactInquiryWizardArgs) {
  const [occasionPickerOpen, setOccasionPickerOpen] = useState(false);

  const flow = useMemo(() => phaseFlow(data.inquiryCode), [data.inquiryCode]);
  const currentPhase = flow[phaseIndex] ?? "service";

  useEffect(() => {
    setPhaseIndex((i) => Math.min(i, Math.max(0, flow.length - 1)));
  }, [flow, setPhaseIndex]);

  useEffect(() => {
    if (currentPhase !== "detail") setOccasionPickerOpen(false);
  }, [currentPhase]);

  const validationOpts = useMemo(
    () => ({ catalogDismissed, catalogSnapshot, hadServiceTypeInUrl }),
    [catalogDismissed, catalogSnapshot, hadServiceTypeInUrl],
  );

  const offeringStepLocked = useMemo(
    () => Boolean(hadEventIdInUrl && !catalogDismissed),
    [hadEventIdInUrl, catalogDismissed],
  );

  const detailPhaseIndex = useMemo(() => flow.indexOf("detail"), [flow]);

  const update = useCallback(
    <K extends keyof WizardData>(key: K, value: WizardData[K]) => {
      setData((prev) => ({ ...prev, [key]: value }));
      setStepError(null);
      onClearApiError();
      onResetSubmitFeedback();
    },
    [setData, setStepError, onClearApiError, onResetSubmitFeedback],
  );

  const goNext = useCallback(() => {
    const phase = flow[phaseIndex];
    if (!phase) return;

    const err =
      phase === "logistics"
        ? validatePhase(phase, data, contactLines, validationOpts) || validateLogisticsFields(data)
        : validatePhase(phase, data, contactLines, validationOpts);
    if (err) {
      setStepError(err);
      return;
    }
    setStepError(null);
    if (phaseIndex < flow.length - 1) {
      setPhaseIndex((i) => i + 1);
    }
  }, [data, flow, phaseIndex, contactLines, validationOpts, setPhaseIndex, setStepError]);

  const goBack = useCallback(() => {
    setStepError(null);
    setPhaseIndex((i) => {
      if (offeringStepLocked && detailPhaseIndex >= 0 && i === detailPhaseIndex) return i;
      return Math.max(0, i - 1);
    });
  }, [offeringStepLocked, detailPhaseIndex, setPhaseIndex, setStepError]);

  const goToPhaseIndex = useCallback(
    (idx: number) => {
      setStepError(null);
      if (offeringStepLocked && idx === 0 && phaseIndex > 0) return;
      setPhaseIndex(Math.max(0, Math.min(idx, flow.length - 1)));
    },
    [flow.length, offeringStepLocked, phaseIndex, setPhaseIndex, setStepError],
  );

  const toggleAddon = useCallback(
    (code: ExperienceAddon) => {
      setData((prev) => {
        const has = prev.experienceAddons.includes(code);
        return {
          ...prev,
          experienceAddons: has
            ? prev.experienceAddons.filter((c) => c !== code)
            : [...prev.experienceAddons, code],
        };
      });
      setStepError(null);
    },
    [setData, setStepError],
  );

  const toggleUuidList = useCallback(
    (field: "occasionTypeIdsProject" | "occasionTypeIdsRole", id: string) => {
      setData((prev) => {
        const arr = prev[field];
        const has = arr.includes(id);
        return {
          ...prev,
          [field]: has ? arr.filter((x) => x !== id) : [...arr, id],
        };
      });
      setStepError(null);
    },
    [setData, setStepError],
  );

  const selectContactLine = useCallback(
    (line: ContactLine) => {
      setData((prev) => ({
        ...prev,
        contactLineId: line.id,
        contactLineKind: line.lineKind ?? "event",
        eventTypeId: line.eventTypeId,
        inquiryCode: hadServiceTypeInUrl ? prev.inquiryCode : "",
        serviceOptionIds: [],
        occasionTypeId: "",
        occasionTypeIdsProject: [],
        occasionTypeIdsRole: [],
      }));
      setPhaseIndex(0);
      setStepError(null);
    },
    [hadServiceTypeInUrl, setData, setPhaseIndex, setStepError],
  );

  const phaseLabel = useCallback((p: Phase): string => {
    switch (p) {
      case "service":
        return "Offering";
      case "detail":
        return "Event or project";
      case "serviceType":
        return "Service type";
      case "experiences":
        return "Performance add-ons";
      case "logistics":
        return "Date and venue";
      case "expectations":
        return "Your vision";
      case "contact":
        return "Contact";
      case "review":
        return "Review";
      default:
        return p;
    }
  }, []);

  return {
    data,
    setData,
    phaseIndex,
    setPhaseIndex,
    stepError,
    setStepError,
    occasionPickerOpen,
    setOccasionPickerOpen,
    flow,
    currentPhase,
    validationOpts,
    offeringStepLocked,
    detailPhaseIndex,
    update,
    goNext,
    goBack,
    goToPhaseIndex,
    toggleAddon,
    toggleUuidList,
    selectContactLine,
    phaseLabel,
  };
}
