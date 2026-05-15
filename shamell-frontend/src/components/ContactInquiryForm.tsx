"use client";

import type { HTMLAttributes } from "react";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { ChevronDown, Eye, Loader2 } from "lucide-react";
import RevealFromDepth from "@/components/shared/RevealFromDepth";
import bailarinaLogo from "@/public/01_bailarina.png";
import InquirySelectionSummary, {
  type InquiryPreviewOccasionLine,
  type InquiryPricingPreviewLine,
} from "@/components/contact/InquirySelectionSummary";
import CatalogOfferingDetailModal from "@/components/contact/CatalogOfferingDetailModal";
import ContactOccasionPickerModal from "@/components/contact/ContactOccasionPickerModal";
import ContactDatePickerModal from "@/components/contact/ContactDatePickerModal";
import ContactTimePickerModal from "@/components/contact/ContactTimePickerModal";
import InquirySubmitFeedbackLayer, {
  type InquirySubmitFeedbackPhase,
} from "@/components/contact/InquirySubmitFeedbackLayer";
import {
  formatDateDisplayUs,
  formatTimeDisplayUs,
  hhmmToMinutes,
  parseISOLocal,
  startOfTodayLocal,
} from "@/components/contact/contactLogisticsUtils";
import {
  EXPERIENCE_ADDON_OPTIONS,
  SERVICE_TYPE_CODES,
  isValidInquiryCode,
  resolveServiceLineFromCatalog,
  type ContactCatalogKind,
  type InquiryEntrySource,
  type ServiceTypeCode,
} from "@/lib/contactInquiryConstants";
import { serviceCatalogMediaTypeFromUrl } from "@/lib/serviceCatalogMedia";
import { useMediaQuery } from "@/hooks/use-media-query";
import { usePublicAvailability } from "@/hooks/use-public-availability";
import {
  expandBlockedDateReasonsMap,
  expandBlockedDates,
  isoDateInTzNow,
  timeBoundsForDateISO,
} from "@/lib/bookingAvailability";
import { cn } from "@/lib/utils";
import { formatCatalogPriceWithSuffix } from "@/lib/formatCatalogPrice";

export type ContactInquiryFormProps = {
  initialServiceType?: ServiceTypeCode;
  /** URL had valid `serviceType` — do not override inquiry code from catalog snapshot. */
  hadServiceTypeInUrl?: boolean;
  initialEventId?: string;
  hadEventIdInUrl?: boolean;
  entrySource?: InquiryEntrySource;
  initialCatalog?: { kind: ContactCatalogKind; id: string };
};

type CatalogSnapshot = {
  kind: ContactCatalogKind;
  id: string;
  title: string;
  contactInquiryCode: string | null;
  description?: string;
  descriptionPreview?: string;
  items: string[];
  imageUrl?: string | null;
  imageMediaType?: "IMAGE" | "VIDEO";
};

export type ContactLine = {
  id: string;
  eventTypeId: string;
  eventTypeName: string;
  contactInquiryCode: string | null;
  description: string;
  items: string[];
  images: string[];
  heroImageUrl?: string | null;
  /** First linked gallery item; VIDEO when hero is a clip. */
  heroMediaType?: string | null;
  price?: number | null;
  /** `event_type` = solo existe tipo de evento (sin fila Event); no enviar `eventId` al crear contacto. */
  lineKind?: "event" | "event_type";
  occasionSingle: { id: string; name: string }[];
  occasionBespokeProject: { id: string; name: string }[];
  occasionBespokeRole: { id: string; name: string }[];
};

type Phase =
  | "service"
  | "detail"
  | "serviceType"
  | "experiences"
  | "logistics"
  | "expectations"
  | "contact"
  | "review";

type ExperienceAddon = "FIRE" | "VEIL_FAN_LED" | "SWORD_CANDELABRA";

type WizardData = {
  contactLineId: string;
  contactLineKind: "event" | "event_type";
  eventTypeId: string;
  inquiryCode: ServiceTypeCode | "";
  /** Selected catalog service rows (UUIDs) or static `SERVICE_TYPE_CODES` ids when API list is empty. */
  serviceOptionIds: string[];
  occasionTypeId: string;
  occasionTypeIdsProject: string[];
  occasionTypeIdsRole: string[];
  occasionOther: string;
  projectDeadlineNote: string;
  experienceAddons: ExperienceAddon[];
  eventDate: string;
  eventTimeStart: string;
  eventTimeEnd: string;
  location: string;
  eventAddress: string;
  guestCount: string;
  venueIndoor: "" | "indoor" | "outdoor";
  message: string;
  fullName: string;
  email: string;
  phone: string;
};

type ServiceSummarySnapshot = {
  id: string;
  title: string;
  contactInquiryCode: string | null;
  description?: string;
  descriptionPreview?: string;
  items: string[];
  imageUrl?: string | null;
  imageMediaType?: "IMAGE" | "VIDEO";
};

type PublicServiceOption = {
  id: string;
  title: string;
  inquiryCode: ServiceTypeCode;
  description?: string;
  items: string[];
  imageUrl?: string | null;
  imageMediaType?: "IMAGE" | "VIDEO";
  price?: number | null;
};

const SERVICE_OPTION_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** When multiple catalog services are selected, drive gala/VIP/bespoke rules from the strictest matching code. */
function mergedInquiryCodeFromSelections(ids: string[], options: PublicServiceOption[]): ServiceTypeCode | "" {
  const codes = new Set<ServiceTypeCode>();
  for (const id of ids) {
    const opt = options.find((o) => o.id === id);
    if (opt && isValidInquiryCode(opt.inquiryCode)) codes.add(opt.inquiryCode);
    else if (isValidInquiryCode(id)) codes.add(id);
  }
  if (codes.has("VIP_EVENT")) return "VIP_EVENT";
  if (codes.has("PRIVATE_GALA")) return "PRIVATE_GALA";
  if (codes.has("BESPOKE")) return "BESPOKE";
  if (codes.has("GENERAL")) return "GENERAL";
  return "";
}

