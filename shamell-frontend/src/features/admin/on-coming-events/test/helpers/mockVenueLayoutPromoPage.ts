import { vi } from "vitest";
import { makeVenueLayoutSettings } from "../fixtures/onComingEvents.fixture";

export function createMockVenueLayoutPromoPageState(
  overrides: Record<string, unknown> = {},
) {
  return {
    settings: makeVenueLayoutSettings(),
    setSettings: vi.fn(),
    isLoading: false,
    isModalOpen: false,
    isSubmitting: false,
    isTogglingPublish: false,
    promoTitle: "On Coming Events",
    setPromoTitle: vi.fn(),
    promoDescription: "Reserve seats for our next night.",
    setPromoDescription: vi.fn(),
    openModal: vi.fn(),
    closeModal: vi.fn(),
    toggleClientEnabled: vi.fn(async () => undefined),
    onSubmit: vi.fn(async () => undefined),
    ...overrides,
  };
}
