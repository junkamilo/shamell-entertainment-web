export type ReservationWindow = {
  opensAt: Date | null;
  closesAt: Date | null;
  /** Event night / reservation date (not the sales window start). */
  eventDate: Date | null;
};

export type SalesClosedReason =
  | 'not_configured'
  | 'not_started'
  | 'ended'
  | 'sold_out';

export type VenueLayoutSettingsRow = {
  id: string;
  clientEnabled: boolean;
  promoTitle: string | null;
  promoDescription: string | null;
  promoImageUrl: string | null;
  promoImagePublicId: string | null;
  reservationEventDate: Date | null;
  reservationOpensAt: Date | null;
  reservationClosesAt: Date | null;
  reservationEventLabel: string | null;
  reservationTimezone: string;
  createdAt: Date;
  updatedAt: Date;
};
