import {
  hhmmToMinutes,
  parseISOLocal,
  startOfTodayLocal,
} from "@/lib/contactLogisticsUtils";
import { isValidInquiryCode, type ServiceTypeCode } from "@/lib/contactInquiryConstants";
import { isBespoke } from "./inquiryCodeUtils";
import type { CatalogSnapshot, ContactLine, Phase, WizardData } from "./wizardTypes";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const LOGISTICS_LOCATION_MIN = 2;
export const LOGISTICS_LOCATION_MAX = 300;
export const LOGISTICS_ADDRESS_MIN = 5;
export const LOGISTICS_ADDRESS_MAX = 400;
export const LOGISTICS_GUEST_MIN = 1;
export const LOGISTICS_GUEST_MAX = 50_000;
export const LOGISTICS_PROJECT_NOTE_MIN = 5;
export const LOGISTICS_PROJECT_NOTE_MAX = 500;

export type WizardValidationOpts = {
  catalogDismissed: boolean;
  catalogSnapshot: CatalogSnapshot | null;
  hadServiceTypeInUrl: boolean;
};

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

function lineUsesBespokeDateRule(
  d: WizardData,
  line: ContactLine | undefined,
): boolean {
  if (isBespoke(d.inquiryCode)) return true;
  return (
    (line?.occasionBespokeProject?.length ?? 0) > 0 ||
    (line?.occasionBespokeRole?.length ?? 0) > 0
  );
}

function validateVenueAndGuests(d: WizardData): string | null {
  const location = d.location.trim();
  if (!location) return "City / venue is required.";
  if (location.length < LOGISTICS_LOCATION_MIN) {
    return `City / venue must be at least ${LOGISTICS_LOCATION_MIN} characters.`;
  }
  if (location.length > LOGISTICS_LOCATION_MAX) {
    return `City / venue must be at most ${LOGISTICS_LOCATION_MAX} characters.`;
  }

  const address = d.eventAddress.trim();
  if (!address) return "Event address is required.";
  if (address.length < LOGISTICS_ADDRESS_MIN) {
    return `Event address must be at least ${LOGISTICS_ADDRESS_MIN} characters.`;
  }
  if (address.length > LOGISTICS_ADDRESS_MAX) {
    return `Event address must be at most ${LOGISTICS_ADDRESS_MAX} characters.`;
  }

  const guestRaw = d.guestCount.trim();
  if (!guestRaw) return "Approx. guest count is required.";
  const n = Number(guestRaw);
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    return "Guest count must be a whole number.";
  }
  if (n < LOGISTICS_GUEST_MIN || n > LOGISTICS_GUEST_MAX) {
    return `Guest count must be between ${LOGISTICS_GUEST_MIN} and ${LOGISTICS_GUEST_MAX.toLocaleString()}.`;
  }

  return null;
}

function validatePerformanceTimes(d: WizardData): string | null {
  if (!d.eventTimeStart.trim()) return "Please select a performance start time.";
  if (!d.eventTimeEnd.trim()) return "Please select a performance end time.";

  const ts = hhmmToMinutes(d.eventTimeStart);
  const te = hhmmToMinutes(d.eventTimeEnd);
  if (ts === null) return "Invalid performance start time.";
  if (te === null) return "Invalid performance end time.";
  if (te <= ts) return "Performance end must be after performance start.";
  return null;
}

function validateEventDateField(d: WizardData): string | null {
  if (!d.eventDate.trim()) return "Please choose an event date.";
  const dt = parseISOLocal(d.eventDate);
  if (!dt) return "Invalid event date.";
  if (dt < startOfTodayLocal()) return "Event date cannot be in the past.";
  return null;
}

export function validateLogisticsFields(
  d: WizardData,
  bespokeDateRule: boolean,
): string | null {
  const note = d.projectDeadlineNote.trim();
  if (note.length > LOGISTICS_PROJECT_NOTE_MAX) {
    return `Project deadline note must be at most ${LOGISTICS_PROJECT_NOTE_MAX} characters.`;
  }

  const hasDate = Boolean(d.eventDate.trim());

  if (bespokeDateRule) {
    const noteOk = note.length >= LOGISTICS_PROJECT_NOTE_MIN;
    if (!hasDate && !noteOk) {
      return "Provide an event date or a project deadline / date window (at least 5 characters).";
    }
    if (!hasDate) {
      return validateVenueAndGuests(d);
    }
  }

  const dateErr = validateEventDateField(d);
  if (dateErr) return dateErr;

  const timesErr = validatePerformanceTimes(d);
  if (timesErr) return timesErr;

  return validateVenueAndGuests(d);
}

export function validatePhase(
  phase: Phase,
  d: WizardData,
  contactLines: ContactLine[],
  opts: WizardValidationOpts,
): string | null {
  const serviceCatalogActive =
    opts.catalogSnapshot?.kind === "service" && !opts.catalogDismissed;

  switch (phase) {
    case "service": {
      if (contactLines.length === 0) {
        if (serviceCatalogActive && isValidInquiryCode(d.inquiryCode)) return null;
        return "Catalog offerings are not available. Please try again later.";
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
      const line = contactLines.find((l) => l.id === d.contactLineId);
      return validateLogisticsFields(d, lineUsesBespokeDateRule(d, line));
    }
    case "expectations": {
      if (d.message.trim().length < 10) {
        return "Please share at least 10 characters about your vision.";
      }
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

export function getPhaseValidationError(
  phase: Phase,
  d: WizardData,
  contactLines: ContactLine[],
  opts: WizardValidationOpts,
): string | null {
  return validatePhase(phase, d, contactLines, opts);
}

export function canAdvanceFromPhase(
  phase: Phase,
  d: WizardData,
  contactLines: ContactLine[],
  opts: WizardValidationOpts,
): boolean {
  return getPhaseValidationError(phase, d, contactLines, opts) === null;
}
