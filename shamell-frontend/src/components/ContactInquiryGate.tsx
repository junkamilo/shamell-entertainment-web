"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import ContactInquiryForm from "@/components/ContactInquiryForm";
import {
  isContactCatalogUuid,
  isValidServiceTypeParam,
  parseContactCatalogParams,
  parseInquiryEntrySource,
  type InquiryEntrySource,
} from "@/lib/contactInquiryConstants";

export default function ContactInquiryGate() {
  const searchParams = useSearchParams();
  const serviceTypeParam = searchParams.get("serviceType");
  const eventIdParam = searchParams.get("eventId");
  const entryParam = searchParams.get("entry");
  const catalogKindParam = searchParams.get("catalogKind");
  const catalogIdParam = searchParams.get("catalogId");

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

  return (
    <ContactInquiryForm
      initialServiceType={initialServiceType}
      hadServiceTypeInUrl={hadServiceTypeInUrl}
      initialEventId={initialEventId}
      hadEventIdInUrl={hadEventIdInUrl}
      entrySource={entrySource}
      initialCatalog={initialCatalog}
    />
  );
}
