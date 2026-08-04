import type { AboutContentItem } from "@/lib/about/aboutContent";
import type { HeaderTextContent } from "@/lib/header-media/headerTextTypes";
import type { OnComingEventsPromo } from "@/lib/on-coming-events/onComingSettings";
import type { AdminBookingRow } from "../../use-admin-bookings";
import type { ContactRequest } from "../../use-admin-contact-requests";
import {
  FIXTURE_ABOUT_TITLE,
  FIXTURE_BOOKING_ID,
  FIXTURE_CONTACT_ID,
  FIXTURE_HEADER_HEADLINE,
  FIXTURE_SERVICE_ID,
  FIXTURE_SERVICE_TYPE_NAME,
} from "./uuids.fixture";

export function makeAboutContent(
  overrides: Partial<AboutContentItem> = {},
): AboutContentItem {
  return {
    title: FIXTURE_ABOUT_TITLE,
    paragraph1: "Fixture about copy for public hooks tests.",
    coreValues: ["Excellence", "Luxury"],
    imageUrl: "https://cdn.example.com/about.jpg",
    heroMediaType: "IMAGE",
    videoDeliveryUrl: null,
    videoPosterUrl: null,
    ...overrides,
  };
}

export function makeHeaderTextContent(
  overrides: Partial<HeaderTextContent> = {},
): HeaderTextContent {
  return {
    headline: FIXTURE_HEADER_HEADLINE,
    headlineFont: "brand",
    headlineColor: "#c5a55a",
    tagline: "Fixture tagline",
    taglineFont: "elegant",
    taglineColor: "#f5e6b8",
    quote: "Fixture quote",
    quoteFont: "script",
    quoteColor: "#c5a55a",
    ...overrides,
  };
}

export function makeOnComingPromo(
  overrides: Partial<OnComingEventsPromo> = {},
): OnComingEventsPromo {
  return {
    clientEnabled: true,
    promoTitle: "Hooks Promo",
    promoDescription: "Promo for shared hooks tests",
    promoImageUrl: "https://cdn.example.com/promo.jpg",
    reservationEventDate: "2030-08-01",
    reservationOpensAt: null,
    reservationClosesAt: null,
    reservationEventLabel: "Gala Night",
    reservationTimezone: "America/New_York",
    updatedAt: "2030-07-01T00:00:00.000Z",
    ...overrides,
  };
}

export function makeAdminBookingRow(
  overrides: Partial<AdminBookingRow> = {},
): AdminBookingRow {
  return {
    id: FIXTURE_BOOKING_ID,
    eventDate: "2026-07-22T14:00:00.000Z",
    location: "Studio A",
    status: "CONFIRMED",
    source: "ADMIN_PHONE",
    guestFullName: "Ada Guest",
    guestEmail: "ada@example.com",
    guestPhone: "555-0100",
    guestCount: 2,
    service: {
      id: FIXTURE_SERVICE_ID,
      serviceType: { name: FIXTURE_SERVICE_TYPE_NAME },
    },
    ...overrides,
  };
}

export function makeAdminBookingsPayload(
  items: AdminBookingRow[] = [makeAdminBookingRow()],
) {
  return {
    items,
    meta: {
      page: 1,
      perPage: 10,
      totalItems: items.length,
      totalPages: 1,
      hasPrev: false,
      hasNext: false,
    },
  };
}

export function makeContactRequest(
  overrides: Partial<ContactRequest> = {},
): ContactRequest {
  return {
    id: FIXTURE_CONTACT_ID,
    fullName: "Contact Guest",
    email: "contact@example.com",
    phone: "555-0200",
    eventDate: "2026-08-01",
    location: "Miami",
    serviceType: "Gala",
    preferences: null,
    subject: "Inquiry",
    message: "Hello",
    inquiryDetails: null,
    conciergeVisionSnapshot: null,
    isRead: false,
    status: "PENDING",
    createdAt: "2026-07-01T12:00:00.000Z",
    ...overrides,
  };
}

export function makeContactRequestsPayload(
  items: ContactRequest[] = [makeContactRequest()],
) {
  return {
    items,
    meta: {
      page: 1,
      perPage: 10,
      totalItems: items.length,
      totalPages: 1,
      hasPrev: false,
      hasNext: false,
    },
  };
}

/** Shape expected by `useExperiences` (serviceTypeName, not title). */
export function makeExperienceServiceApiItem(
  overrides: Record<string, unknown> = {},
) {
  return {
    id: FIXTURE_SERVICE_ID,
    serviceTypeName: FIXTURE_SERVICE_TYPE_NAME,
    description: "Private gala performance package.",
    items: ["Dance set", "Host"],
    imageUrl: "https://cdn.example.com/service.jpg",
    heroMediaType: "IMAGE",
    heroPosterUrl: null,
    heroPosterUrlMobile: null,
    contactInquiryCode: "PRIVATE_GALA",
    ...overrides,
  };
}

export function makePublicAvailabilityPayload() {
  return {
    timeZone: "America/New_York",
    weekly: [
      { weekday: 1, ranges: [{ start: "10:00", end: "18:00" }] },
    ],
    closures: [],
  };
}
