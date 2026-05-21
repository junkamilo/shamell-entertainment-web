"use client";

import { useEffect, useState } from "react";
import { ADMIN_ACCESS_TOKEN_KEY } from "@/lib/adminSession";
import { fetchContactLinesInquiryMap } from "../services/fetchContactLinesInquiryMap";
import { fetchEventTypesContactCodeMap } from "../services/fetchEventTypesContactCodeMap";
import { fetchServicesInquiryMap } from "../services/fetchServicesInquiryMap";

export function usePeticionesCatalogMaps() {
  const [serviceByInquiryCode, setServiceByInquiryCode] = useState<Map<string, string>>(new Map());
  const [eventTypeContactCodeById, setEventTypeContactCodeById] = useState<Map<string, string>>(
    new Map(),
  );
  const [inquiryCodeByCatalogLineId, setInquiryCodeByCatalogLineId] = useState<Map<string, string>>(
    new Map(),
  );
  const [fallbackServiceId, setFallbackServiceId] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetchContactLinesInquiryMap()
      .then((map) => {
        if (!cancelled) setInquiryCodeByCatalogLineId(map);
      })
      .catch(() => {
        if (!cancelled) setInquiryCodeByCatalogLineId(new Map());
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY) : null;
    if (!token) {
      setServiceByInquiryCode(new Map());
      setEventTypeContactCodeById(new Map());
      setFallbackServiceId(undefined);
      return;
    }

    let cancelled = false;

    fetchServicesInquiryMap(token)
      .then((result) => {
        if (cancelled) return;
        setServiceByInquiryCode(result.serviceByInquiryCode);
        setFallbackServiceId(result.fallbackServiceId);
      })
      .catch(() => {
        if (!cancelled) {
          setServiceByInquiryCode(new Map());
          setFallbackServiceId(undefined);
        }
      });

    fetchEventTypesContactCodeMap(token)
      .then((map) => {
        if (!cancelled) setEventTypeContactCodeById(map);
      })
      .catch(() => {
        if (!cancelled) setEventTypeContactCodeById(new Map());
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    serviceByInquiryCode,
    eventTypeContactCodeById,
    inquiryCodeByCatalogLineId,
    fallbackServiceId,
  };
}
