import { vi } from "vitest";
import {
  makeAboutContent,
  makeAdminBookingRow,
  makeContactRequest,
  makeHeaderTextContent,
  makeOnComingPromo,
  makePublicAvailabilityPayload,
} from "../fixtures/hooks.fixture";

export function createMockAboutContentState(
  overrides: Record<string, unknown> = {},
) {
  return {
    about: makeAboutContent(),
    isLoading: false,
    ...overrides,
  };
}

export function createMockAdminBookingsState(
  overrides: Record<string, unknown> = {},
) {
  return {
    bookings: [makeAdminBookingRow()],
    meta: {
      page: 1,
      perPage: 10,
      totalItems: 1,
      totalPages: 1,
      hasPrev: false,
      hasNext: false,
    },
    isLoading: false,
    error: null,
    reload: vi.fn(),
    createBooking: vi.fn(),
    patchBooking: vi.fn(),
    removeBooking: vi.fn(),
    createBookingQuote: vi.fn(),
    sendBalanceLink: vi.fn(),
    ...overrides,
  };
}

export function createMockAdminContactRequestsState(
  overrides: Record<string, unknown> = {},
) {
  return {
    requests: [makeContactRequest()],
    meta: {
      page: 1,
      perPage: 10,
      totalItems: 1,
      totalPages: 1,
      hasPrev: false,
      hasNext: false,
    },
    isLoading: false,
    error: null,
    reload: vi.fn(),
    setStatus: vi.fn(),
    remove: vi.fn(),
    ...overrides,
  };
}

export function createMockExperiencesState(
  overrides: Record<string, unknown> = {},
) {
  return {
    experiences: [
      {
        id: "hs111111-1111-4111-8111-111111111111",
        slug: "private-gala",
        title: "Private Gala",
        description: "Private gala performance package.",
        items: ["Dance set", "Host"],
        image: "https://cdn.example.com/service.jpg",
        heroMediaType: "IMAGE" as const,
        videoUrl: null,
        posterUrl: null,
        posterUrlMobile: null,
        contactInquiryCode: "PRIVATE_GALA",
      },
    ],
    isLoading: false,
    ...overrides,
  };
}

export function createMockHeaderTextState(
  overrides: Record<string, unknown> = {},
) {
  return {
    content: makeHeaderTextContent(),
    isLoading: false,
    ...overrides,
  };
}

export function createMockOnComingSettingsState(
  overrides: Record<string, unknown> = {},
) {
  const promo = makeOnComingPromo();
  return {
    promo,
    clientEnabled: promo.clientEnabled,
    isLoading: false,
    reload: vi.fn(),
    ...overrides,
  };
}

export function createMockPublicAvailabilityState(
  overrides: Record<string, unknown> = {},
) {
  return {
    rules: makePublicAvailabilityPayload(),
    isLoading: false,
    error: null,
    reload: vi.fn(),
    ...overrides,
  };
}

export function createMatchMediaMock(matches = false) {
  return vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}