function emptyWizard(initialServiceType?: ServiceTypeCode): WizardData {
  return {
    contactLineId: "",
    contactLineKind: "event",
    eventTypeId: "",
    inquiryCode: initialServiceType ?? "",
    serviceOptionIds: [],
    occasionTypeId: "",
    occasionTypeIdsProject: [],
    occasionTypeIdsRole: [],
    occasionOther: "",
    projectDeadlineNote: "",
    experienceAddons: [],
    eventDate: "",
    eventTimeStart: "",
    eventTimeEnd: "",
    location: "",
    eventAddress: "",
    guestCount: "",
    venueIndoor: "",
    message: "",
    fullName: "",
    email: "",
    phone: "",
  };
}

function phaseFlow(inquiryCode: string): Phase[] {
  const flow: Phase[] = ["service", "detail", "serviceType"];
  if (inquiryCode === "PRIVATE_GALA" || inquiryCode === "VIP_EVENT") {
    flow.push("experiences");
  }
  flow.push("logistics", "expectations", "contact", "review");
  return flow;
}

function isGalaOrVip(code: string): boolean {
  return code === "PRIVATE_GALA" || code === "VIP_EVENT";
}

function isBespoke(code: string): boolean {
  return code === "BESPOKE";
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validatePhase(
  phase: Phase,
  d: WizardData,
  contactLines: ContactLine[],
  opts: {
    catalogDismissed: boolean;
    catalogSnapshot: CatalogSnapshot | null;
    hadServiceTypeInUrl: boolean;
  },
): string | null {
  const serviceCatalogActive = opts.catalogSnapshot?.kind === "service" && !opts.catalogDismissed;

  switch (phase) {
    case "service": {
      if (contactLines.length === 0) {
        return null;
      }
      if (!d.contactLineId) return "Please select one of the catalog offerings below.";
      return null;
    }
    case "detail": {
      const line = contactLines.find((l) => l.id === d.contactLineId);
      const singles = line?.occasionSingle ?? [];
      if (singles.length > 0 && !d.occasionTypeId) {
        return "Please select the type of occasion.";
      }
      const projects = line?.occasionBespokeProject ?? [];
      const roles = line?.occasionBespokeRole ?? [];
      if (projects.length > 0 && d.occasionTypeIdsProject.length === 0) {
        return "Select at least one project type.";
      }
      if (roles.length > 0 && d.occasionTypeIdsRole.length === 0) {
        return "Select at least one collaboration role.";
      }
      return null;
    }
    case "serviceType": {
      if (serviceCatalogActive && isValidInquiryCode(d.inquiryCode)) return null;
      if (!serviceCatalogActive && d.serviceOptionIds.length === 0) {
        return "Please select at least one service option.";
      }
      if (!isValidInquiryCode(d.inquiryCode)) {
        return "Please select at least one valid service type for your request.";
      }
      return null;
    }
    case "experiences":
      return null;
    case "logistics": {
      if (isGalaOrVip(d.inquiryCode)) {
        if (!d.eventDate.trim()) return "Please choose an event date (approximate is fine).";
        return null;
      }
      const line = contactLines.find((l) => l.id === d.contactLineId);
      const lineHasBespokeGroups =
        (line?.occasionBespokeProject?.length ?? 0) > 0 || (line?.occasionBespokeRole?.length ?? 0) > 0;
      if (isBespoke(d.inquiryCode) || lineHasBespokeGroups) {
        const hasDate = Boolean(d.eventDate.trim());
        const noteOk = d.projectDeadlineNote.trim().length >= 5;
        if (!hasDate && !noteOk) {
          return "Provide an event date or a project deadline / date window (at least 5 characters).";
        }
        return null;
      }
      return null;
    }
    case "expectations": {
      if (d.message.trim().length < 10) return "Please share at least 10 characters about your vision.";
      if (d.message.length > 4000) return "Description must be at most 4000 characters.";
      return null;
    }
    case "contact": {
      if (d.fullName.trim().length < 2) return "Name must be at least 2 characters.";
      if (!d.email.trim()) return "Email is required.";
      if (!emailRegex.test(d.email.trim())) return "Enter a valid email address.";
      if (d.phone.trim()) {
        const digits = d.phone.replace(/\D/g, "");
        if (digits.length < 7 || d.phone.length > 40) {
          return "Enter a valid phone number (7+ digits).";
        }
      }
      return null;
    }
    case "review":
      return null;
    default:
      return null;
  }
}

function validateLogisticsFields(d: WizardData): string | null {
  if (d.location.length > 300) return "Location must be at most 300 characters.";
  if (d.eventAddress.length > 400) return "Event address must be at most 400 characters.";
  if (d.eventDate.trim()) {
    const dt = parseISOLocal(d.eventDate);
    if (!dt) return "Invalid date.";
    if (dt < startOfTodayLocal()) return "Event date cannot be in the past.";
  }
  const ts = d.eventTimeStart.trim() ? hhmmToMinutes(d.eventTimeStart) : null;
  const te = d.eventTimeEnd.trim() ? hhmmToMinutes(d.eventTimeEnd) : null;
  if (d.eventTimeStart.trim() && ts === null) return "Invalid performance start time.";
  if (d.eventTimeEnd.trim() && te === null) return "Invalid performance end time.";
  if (ts !== null && te !== null && te <= ts) {
    return "Performance end must be after performance start.";
  }
  if (d.guestCount.trim()) {
    const n = Number(d.guestCount);
    if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) return "Guest count must be a whole number.";
  }
  return null;
}

