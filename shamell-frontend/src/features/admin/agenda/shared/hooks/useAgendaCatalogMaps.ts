"use client";

import { useEffect, useState } from "react";
import { getAdminBearerToken } from "@/app/admin/shared/lib/adminAuth";
import {
  fetchAgendaCatalogMaps,
  parseContactLinesInquiryMap,
  parseEventTypesContactCodeMap,
  parseServicesInquiryMap,
  type ServicesInquiryMapResult,
} from "../services/fetchAgendaCatalogMaps";

type Options = {
  includeOccasions?: boolean;
  includeContactLines?: boolean;
};

export function useAgendaCatalogMaps({
  includeOccasions = false,
  includeContactLines = false,
}: Options = {}) {
  const [serviceByInquiryCode, setServiceByInquiryCode] = useState<Map<string, string>>(
    new Map(),
  );
  const [eventTypeContactCodeById, setEventTypeContactCodeById] = useState<Map<string, string>>(
    new Map(),
  );
  const [inquiryCodeByCatalogLineId, setInquiryCodeByCatalogLineId] = useState<Map<string, string>>(
    new Map(),
  );
  const [fallbackServiceId, setFallbackServiceId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAdminBearerToken();
    if (!token) {
      setServiceByInquiryCode(new Map());
      setEventTypeContactCodeById(new Map());
      setInquiryCodeByCatalogLineId(new Map());
      setFallbackServiceId(undefined);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void fetchAgendaCatalogMaps({ token, includeOccasions, includeContactLines })
      .then((raw) => {
        if (cancelled) return;
        const servicesResult: ServicesInquiryMapResult = parseServicesInquiryMap(raw.services);
        setServiceByInquiryCode(servicesResult.serviceByInquiryCode);
        setFallbackServiceId(servicesResult.fallbackServiceId);
        setEventTypeContactCodeById(parseEventTypesContactCodeMap(raw.eventTypes));
        if (includeContactLines) {
          setInquiryCodeByCatalogLineId(parseContactLinesInquiryMap(raw.contactLines));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setServiceByInquiryCode(new Map());
          setEventTypeContactCodeById(new Map());
          setInquiryCodeByCatalogLineId(new Map());
          setFallbackServiceId(undefined);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [includeContactLines, includeOccasions]);

  return {
    serviceByInquiryCode,
    eventTypeContactCodeById,
    inquiryCodeByCatalogLineId,
    fallbackServiceId,
    loading,
  };
}
