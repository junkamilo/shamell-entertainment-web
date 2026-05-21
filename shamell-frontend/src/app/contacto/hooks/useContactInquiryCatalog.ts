"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  resolveServiceLineFromCatalog,
  type ContactCatalogKind,
  type ServiceTypeCode,
} from "@/lib/contactInquiryConstants";
import { serviceCatalogMediaTypeFromUrl } from "@/lib/serviceCatalogMedia";
import { getPublicApiBaseUrl } from "../lib/apiBaseUrl";
import { inferInquiryCodeFromService } from "../lib/inquiry/inquiryCodeUtils";
import { emptyWizard, phaseFlow } from "../lib/inquiry/wizardValidation";
import type {
  CatalogSnapshot,
  ContactLine,
  PublicServiceOption,
  ServiceSummarySnapshot,
  WizardData,
} from "../lib/inquiry/wizardTypes";
import { fetchPublicContactLines } from "../services/fetchPublicContactLines";
import type { WizardStateApi } from "./useContactInquiryWizard";

type DetailModal =
  | { kind: "contactLine"; line: ContactLine }
  | { kind: "service"; option: PublicServiceOption }
  | null;

type UseContactInquiryCatalogArgs = {
  initialCatalog?: { kind: ContactCatalogKind; id: string };
  initialEventId?: string;
  hadEventIdInUrl: boolean;
  hadServiceTypeInUrl: boolean;
  wizardState: WizardStateApi;
};