function buildInquiryDetails(
  d: WizardData,
  entrySource: InquiryEntrySource,
  activeCatalog: CatalogSnapshot | null,
  serviceTypeOptions: PublicServiceOption[],
): Record<string, unknown> | undefined {
  const out: Record<string, unknown> = { entrySource };

  if (activeCatalog) {
    const title =
      activeCatalog.title.length > 120 ? activeCatalog.title.slice(0, 120) : activeCatalog.title;
    out.sourceCatalogKind = activeCatalog.kind;
    out.sourceCatalogId = activeCatalog.id;
    out.sourceCatalogTitle = title;
  }

  if (d.contactLineKind === "event" && d.contactLineId.trim()) {
    out.eventId = d.contactLineId.trim();
  }
  if (d.eventTypeId.trim()) {
    out.eventTypeId = d.eventTypeId.trim();
  }

  if (d.occasionTypeId.trim()) out.occasionTypeId = d.occasionTypeId.trim();
  if (d.occasionOther.trim()) out.occasionOther = d.occasionOther.trim();

  if (isGalaOrVip(d.inquiryCode) && d.experienceAddons.length) {
    out.experienceAddons = d.experienceAddons;
  }

  if (d.occasionTypeIdsProject.length) out.occasionTypeIdsProject = d.occasionTypeIdsProject;
  if (d.occasionTypeIdsRole.length) out.occasionTypeIdsRole = d.occasionTypeIdsRole;
  if (d.projectDeadlineNote.trim()) out.projectDeadlineNote = d.projectDeadlineNote.trim();

  if (d.eventTimeStart.trim()) out.eventTimeStart = d.eventTimeStart.trim();
  if (d.eventTimeEnd.trim()) out.eventTimeEnd = d.eventTimeEnd.trim();

  if (d.eventAddress.trim()) out.eventAddress = d.eventAddress.trim();

  if (d.guestCount.trim()) {
    const n = Number(d.guestCount);
    if (Number.isFinite(n) && n > 0) out.guestCount = n;
  }

  if (d.venueIndoor === "indoor") out.venueIndoor = true;
  if (d.venueIndoor === "outdoor") out.venueIndoor = false;

  if (d.serviceOptionIds.length) {
    const allUuid = d.serviceOptionIds.every((id) => SERVICE_OPTION_UUID_RE.test(id));
    if (allUuid) out.serviceIds = d.serviceOptionIds;
    const labels = d.serviceOptionIds
      .map((id) => {
        const opt = serviceTypeOptions.find((o) => o.id === id);
        if (opt) return opt.title.trim();
        if (isValidInquiryCode(id)) return readableInquiryCode(id);
        return id.trim();
      })
      .filter(Boolean);
    if (labels.length) out.serviceLabels = labels;
  }

  return out;
}

function lineDescriptionPreview(description: string, max = 140): string {
  const oneLine = description.replace(/\s+/g, " ").trim();
  if (!oneLine) return "";
  return oneLine.length > max ? `${oneLine.slice(0, max - 1)}…` : oneLine;
}

function readableInquiryCode(code: string): string {
  return code.replace(/_/g, " ").trim();
}

function inferInquiryCodeFromService(
  contactInquiryCode: string | null | undefined,
  title: string,
): ServiceTypeCode {
  if (contactInquiryCode && isValidInquiryCode(contactInquiryCode)) return contactInquiryCode;
  const n = title.toLowerCase();
  if (n.includes("vip")) return "VIP_EVENT";
  if (n.includes("gala")) return "PRIVATE_GALA";
  if (n.includes("bespoke")) return "BESPOKE";
  return "GENERAL";
}

