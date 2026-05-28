export type VenueLayoutPromoSectionTab = "reservation" | "home-promo";

export type VenueLayoutClientSettings = {
  id?: string;
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
  promoImagePublicId?: string | null;
  createdAt?: string;
};

export function normalizeVenueLayoutSettings(data: unknown): VenueLayoutClientSettings | null {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  const settings = (o.settings ?? o) as Record<string, unknown>;
  if (typeof settings.clientEnabled !== "boolean") return null;
  return {
    id: typeof settings.id === "string" ? settings.id : undefined,
    clientEnabled: Boolean(settings.clientEnabled),
    promoTitle: typeof settings.promoTitle === "string" ? settings.promoTitle : null,
    promoDescription:
      typeof settings.promoDescription === "string" ? settings.promoDescription : null,
    promoImageUrl: typeof settings.promoImageUrl === "string" ? settings.promoImageUrl : null,
    reservationEventDate:
      typeof settings.reservationEventDate === "string" ? settings.reservationEventDate : null,
    reservationOpensAt:
      typeof settings.reservationOpensAt === "string" ? settings.reservationOpensAt : null,
    reservationClosesAt:
      typeof settings.reservationClosesAt === "string" ? settings.reservationClosesAt : null,
    reservationEventLabel:
      typeof settings.reservationEventLabel === "string" ? settings.reservationEventLabel : null,
    reservationTimezone:
      typeof settings.reservationTimezone === "string"
        ? settings.reservationTimezone
        : "America/New_York",
    updatedAt: typeof settings.updatedAt === "string" ? settings.updatedAt : null,
    promoImagePublicId:
      typeof settings.promoImagePublicId === "string" ? settings.promoImagePublicId : null,
    createdAt: typeof settings.createdAt === "string" ? settings.createdAt : undefined,
  };
}
