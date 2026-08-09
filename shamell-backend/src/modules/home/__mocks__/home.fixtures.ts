export function makeOnComingSettings(
  overrides: { clientEnabled?: boolean } & Record<string, unknown> = {},
) {
  return {
    clientEnabled: true,
    promoEnabled: false,
    promoTitle: null,
    promoSubtitle: null,
    reservationEventDate: null,
    reservationEventLabel: null,
    ...overrides,
  };
}

export function makeAboveFoldPayload(overrides: Record<string, unknown> = {}) {
  return {
    about: { id: 'about-1', title: 'About' },
    headerPhotos: [{ id: 'photo-1' }],
    headerText: { headline: 'SHAMELL' },
    onComingSettings: makeOnComingSettings(),
    upcomingEvents: [{ id: 'event-1', title: 'Show' }],
    ...overrides,
  };
}
