"use client";

import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  isContactCatalogUuid,
  isValidServiceTypeParam,
  parseContactCatalogParams,
  parseInquiryEntrySource,
  type InquiryEntrySource,
} from "@/lib/contactInquiryConstants";
import type { ContactInquiryFormProps } from "../types/contacto.types";

export type ContactInquiryGateView = "concierge_form" | "concierge_gate" | "booking_form";

export type UseContactInquiryGateResult =
  | { view: "concierge_form" }
  | { view: "concierge_gate" }
  | {
      view: "booking_form";
      formProps: ContactInquiryFormProps;
    };

export function useContactInquiryGate(): UseContactInquiryGateResult {
  const searchParams = useSearchParams();
  const contactQueryKey = searchParams.toString();
  const serviceTypeParam = searchParams.get("serviceType");
  const eventIdParam = searchParams.get("eventId");
  const entryParam = searchParams.get("entry");
  const catalogKindParam = searchParams.get("catalogKind");
  const catalogIdParam = searchParams.get("catalogId");
  const modeParam = searchParams.get("mode");

  const initialServiceType = useMemo(
    () => (isValidServiceTypeParam(serviceTypeParam) ? serviceTypeParam : undefined),
    [serviceTypeParam],
  );

  const hadServiceTypeInUrl = Boolean(initialServiceType);

  const initialEventId = useMemo(() => {
    if (!eventIdParam || !isContactCatalogUuid(eventIdParam)) return undefined;
    return eventIdParam.trim();
  }, [eventIdParam]);

  const hadEventIdInUrl = Boolean(initialEventId);

  const initialCatalog = useMemo(
    () => parseContactCatalogParams(catalogKindParam, catalogIdParam),
    [catalogKindParam, catalogIdParam],
  );

  const entrySource = useMemo((): InquiryEntrySource => {
    const parsed = parseInquiryEntrySource(entryParam);
    if (parsed) return parsed;
    if (initialServiceType || initialEventId) return "home_service_card";
    return "contact_page";
  }, [entryParam, initialServiceType, initialEventId]);

  const hasSpecificInquiryContext = Boolean(initialServiceType || initialEventId || initialCatalog);

  useEffect(() => {
    if (!("scrollRestoration" in window.history)) return;
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    return () => {
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  useEffect(() => {
    const scrollToTop = () => window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    scrollToTop();
    const frame = window.requestAnimationFrame(scrollToTop);
    const timeout = window.setTimeout(scrollToTop, 80);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [contactQueryKey]);

  if (!hasSpecificInquiryContext && modeParam === "concierge") {
    return { view: "concierge_form" };
  }

  if (!hasSpecificInquiryContext && modeParam !== "booking") {
    return { view: "concierge_gate" };
  }

  const formProps: ContactInquiryFormProps = {
    initialServiceType,
    hadServiceTypeInUrl,
    initialEventId,
    hadEventIdInUrl,
    entrySource,
    initialCatalog,
  };

  return { view: "booking_form", formProps };
}