export function useContactInquiryCatalog({
  initialCatalog,
  initialEventId,
  hadEventIdInUrl,
  hadServiceTypeInUrl,
  wizardState: { data, setData, setPhaseIndex, setStepError, resetWizard },
}: UseContactInquiryCatalogArgs) {
  const router = useRouter();
  const pathname = usePathname() ?? "/contacto";
  const searchParams = useSearchParams();
  const apiBaseUrl = useMemo(() => getPublicApiBaseUrl(), []);

  const [catalogSnapshot, setCatalogSnapshot] = useState<CatalogSnapshot | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogFetchError, setCatalogFetchError] = useState<string | null>(null);
  const [catalogDismissed, setCatalogDismissed] = useState(false);
  const [serviceSummary, setServiceSummary] = useState<ServiceSummarySnapshot | null>(null);
  const [serviceSummaryLoading, setServiceSummaryLoading] = useState(false);
  const [serviceTypeOptions, setServiceTypeOptions] = useState<PublicServiceOption[]>([]);
  const [contactLines, setContactLines] = useState<ContactLine[]>([]);
  const [linesLoading, setLinesLoading] = useState(true);
  const [linesError, setLinesError] = useState<string | null>(null);
  const [detailModal, setDetailModal] = useState<DetailModal>(null);

  const skipServiceAppliedForEventIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    setLinesLoading(true);
    setLinesError(null);
    fetchPublicContactLines()
      .then((parsed) => {
        if (!cancelled) setContactLines(parsed);
      })
      .catch(() => {
        if (!cancelled) {
          setContactLines([]);
          setLinesError("Could not load offerings. You can still submit if you arrived via a direct link.");
        }
      })
      .finally(() => {
        if (!cancelled) setLinesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl]);

  useEffect(() => {
    let cancelled = false;
    fetch(`${apiBaseUrl}/api/v1/services`)
      .then(async (res) => {
        if (!res.ok) throw new Error("services");
        return res.json();
      })
      .then((json: unknown) => {
        if (cancelled || !Array.isArray(json)) return;
        const parsed: PublicServiceOption[] = [];
        for (const row of json as Record<string, unknown>[]) {
          const id = typeof row.id === "string" ? row.id : "";
          const title = typeof row.serviceTypeName === "string" ? row.serviceTypeName.trim() : "";
          if (!id || !title) continue;
          const contactInquiryCode =
            typeof row.contactInquiryCode === "string" ? row.contactInquiryCode : undefined;
          parsed.push({
            id,
            title,
            inquiryCode: inferInquiryCodeFromService(contactInquiryCode, title),
            description: typeof row.description === "string" ? row.description : undefined,
            items: Array.isArray(row.items)
              ? (row.items as unknown[])
                  .map((v) => (typeof v === "string" ? v.trim() : ""))
                  .filter(Boolean)
              : [],
            imageUrl:
              typeof row.imageUrl === "string" && row.imageUrl.trim() ? row.imageUrl.trim() : undefined,
            imageMediaType: serviceCatalogMediaTypeFromUrl(
              typeof row.imageUrl === "string" ? row.imageUrl : undefined,
            ),
            price: (() => {
              const raw = row.price;
              if (raw == null || raw === "") return null;
              const n = typeof raw === "number" ? raw : Number(raw);
              return Number.isFinite(n) ? n : null;
            })(),
          });
        }
        setServiceTypeOptions(parsed);
      })
      .catch(() => {
        if (!cancelled) setServiceTypeOptions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl]);

  useEffect(() => {
    if (data.serviceOptionIds.length > 0 || !data.inquiryCode || serviceTypeOptions.length === 0) return;
    const firstByCode = serviceTypeOptions.find((s) => s.inquiryCode === data.inquiryCode);
    if (!firstByCode) return;
    setData((prev) => ({ ...prev, serviceOptionIds: [firstByCode.id] }));
  }, [data.serviceOptionIds.join("|"), data.inquiryCode, serviceTypeOptions, setData]);

  useEffect(() => {
    if (!initialEventId) skipServiceAppliedForEventIdRef.current = undefined;
  }, [initialEventId]);

  useEffect(() => {
    if (!initialEventId || contactLines.length === 0 || catalogDismissed) return;
    const line = contactLines.find((l) => l.id === initialEventId);
    if (!line) return;
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

    if (hadEventIdInUrl && skipServiceAppliedForEventIdRef.current !== initialEventId) {
      skipServiceAppliedForEventIdRef.current = initialEventId;
      const detailIdx = phaseFlow("").indexOf("detail");
      if (detailIdx >= 0) setPhaseIndex(detailIdx);
    }
  }, [
    initialEventId,
    contactLines,
    hadEventIdInUrl,
    catalogDismissed,
    hadServiceTypeInUrl,
    setData,
    setPhaseIndex,
  ]);

  useEffect(() => {
    if (initialCatalog) setCatalogDismissed(false);
  }, [initialCatalog]);

  const stripCatalogFromUrl = useCallback(() => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.delete("catalogKind");
    sp.delete("catalogId");
    sp.delete("eventId");
    sp.delete("serviceType");
    const q = sp.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  }, [router, pathname, searchParams]);

  useEffect(() => {
    if (!initialCatalog || catalogDismissed) {
      if (!initialCatalog) {
        setCatalogSnapshot(null);
        setCatalogFetchError(null);
        setCatalogLoading(false);
      }
      return;
    }

    let cancelled = false;
    setCatalogLoading(true);
    setCatalogFetchError(null);

    const path = initialCatalog.kind === "service" ? "services" : "events";
    fetch(`${apiBaseUrl}/api/v1/${path}/catalog/${initialCatalog.id}`)
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) {
          if (res.status === 404) {
            setCatalogFetchError(
              "That catalog item is no longer available. You can still complete your inquiry below.",
            );
            setCatalogSnapshot(null);
            return;
          }
          throw new Error("catalog_fetch");
        }
        const body = (await res.json()) as {
          id?: string;
          title?: string;
          contactInquiryCode?: string | null;
          description?: string;
          descriptionPreview?: string;
          items?: string[];
          imageUrl?: string | null;
          heroMediaType?: string | null;
        };
        if (cancelled) return;
        const title = typeof body.title === "string" ? body.title.trim() : "";
        if (!title) {
          setCatalogFetchError("Could not load catalog details.");
          setCatalogSnapshot(null);
          return;
        }
        const imageUrl =
          typeof body.imageUrl === "string" && body.imageUrl.trim() ? body.imageUrl.trim() : undefined;
        const hero =
          typeof body.heroMediaType === "string" ? body.heroMediaType.trim().toUpperCase() : "";
        const imageMediaType: "IMAGE" | "VIDEO" | undefined = !imageUrl
          ? undefined
          : hero === "VIDEO" || serviceCatalogMediaTypeFromUrl(imageUrl) === "VIDEO"
            ? "VIDEO"
            : "IMAGE";
        const snap: CatalogSnapshot = {
          kind: initialCatalog.kind,
          id: typeof body.id === "string" ? body.id : initialCatalog.id,
          title,
          contactInquiryCode:
            typeof body.contactInquiryCode === "string"
              ? body.contactInquiryCode
              : body.contactInquiryCode ?? null,
          description: typeof body.description === "string" ? body.description : undefined,
          descriptionPreview:
            typeof body.descriptionPreview === "string" ? body.descriptionPreview : undefined,
          items: Array.isArray(body.items)
            ? body.items.map((v) => (typeof v === "string" ? v.trim() : "")).filter(Boolean)
            : [],
          imageUrl,
          imageMediaType,
        };
        setCatalogSnapshot(snap);
        setCatalogFetchError(null);

        if (!hadServiceTypeInUrl && snap.contactInquiryCode) {
          const code = resolveServiceLineFromCatalog(snap.contactInquiryCode);
          setData((prev) => {
            if (hadServiceTypeInUrl && prev.inquiryCode) return prev;
            return { ...prev, inquiryCode: code };
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCatalogFetchError("Could not load catalog context. You can still complete your inquiry below.");
          setCatalogSnapshot(null);
        }
      })
      .finally(() => {
        if (!cancelled) setCatalogLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [initialCatalog, catalogDismissed, apiBaseUrl, hadServiceTypeInUrl, setData]);

  useEffect(() => {
    if (!catalogSnapshot || catalogSnapshot.kind !== "event" || catalogDismissed) return;
    const line = contactLines.find((l) => l.id === catalogSnapshot.id);
    if (!line) return;
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
  }, [contactLines, catalogSnapshot, catalogDismissed, hadServiceTypeInUrl, setData]);

  useEffect(() => {
    if (!data.inquiryCode) {
      setServiceSummary(null);
      setServiceSummaryLoading(false);
      return;
    }
    if (!catalogDismissed && catalogSnapshot?.kind === "service") {
      setServiceSummary({
        id: catalogSnapshot.id,
        title: catalogSnapshot.title,
        contactInquiryCode: catalogSnapshot.contactInquiryCode,
        description: catalogSnapshot.description,
        descriptionPreview: catalogSnapshot.descriptionPreview,
        items: catalogSnapshot.items,
        imageUrl: catalogSnapshot.imageUrl,
        imageMediaType: catalogSnapshot.imageMediaType,
      });
      setServiceSummaryLoading(false);
      return;
    }

    let cancelled = false;
    setServiceSummaryLoading(true);
    fetch(`${apiBaseUrl}/api/v1/services/public/by-inquiry/${encodeURIComponent(data.inquiryCode)}`)
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 404) return null;
          throw new Error("service_summary");
        }
        const body = (await res.json()) as {
          id?: string;
          title?: string;
          contactInquiryCode?: string | null;
          description?: string;
          descriptionPreview?: string;
          items?: string[];
          imageUrl?: string | null;
          heroMediaType?: string | null;
        };
        if (cancelled) return null;
        if (!body || typeof body.title !== "string" || !body.title.trim()) return null;
        const imageUrl =
          typeof body.imageUrl === "string" && body.imageUrl.trim() ? body.imageUrl.trim() : undefined;
        const hero =
          typeof body.heroMediaType === "string" ? body.heroMediaType.trim().toUpperCase() : "";
        const imageMediaType: "IMAGE" | "VIDEO" | undefined = !imageUrl
          ? undefined
          : hero === "VIDEO" || serviceCatalogMediaTypeFromUrl(imageUrl) === "VIDEO"
            ? "VIDEO"
            : "IMAGE";
        return {
          id: typeof body.id === "string" ? body.id : "",
          title: body.title.trim(),
          contactInquiryCode:
            typeof body.contactInquiryCode === "string"
              ? body.contactInquiryCode
              : body.contactInquiryCode ?? null,
          description: typeof body.description === "string" ? body.description : undefined,
          descriptionPreview: typeof body.descriptionPreview === "string" ? body.descriptionPreview : undefined,
          items: Array.isArray(body.items)
            ? body.items.map((x) => (typeof x === "string" ? x.trim() : "")).filter(Boolean)
            : [],
          imageUrl,
          imageMediaType,
        } as ServiceSummarySnapshot;
      })
      .then((summary) => {
        if (cancelled) return;
        setServiceSummary(summary);
      })
      .catch(() => {
        if (!cancelled) setServiceSummary(null);
      })
      .finally(() => {
        if (!cancelled) setServiceSummaryLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, data.inquiryCode, catalogDismissed, catalogSnapshot]);

  useEffect(() => {
    const line = contactLines.find((l) => l.id === data.contactLineId);
    const singles = line?.occasionSingle ?? [];
    if (singles.length !== 1 || data.occasionTypeId) return;
    setData((prev) => ({ ...prev, occasionTypeId: singles[0].id }));
  }, [contactLines, data.contactLineId, data.occasionTypeId, setData]);

  const dismissCatalogContext = useCallback(() => {
    stripCatalogFromUrl();
    setCatalogDismissed(true);
    setCatalogSnapshot(null);
    setCatalogFetchError(null);
    setCatalogLoading(false);
    skipServiceAppliedForEventIdRef.current = undefined;
    resetWizard(undefined);
    setStepError(null);
  }, [stripCatalogFromUrl, resetWizard, setStepError]);

  return {
    apiBaseUrl,
    catalogSnapshot,
    catalogLoading,
    catalogFetchError,
    catalogDismissed,
    serviceSummary,
    serviceSummaryLoading,
    serviceTypeOptions,
    contactLines,
    linesLoading,
    linesError,
    detailModal,
    setDetailModal,
    dismissCatalogContext,
    setCatalogSnapshot,
    setCatalogDismissed,
    setCatalogFetchError,
  };
}
