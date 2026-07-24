import type { ConciergeFormData } from "../../types/contacto.types";
import type {
  CatalogSnapshot,
  ContactLine,
  PublicServiceOption,
  WizardData,
} from "../../lib/inquiry/wizardTypes";
import { emptyWizard } from "../../lib/inquiry/wizardValidation";
import {
  FIXTURE_CATALOG_ID,
  FIXTURE_CONTACT_LINE_ID,
  FIXTURE_EVENT_TYPE_ID,
  FIXTURE_OCCASION_ID,
  FIXTURE_SERVICE_ID,
} from "./uuids.fixture";

export function makeContactLine(
  overrides: Partial<ContactLine> = {},
): ContactLine {
  return {
    id: FIXTURE_CONTACT_LINE_ID,
    eventTypeId: FIXTURE_EVENT_TYPE_ID,
    eventTypeName: "Private weddings",
    contactInquiryCode: "PRIVATE_GALA",
    description: "An elegant private wedding package.",
    items: ["Dance set", "Sound check"],
    images: ["https://cdn.example.com/line.jpg"],
    heroImageUrl: "https://cdn.example.com/hero.jpg",
    heroMediaType: "IMAGE",
    price: 2500,
    lineKind: "event",
    occasionSingle: [{ id: FIXTURE_OCCASION_ID, name: "Wedding" }],
    occasionBespokeProject: [],
    occasionBespokeRole: [],
    ...overrides,
  };
}

export function makeContactLinesApiPayload(
  items: ContactLine[] = [makeContactLine()],
) {
  return items;
}

export function makePublicServiceOption(
  overrides: Partial<PublicServiceOption> = {},
): PublicServiceOption {
  return {
    id: FIXTURE_SERVICE_ID,
    title: "Performance",
    inquiryCode: "PRIVATE_GALA",
    description: "Private show package.",
    items: ["Dance set"],
    imageUrl: "https://cdn.example.com/service.jpg",
    imageMediaType: "IMAGE",
    price: 1500,
    ...overrides,
  };
}

export function makeCatalogSnapshot(
  overrides: Partial<CatalogSnapshot> = {},
): CatalogSnapshot {
  return {
    kind: "event",
    id: FIXTURE_CATALOG_ID,
    title: "Gala Night",
    contactInquiryCode: "PRIVATE_GALA",
    description: "Catalog offering",
    items: ["Host"],
    imageUrl: "https://cdn.example.com/catalog.jpg",
    imageMediaType: "IMAGE",
    ...overrides,
  };
}

export function makeWizardData(overrides: Partial<WizardData> = {}): WizardData {
  return {
    ...emptyWizard(),
    contactLineId: FIXTURE_CONTACT_LINE_ID,
    contactLineKind: "event",
    eventTypeId: FIXTURE_EVENT_TYPE_ID,
    inquiryCode: "PRIVATE_GALA",
    fullName: "Ada Lovelace",
    email: "ada@example.com",
    phone: "+15551234567",
    message: "We would love to book a private show.",
    eventDate: "2030-08-01",
    eventTimeStart: "19:00",
    eventTimeEnd: "22:00",
    location: "Miami",
    guestCount: "80",
    venueIndoor: "indoor",
    ...overrides,
  };
}

export function makeConciergeFormData(
  overrides: Partial<ConciergeFormData> = {},
): ConciergeFormData {
  return {
    fullName: "Ada Lovelace",
    email: "ada@example.com",
    phone: "+15551234567",
    location: "Miami",
    eventDate: "2030-08-01",
    occasionHint: "Wedding",
    guestCount: "80",
    planningStage: "Exploring options",
    message: "Looking for guidance on a private celebration.",
    ...overrides,
  };
}

export function makeOccupiedRangesPayload(
  occupied: { startMinutes: number; endMinutes: number }[] = [
    { startMinutes: 600, endMinutes: 720 },
  ],
) {
  return { occupied };
}

export function makePublicAvailabilityPayload() {
  return {
    timeZone: "America/New_York",
    weekly: [],
    closures: [],
  };
}