export default function ContactInquiryForm({
  initialServiceType,
  hadServiceTypeInUrl = false,
  initialEventId,
  hadEventIdInUrl = false,
  entrySource = "contact_page",
  initialCatalog,
}: ContactInquiryFormProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "/contacto";
  const searchParams = useSearchParams();
  const isLg = useMediaQuery("(min-width: 1024px)");

  const [data, setData] = useState<WizardData>(() => emptyWizard(initialServiceType));
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [stepError, setStepError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitFeedbackPhase, setSubmitFeedbackPhase] = useState<InquirySubmitFeedbackPhase>("idle");
  const [apiError, setApiError] = useState<string | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [occasionPickerOpen, setOccasionPickerOpen] = useState(false);
  const [timePickerWhich, setTimePickerWhich] = useState<null | "start" | "end">(null);
  const [occupiedRanges, setOccupiedRanges] = useState<Array<{ startMinutes: number; endMinutes: number }>>([]);

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

  const [detailModal, setDetailModal] = useState<
    | { kind: "contactLine"; line: ContactLine }
    | { kind: "service"; option: PublicServiceOption }
    | null
  >(null);

  /** Avoid re-jumping phases when contact-lines refetch; reset when `eventId` leaves the URL. */
  const skipServiceAppliedForEventIdRef = useRef<string | undefined>(undefined);

  const flow = useMemo(() => phaseFlow(data.inquiryCode), [data.inquiryCode]);
  const currentPhase = flow[phaseIndex] ?? "service";

  useEffect(() => {
    setPhaseIndex((i) => Math.min(i, Math.max(0, flow.length - 1)));
  }, [flow]);

  useEffect(() => {
    if (currentPhase !== "detail") setOccasionPickerOpen(false);
  }, [currentPhase]);

  const apiBaseUrl = useMemo(
    () => (process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001").replace(/\/$/, ""),
    [],
  );

  const bookingTz = useMemo(() => process.env.NEXT_PUBLIC_BOOKING_TZ ?? "America/New_York", []);
  const { rules: availabilityRules } = usePublicAvailability(true);
  const blockedIsoDates = useMemo(() => {
    if (!availabilityRules?.weekly) return new Set<string>();
    return expandBlockedDates(bookingTz, availabilityRules.weekly, availabilityRules.closures, 420);
  }, [availabilityRules, bookingTz]);

  const blockedReasonByIso = useMemo(() => {
    if (!availabilityRules?.weekly) return new Map<string, string>();
    return expandBlockedDateReasonsMap(bookingTz, availabilityRules.weekly, availabilityRules.closures, 420);
  }, [availabilityRules, bookingTz]);

  const startTimeClamp = useMemo(() => {
    if (!availabilityRules?.weekly || !data.eventDate) return undefined;
    return timeBoundsForDateISO(data.eventDate, bookingTz, availabilityRules.weekly);
  }, [availabilityRules, data.eventDate, bookingTz]);

  const minSelectableIso = availabilityRules ? isoDateInTzNow(bookingTz) : undefined;

  useEffect(() => {
    if (!data.eventDate) {
      setOccupiedRanges([]);
      return;
    }
    let cancelled = false;
    const loadOccupied = () => {
      fetch(`${apiBaseUrl}/api/v1/bookings/public/occupied?date=${encodeURIComponent(data.eventDate)}`, {
        cache: "no-store",
      })
        .then(async (res) => {
          if (!res.ok) throw new Error("occupied");
          return res.json();
        })
        .then((json: unknown) => {
          if (cancelled || !json || typeof json !== "object") return;
          const occupied = (json as { occupied?: unknown }).occupied;
          if (!Array.isArray(occupied)) {
            setOccupiedRanges([]);
            return;
          }
          const parsed = occupied
            .map((row) => {
              const o = row as { startMinutes?: unknown; endMinutes?: unknown };
              const startMinutes = Number(o.startMinutes);
              const endMinutes = Number(o.endMinutes);
              if (!Number.isFinite(startMinutes) || !Number.isFinite(endMinutes)) return null;
              return { startMinutes, endMinutes };
            })
            .filter(Boolean) as Array<{ startMinutes: number; endMinutes: number }>;
          setOccupiedRanges(parsed);
        })
        .catch(() => {
          if (!cancelled) setOccupiedRanges([]);
        });
    };

    loadOccupied();
    const interval = window.setInterval(loadOccupied, 45000);
    const onFocus = () => loadOccupied();
    const onVisible = () => {
      if (document.visibilityState === "visible") loadOccupied();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [apiBaseUrl, data.eventDate]);

  useEffect(() => {
    if (!data.eventDate) return;

    if (blockedIsoDates.has(data.eventDate)) {
      setData((prev) =>
        prev.eventDate
          ? {
              ...prev,
              eventDate: "",
              eventTimeStart: "",
              eventTimeEnd: "",
            }
          : prev,
      );
      setStepError("That date just became unavailable. Please choose another date.");
      return;
    }

    if (!startTimeClamp) return;
    const min = startTimeClamp.minMinutes;
    const max = startTimeClamp.maxMinutes;
    const startMin = data.eventTimeStart ? hhmmToMinutes(data.eventTimeStart) : null;
    const endMin = data.eventTimeEnd ? hhmmToMinutes(data.eventTimeEnd) : null;

    if ((startMin !== null && (startMin < min || startMin > max)) || (endMin !== null && (endMin < min || endMin > max))) {
      setData((prev) => ({
        ...prev,
        eventTimeStart: "",
        eventTimeEnd: "",
      }));
      setStepError("The time window changed for that date. Please select times again.");
    }
  }, [blockedIsoDates, data.eventDate, data.eventTimeStart, data.eventTimeEnd, startTimeClamp]);

  useEffect(() => {
    const startMin = data.eventTimeStart ? hhmmToMinutes(data.eventTimeStart) : null;
    const endMin = data.eventTimeEnd ? hhmmToMinutes(data.eventTimeEnd) : null;
    const intersectsBlocked = (m: number | null) =>
      m !== null && occupiedRanges.some((r) => m >= r.startMinutes && m <= r.endMinutes);
    if (!intersectsBlocked(startMin) && !intersectsBlocked(endMin)) return;
    setData((prev) => ({
      ...prev,
      eventTimeStart: "",
      eventTimeEnd: "",
    }));
    setStepError("That schedule is no longer available. Please choose another time.");
  }, [data.eventTimeStart, data.eventTimeEnd, occupiedRanges]);

  useEffect(() => {
    let cancelled = false;
    setLinesLoading(true);
    setLinesError(null);
    fetch(`${apiBaseUrl}/api/v1/events/contact-lines`)
      .then((res) => {
        if (!res.ok) throw new Error("lines");
        return res.json();
      })
      .then((json: unknown) => {
        if (cancelled || !Array.isArray(json)) return;
        const parsed: ContactLine[] = [];
        for (const row of json as Record<string, unknown>[]) {
          const id = typeof row.id === "string" ? row.id : "";
          const eventTypeId = typeof row.eventTypeId === "string" ? row.eventTypeId : "";
          const eventTypeName = typeof row.eventTypeName === "string" ? row.eventTypeName : "";
          if (!id || !eventTypeId) continue;
          const mapOpts = (v: unknown): { id: string; name: string }[] => {
            if (!Array.isArray(v)) return [];
            return v
              .map((x) => {
                const o = x as Record<string, unknown>;
                const oid = typeof o.id === "string" ? o.id : "";
                const name = typeof o.name === "string" ? o.name : "";
                return oid && name ? { id: oid, name } : null;
              })
              .filter(Boolean) as { id: string; name: string }[];
          };
          parsed.push({
            id,
            eventTypeId,
            eventTypeName,
            contactInquiryCode: typeof row.contactInquiryCode === "string" ? row.contactInquiryCode : null,
            description: typeof row.description === "string" ? row.description : "",
            items: Array.isArray(row.items)
              ? (row.items as unknown[])
                  .map((v) => (typeof v === "string" ? v.trim() : ""))
                  .filter(Boolean)
              : [],
            images: Array.isArray(row.images)
              ? (row.images as unknown[])
                  .map((v) => (typeof v === "string" ? v.trim() : ""))
                  .filter(Boolean)
              : [],
            heroImageUrl:
              typeof row.heroImageUrl === "string" && row.heroImageUrl.trim().length > 0
                ? row.heroImageUrl.trim()
                : undefined,
            heroMediaType:
              typeof row.heroMediaType === "string" && row.heroMediaType.trim().length > 0
                ? row.heroMediaType.trim()
                : undefined,
            lineKind: row.lineKind === "event_type" ? "event_type" : "event",
            price: (() => {
              const raw = row.price;
              if (raw == null || raw === "") return null;
              const n = typeof raw === "number" ? raw : Number(raw);
              return Number.isFinite(n) ? n : null;
            })(),
            occasionSingle: mapOpts(row.occasionSingle),
            occasionBespokeProject: mapOpts(row.occasionBespokeProject),
            occasionBespokeRole: mapOpts(row.occasionBespokeRole),
          });
        }
        setContactLines(parsed);
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
  }, [data.serviceOptionIds.join("|"), data.inquiryCode, serviceTypeOptions]);

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

    if (
      hadEventIdInUrl &&
      skipServiceAppliedForEventIdRef.current !== initialEventId
    ) {
      skipServiceAppliedForEventIdRef.current = initialEventId;
      const detailIdx = phaseFlow("").indexOf("detail");
      if (detailIdx >= 0) setPhaseIndex(detailIdx);
    }
  }, [initialEventId, contactLines, hadEventIdInUrl, catalogDismissed, hadServiceTypeInUrl]);

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
  }, [initialCatalog, catalogDismissed, apiBaseUrl, hadServiceTypeInUrl]);

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
  }, [contactLines, catalogSnapshot, catalogDismissed, hadServiceTypeInUrl]);

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
  }, [contactLines, data.contactLineId, data.occasionTypeId]);

  const dismissCatalogContext = useCallback(() => {
    stripCatalogFromUrl();
    setCatalogDismissed(true);
    setCatalogSnapshot(null);
    setCatalogFetchError(null);
    setCatalogLoading(false);
    skipServiceAppliedForEventIdRef.current = undefined;
    setData(() => emptyWizard(undefined));
    setPhaseIndex(0);
    setStepError(null);
  }, [stripCatalogFromUrl]);

  const update = useCallback(<K extends keyof WizardData>(key: K, value: WizardData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
    setStepError(null);
    setApiError(null);
    setSubmitFeedbackPhase("idle");
  }, []);

  const handleInquirySubmitComplete = useCallback(() => {
    setData(emptyWizard(initialServiceType));
    setPhaseIndex(0);
    setCatalogSnapshot(null);
    setCatalogDismissed(false);
    setCatalogFetchError(null);
    setSubmitFeedbackPhase("idle");
    router.replace("/");
  }, [initialServiceType, router]);

  const validationOpts = useMemo(
    () => ({ catalogDismissed, catalogSnapshot, hadServiceTypeInUrl }),
    [catalogDismissed, catalogSnapshot, hadServiceTypeInUrl],
  );

  /** Home event-card deep link: cannot revisit Offering until "Remove context" clears the URL. */
  const offeringStepLocked = useMemo(
    () => Boolean(hadEventIdInUrl && !catalogDismissed),
    [hadEventIdInUrl, catalogDismissed],
  );

  const detailPhaseIndex = useMemo(() => flow.indexOf("detail"), [flow]);

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
  }, [data, flow, phaseIndex, contactLines, validationOpts]);

  const goBack = useCallback(() => {
    setStepError(null);
    setPhaseIndex((i) => {
      if (offeringStepLocked && detailPhaseIndex >= 0 && i === detailPhaseIndex) return i;
      return Math.max(0, i - 1);
    });
  }, [offeringStepLocked, detailPhaseIndex]);

  const goToPhaseIndex = useCallback(
    (idx: number) => {
      setStepError(null);
      if (offeringStepLocked && idx === 0 && phaseIndex > 0) return;
      setPhaseIndex(Math.max(0, Math.min(idx, flow.length - 1)));
    },
    [flow.length, offeringStepLocked, phaseIndex],
  );

  const toggleAddon = (code: ExperienceAddon) => {
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
  };

  const toggleUuidList = (field: "occasionTypeIdsProject" | "occasionTypeIdsRole", id: string) => {
    setData((prev) => {
      const arr = prev[field];
      const has = arr.includes(id);
      return {
        ...prev,
        [field]: has ? arr.filter((x) => x !== id) : [...arr, id],
      };
    });
    setStepError(null);
  };

  const selectContactLine = (line: ContactLine) => {
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
  };

  const submitInFlightRef = useRef(false);

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (submitInFlightRef.current) return;
    const errContact = validatePhase("contact", data, contactLines, validationOpts);
    const errExp = validatePhase("expectations", data, contactLines, validationOpts);
    const errLog =
      validatePhase("logistics", data, contactLines, validationOpts) || validateLogisticsFields(data);
    if (errContact || errExp || errLog) {
      setStepError(errContact ?? errExp ?? errLog);
      return;
    }
    setApiError(null);
    submitInFlightRef.current = true;
    setSubmitFeedbackPhase("sending");
    setIsSubmitting(true);
    try {
      const activeCatalog = catalogDismissed ? null : catalogSnapshot;
      const inquiryDetails = buildInquiryDetails(data, entrySource, activeCatalog, serviceTypeOptions);
      const res = await fetch(`${apiBaseUrl}/api/v1/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: data.fullName.trim(),
          email: data.email.trim(),
          phone: data.phone.trim() || undefined,
          eventDate: data.eventDate || undefined,
          location: data.location.trim() || undefined,
          serviceType: data.inquiryCode || undefined,
          message: data.message.trim(),
          inquiryDetails,
        }),
      });
      const resData = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = Array.isArray(resData?.message)
          ? resData.message.join(" ")
          : typeof resData?.message === "string"
            ? resData.message
            : "Could not send your inquiry. Please try again.";
        setApiError(msg);
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

  const phaseLabel = (p: Phase): string => {
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
  };

  const selectedLine = contactLines.find((l) => l.id === data.contactLineId);

  const lineHasBespokeGroups =
    (selectedLine?.occasionBespokeProject?.length ?? 0) > 0 ||
    (selectedLine?.occasionBespokeRole?.length ?? 0) > 0;
  const logisticsUsesBespokeDeadlineRule = isBespoke(data.inquiryCode) || lineHasBespokeGroups;

  const logisticsPickerTriggerClass =
    "mt-2 flex min-h-[52px] w-full items-center justify-between gap-3 rounded-xl border border-gold/40 bg-black/30 px-4 py-3.5 text-left text-base text-foreground outline-none transition hover:border-gold focus:border-gold focus:ring-1 focus:ring-gold/30 sm:min-h-14 sm:px-5 sm:py-4 sm:text-lg";

  const occasionSingleLabel =
    selectedLine?.occasionSingle.find((o) => o.id === data.occasionTypeId)?.name ?? "";

  const reviewProjectLabels = data.occasionTypeIdsProject
    .map((id) => selectedLine?.occasionBespokeProject.find((o) => o.id === id)?.name ?? id)
    .join(", ");

  const reviewRoleLabels = data.occasionTypeIdsRole
    .map((id) => selectedLine?.occasionBespokeRole.find((o) => o.id === id)?.name ?? id)
    .join(", ");

  const pricingPreviewEventLine = useMemo((): InquiryPricingPreviewLine | null => {
    if (selectedLine) {
      return { name: selectedLine.eventTypeName, price: selectedLine.price ?? null };
    }
    if (!catalogDismissed && catalogSnapshot?.kind === "event") {
      return { name: catalogSnapshot.title, price: null };
    }
    return null;
  }, [selectedLine, catalogDismissed, catalogSnapshot]);

  const pricingPreviewServiceLines = useMemo((): InquiryPricingPreviewLine[] => {
    const fromOpts = data.serviceOptionIds
      .map((id) => serviceTypeOptions.find((s) => s.id === id))
      .filter((s): s is PublicServiceOption => Boolean(s));
    if (fromOpts.length > 0) {
      return fromOpts.map((o) => ({ name: o.title, price: o.price ?? null }));
    }
    return data.serviceOptionIds
      .filter((id): id is ServiceTypeCode => isValidInquiryCode(id))
      .map((code) => ({ name: readableInquiryCode(code), price: null as number | null }));
  }, [data.serviceOptionIds, serviceTypeOptions]);

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
    if (!detailModal) return null;
    if (detailModal.kind === "contactLine") {
      const line = detailModal.line;
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
    const o = detailModal.option;
    return {
      title: o.title,
      description: o.description ?? "",
      items: o.items,
      imageUrl: o.imageUrl ?? null,
      imageMediaType: o.imageMediaType,
      price: o.price ?? null,
    };
  }, [detailModal]);

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
        {currentPhase === "service" ? (
          <div className="space-y-4">
            <p className="font-body text-lg leading-relaxed text-foreground/80 md:text-xl md:leading-relaxed">
              Which catalog offering best matches what you are planning? Tap the eye to read the full description,
              inclusions, and guide investment.
            </p>
            <div className="space-y-3">
              {contactLines.map((line) => {
                const checked = data.contactLineId === line.id;
                const rowId = `inquiry-contact-line-${line.id}`;
                const priceLabel = formatCatalogPriceWithSuffix(line.price ?? null);
                return (
                  <div
                    key={line.id}
                    className={`flex overflow-hidden rounded border transition-colors ${
                      checked ? "border-gold bg-gold/10" : "border-gold/25 hover:border-gold/45"
                    }`}
                  >
                    <label htmlFor={rowId} className="flex min-w-0 flex-1 cursor-pointer flex-col gap-1 p-4">
                      <div className="flex items-start gap-3">
                        <input
                          id={rowId}
                          type="radio"
                          name="contactLine"
                          value={line.id}
                          checked={checked}
                          onChange={() => selectContactLine(line)}
                          className="mt-1 border-gold/50 text-gold focus:ring-gold"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="font-brand text-base tracking-[0.14em] text-gold sm:text-lg md:text-xl">
                            {line.eventTypeName}
                          </span>
                          <p className="mt-1 font-body text-sm text-foreground/65">
                            {priceLabel ? `Guide from ${priceLabel}` : "Typical investment on request"}
                          </p>
                          {line.description.trim() ? (
                            <p className="mt-1 line-clamp-2 font-body text-sm text-foreground/55">
                              {lineDescriptionPreview(line.description, 140)}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </label>
                    <div className="flex shrink-0 flex-col justify-stretch border-l border-gold/25 bg-black/15">
                      <button
                        type="button"
                        className="inline-flex min-h-13 min-w-13 flex-1 items-center justify-center text-gold transition hover:bg-gold/10 sm:min-h-11 sm:min-w-11"
                        aria-label={`View details for ${line.eventTypeName}`}
                        onClick={() => setDetailModal({ kind: "contactLine", line })}
                      >
                        <Eye className="h-5 w-5" strokeWidth={1.5} aria-hidden />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {currentPhase === "detail" ? (
          <div className="space-y-5">
            {(selectedLine?.occasionSingle.length ?? 0) > 0 ? (
              <div className="mx-auto w-full max-w-lg text-center">
                <p className="font-body text-base leading-relaxed text-foreground/80 md:text-lg">
                  What kind of occasion are you hosting?
                </p>
                <button
                  type="button"
                  onClick={() => setOccasionPickerOpen(true)}
                  className={cn(
                    logisticsPickerTriggerClass,
                    "mx-auto mt-3 block max-w-md text-base md:text-lg",
                  )}
                >
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate font-body",
                      !data.occasionTypeId ? "text-foreground/55" : "font-medium text-foreground",
                    )}
                  >
                    {occasionSingleLabel || "Select occasion"}
                  </span>
                  <ChevronDown className="h-5 w-5 shrink-0 text-gold/80" strokeWidth={2} aria-hidden />
                </button>
              </div>
            ) : null}

            {(selectedLine?.occasionSingle.length ?? 0) === 0 ? (
              <p className="text-sm text-foreground/75 font-body">
                Optional: add any occasion notes for our team if your catalog line does not list a specific occasion type.
              </p>
            ) : null}

            {(selectedLine?.occasionBespokeProject.length ?? 0) > 0 ? (
              <>
                <p className="text-sm text-foreground/75 font-body">Project focus (select all that apply)</p>
                <div className="grid gap-2">
                  {(selectedLine?.occasionBespokeProject ?? []).map((o) => (
                    <label
                      key={o.id}
                      className="flex cursor-pointer items-center gap-3 rounded border border-gold/20 px-3 py-2 text-sm hover:border-gold/40"
                    >
                      <input
                        type="checkbox"
                        checked={data.occasionTypeIdsProject.includes(o.id)}
                        onChange={() => toggleUuidList("occasionTypeIdsProject", o.id)}
                        className="border-gold/50 text-gold focus:ring-gold"
                      />
                      {o.name}
                    </label>
                  ))}
                </div>
              </>
            ) : null}

            {(selectedLine?.occasionBespokeRole.length ?? 0) > 0 ? (
              <>
                <p className="text-sm text-foreground/75 font-body pt-2">How can Shamell contribute?</p>
                <div className="grid gap-2">
                  {(selectedLine?.occasionBespokeRole ?? []).map((o) => (
                    <label
                      key={o.id}
                      className="flex cursor-pointer items-center gap-3 rounded border border-gold/20 px-3 py-2 text-sm hover:border-gold/40"
                    >
                      <input
                        type="checkbox"
                        checked={data.occasionTypeIdsRole.includes(o.id)}
                        onChange={() => toggleUuidList("occasionTypeIdsRole", o.id)}
                        className="border-gold/50 text-gold focus:ring-gold"
                      />
                      {o.name}
                    </label>
                  ))}
                </div>
              </>
            ) : null}

            {isBespoke(data.inquiryCode) ||
            (selectedLine?.occasionBespokeProject.length ?? 0) > 0 ||
            (selectedLine?.occasionBespokeRole.length ?? 0) > 0 ? (
              <div>
                <label className="block">
                  <span className="font-brand text-gold text-sm tracking-[0.14em]">
                    Timeline / deadline notes <span className="text-foreground/40 font-body">(optional here)</span>
                  </span>
                  <textarea
                    value={data.projectDeadlineNote}
                    onChange={(e) => update("projectDeadlineNote", e.target.value)}
                    rows={3}
                    className="mt-2 w-full border border-gold/40 bg-black/30 px-4 py-3 text-foreground outline-none focus:border-gold resize-y min-h-[88px]"
                  />
                </label>
              </div>
            ) : null}
          </div>
        ) : null}

        {currentPhase === "serviceType" ? (
          <div className="space-y-4">
            <p className="font-body text-base leading-relaxed text-foreground/75 md:text-lg">
              Select all service types that apply to this inquiry (one or more). Tap the eye to read the full
              offering.
            </p>
            <div className="grid gap-3">
              {serviceTypeOptions.length > 0
                ? serviceTypeOptions.map((row) => {
                    const checked = data.serviceOptionIds.includes(row.id);
                    const chkId = `inquiry-service-opt-${row.id}`;
                    const priceLabel = formatCatalogPriceWithSuffix(row.price ?? null);
                    return (
                      <div
                        key={row.id}
                        className={`flex overflow-hidden rounded border transition-colors ${
                          checked ? "border-gold bg-gold/10" : "border-gold/25 hover:border-gold/45"
                        }`}
                      >
                        <label htmlFor={chkId} className="flex min-w-0 flex-1 cursor-pointer flex-col gap-1 p-4">
                          <div className="flex items-start gap-3">
                            <input
                              id={chkId}
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                setData((prev) => {
                                  const has = prev.serviceOptionIds.includes(row.id);
                                  const serviceOptionIds = has
                                    ? prev.serviceOptionIds.filter((x) => x !== row.id)
                                    : [...prev.serviceOptionIds, row.id];
                                  const inquiryCode = mergedInquiryCodeFromSelections(
                                    serviceOptionIds,
                                    serviceTypeOptions,
                                  );
                                  return { ...prev, serviceOptionIds, inquiryCode };
                                });
                                setStepError(null);
                              }}
                              className="mt-1 border-gold/50 text-gold focus:ring-gold"
                            />
                            <div className="min-w-0 flex-1">
                              <span className="font-brand text-base tracking-[0.14em] text-gold sm:text-lg md:text-xl">
                                {row.title}
                              </span>
                              <p className="mt-1 font-body text-sm text-foreground/65">
                                {priceLabel ? `Guide from ${priceLabel}` : "Typical investment on request"}
                              </p>
                            </div>
                          </div>
                        </label>
                        <div className="flex shrink-0 flex-col border-l border-gold/25 bg-black/15">
                          <button
                            type="button"
                            className="inline-flex min-h-13 min-w-13 flex-1 items-center justify-center text-gold transition hover:bg-gold/10 sm:min-h-11 sm:min-w-11"
                            aria-label={`View details for ${row.title}`}
                            onClick={() => setDetailModal({ kind: "service", option: row })}
                          >
                            <Eye className="h-5 w-5" strokeWidth={1.5} aria-hidden />
                          </button>
                        </div>
                      </div>
                    );
                  })
                : SERVICE_TYPE_CODES.map((code) => {
                    const id = code;
                    const label = readableInquiryCode(code);
                    const checked = data.serviceOptionIds.includes(id);
                    const chkId = `inquiry-service-fallback-${code}`;
                    return (
                      <label
                        key={code}
                        htmlFor={chkId}
                        className={`flex cursor-pointer flex-col gap-1 rounded border p-4 transition-colors ${
                          checked ? "border-gold bg-gold/10" : "border-gold/25 hover:border-gold/45"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            id={chkId}
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setData((prev) => {
                                const has = prev.serviceOptionIds.includes(id);
                                const serviceOptionIds = has
                                  ? prev.serviceOptionIds.filter((x) => x !== id)
                                  : [...prev.serviceOptionIds, id];
                                const inquiryCode = mergedInquiryCodeFromSelections(
                                  serviceOptionIds,
                                  serviceTypeOptions,
                                );
                                return { ...prev, serviceOptionIds, inquiryCode };
                              });
                              setStepError(null);
                            }}
                            className="mt-1 border-gold/50 text-gold focus:ring-gold"
                          />
                          <div className="min-w-0 flex-1">
                            <span className="font-brand text-base tracking-[0.14em] text-gold sm:text-lg md:text-xl">
                              {label}
                            </span>
                            <p className="mt-1 font-body text-xs text-foreground/50">
                              Detailed catalog pricing loads when services are available from the server.
                            </p>
                          </div>
                        </div>
                      </label>
                    );
                  })}
            </div>
          </div>
        ) : null}

        {currentPhase === "experiences" ? (
          <div className="space-y-4">
            <p className="text-sm text-foreground/75 font-body">
              Optional performance elements. Select any that interest you — we will confirm feasibility for your venue.
            </p>
            <div className="space-y-3">
              {EXPERIENCE_ADDON_OPTIONS.map((o) => (
                <label
                  key={o.value}
                  className={`flex cursor-pointer flex-col gap-1 rounded border p-4 transition-colors ${
                    data.experienceAddons.includes(o.value)
                      ? "border-gold bg-gold/10"
                      : "border-gold/25 hover:border-gold/45"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={data.experienceAddons.includes(o.value)}
                      onChange={() => toggleAddon(o.value)}
                      className="mt-1 border-gold/50 text-gold focus:ring-gold"
                    />
                    <div>
                      <span className="font-brand text-sm tracking-[0.12em] text-gold">{o.label}</span>
                      {o.note ? <p className="mt-1 text-sm text-foreground/60 font-body">{o.note}</p> : null}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        ) : null}

        {currentPhase === "logistics" ? (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <span className="font-brand text-base tracking-[0.12em] text-gold sm:text-lg sm:tracking-[0.14em]">
                  {logisticsUsesBespokeDeadlineRule ? "Key date (if any)" : "Event date"}{" "}
                  {isGalaOrVip(data.inquiryCode) ? (
                    <span className="text-red-300">*</span>
                  ) : (
                    <span className="font-body text-sm normal-case text-foreground/45 sm:text-base">
                      (optional)
                    </span>
                  )}
                </span>
                {logisticsUsesBespokeDeadlineRule ? (
                  <p className="mt-1 font-body text-sm text-foreground/55 sm:text-base">
                    Optional if you provide a deadline note below.
                  </p>
                ) : null}
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
              <Field
                label="Approx. guest count"
                name="guestCount"
                type="number"
                min={0}
                value={data.guestCount}
                onChange={(v) => update("guestCount", v)}
                hint="Optional · whole number"
                inputMode="numeric"
                inputClassName="rounded-xl py-3.5 text-base sm:py-4 sm:text-lg"
                labelClassName="font-brand text-base tracking-[0.12em] text-gold sm:text-lg sm:tracking-[0.14em]"
                hintClassName="mt-1 font-body text-sm text-foreground/55 sm:text-base"
              />
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <span className="font-brand text-base tracking-[0.12em] text-gold sm:text-lg sm:tracking-[0.14em]">
                  Performance start{" "}
                  <span className="font-body text-sm normal-case text-foreground/45 sm:text-base">(optional)</span>
                </span>
                <p className="mt-1 font-body text-sm text-foreground/55 sm:text-base">12-hour US format</p>
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
                  Performance end{" "}
                  <span className="font-body text-sm normal-case text-foreground/45 sm:text-base">(optional)</span>
                </span>
                <p className="mt-1 font-body text-sm text-foreground/55 sm:text-base">Must be after start time</p>
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
            <Field
              label="City / venue"
              name="location"
              value={data.location}
              onChange={(v) => update("location", v)}
              hint="Optional — helps us quote travel and logistics."
              inputClassName="rounded-xl py-3.5 text-base sm:py-4 sm:text-lg"
              labelClassName="font-brand text-base tracking-[0.12em] text-gold sm:text-lg sm:tracking-[0.14em]"
              hintClassName="mt-1 font-body text-sm text-foreground/55 sm:text-base"
            />
            <label className="block">
              <span className="font-brand text-base tracking-[0.12em] text-gold sm:text-lg sm:tracking-[0.14em]">
                Event address{" "}
                <span className="font-body text-sm normal-case text-foreground/45 sm:text-base">(optional)</span>
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
              <p className="mt-1.5 font-body text-sm text-foreground/55 sm:text-base">
                {data.eventAddress.length}/400 — street or venue address (city can go above)
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
        ) : null}

        {currentPhase === "expectations" ? (
          <div className="space-y-5">
            <div>
              <label className="block">
                <span className="font-brand text-base tracking-[0.12em] text-gold sm:text-lg sm:tracking-[0.14em]">
                  Main description <span className="text-red-300">*</span>
                </span>
                <textarea
                  value={data.message}
                  onChange={(e) => update("message", e.target.value)}
                  rows={6}
                  required
                  className="mt-2 min-h-[160px] w-full resize-y border border-gold/40 bg-black/30 px-4 py-3.5 font-body text-base leading-relaxed text-foreground outline-none transition-colors placeholder:text-foreground/45 focus:border-gold sm:min-h-[180px] sm:px-5 sm:py-4 sm:text-lg"
                />
              </label>
              <p className="mt-1 text-right text-sm text-foreground/40 sm:text-base">{data.message.length}/4000</p>
            </div>
          </div>
        ) : null}

        {currentPhase === "contact" ? (
          <div className="space-y-5">
            <Field
              label="Full name"
              name="fullName"
              value={data.fullName}
              onChange={(v) => update("fullName", v)}
              required
            />
            <Field
              label="Email"
              name="email"
              type="email"
              value={data.email}
              onChange={(v) => update("email", v)}
              required
            />
            <Field
              label="Phone"
              name="phone"
              type="tel"
              value={data.phone}
              onChange={(v) => update("phone", v)}
              hint="Optional — include country code if outside your region."
            />
          </div>
        ) : null}

        {currentPhase === "review" ? (
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
        ) : null}

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

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  required,
  hint,
  min,
  inputMode,
  inputClassName,
  labelClassName,
  hintClassName,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  hint?: string;
  min?: number;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
  inputClassName?: string;
  labelClassName?: string;
  hintClassName?: string;
}) {
  return (
    <div>
      <label className="block" htmlFor={name}>
        <span
          className={labelClassName ?? "font-brand text-gold text-sm tracking-[0.14em]"}
        >
          {label}{" "}
          {required ? <span className="text-red-300">*</span> : null}
          {!required && !hint ? (
            <span className="text-foreground/40 font-body normal-case">(optional)</span>
          ) : null}
        </span>
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          min={min !== undefined ? min : undefined}
          inputMode={inputMode}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className={`mt-2 w-full border border-gold/40 bg-black/30 px-4 py-3 text-base text-foreground outline-none focus:border-gold ${inputClassName ?? ""}`}
        />
      </label>
      {hint ? (
        <p
          className={
            hintClassName ?? "mt-1 text-xs text-foreground/45 font-body sm:text-sm"
          }
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}
