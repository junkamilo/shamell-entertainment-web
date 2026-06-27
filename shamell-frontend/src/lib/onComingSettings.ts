export type OnComingEventsPromo = {
  clientEnabled: boolean;
  promoTitle: string | null;
  promoDescription: string | null;
  promoImageUrl: string | null;
  reservationEventDate: string | null;
  reservationOpensAt: string | null;
  reservationClosesAt: string | null;
  reservationEventLabel: string | null;
  reservationTimezone: string;
  updatedAt: string | null;
};

export const defaultOnComingSettings: OnComingEventsPromo = {
  clientEnabled: false,
  promoTitle: null,
  promoDescription: null,
  promoImageUrl: null,
  reservationEventDate: null,
  reservationOpensAt: null,
  reservationClosesAt: null,
  reservationEventLabel: null,
  reservationTimezone: "America/New_York",
  updatedAt: null,
};

/** Normalize the public on-coming-events settings payload (server + client safe). */
export function normalizeOnComingSettings(data: unknown): OnComingEventsPromo {
  if (!data || typeof data !== "object") return defaultOnComingSettings;
  const row = data as Partial<OnComingEventsPromo>;
  return {
    clientEnabled: Boolean(row.clientEnabled),
    promoTitle: row.promoTitle ?? null,
    promoDescription: row.promoDescription ?? null,
    promoImageUrl: row.promoImageUrl ?? null,
    reservationEventDate: row.reservationEventDate ?? null,
    reservationOpensAt: row.reservationOpensAt ?? null,
    reservationClosesAt: row.reservationClosesAt ?? null,
    reservationEventLabel: row.reservationEventLabel ?? null,
    reservationTimezone: row.reservationTimezone ?? "America/New_York",
    updatedAt: row.updatedAt ?? null,
  };
}
