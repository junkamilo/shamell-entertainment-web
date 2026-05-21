import {
  hhmmToMinutes,
  parseISOLocal,
  startOfTodayLocal,
} from "@/lib/contactLogisticsUtils";
import { isValidInquiryCode, type ServiceTypeCode } from "@/lib/contactInquiryConstants";
import { isBespoke, isGalaOrVip } from "./inquiryCodeUtils";
import type { CatalogSnapshot, ContactLine, Phase, WizardData } from "./wizardTypes";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function emptyWizard(initialServiceType?: ServiceTypeCode): WizardData {
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

export function phaseFlow(inquiryCode: string): Phase[] {
  const flow: Phase[] = ["service", "detail", "serviceType"];
  if (inquiryCode === "PRIVATE_GALA" || inquiryCode === "VIP_EVENT") {
    flow.push("experiences");
  }
  flow.push("logistics", "expectations", "contact", "review");
  return flow;
}

export function validatePhase(
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

export function validateLogisticsFields(d: WizardData): string | null {
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
