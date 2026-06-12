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

export function resolveReservationWindow(row: {
  reservationOpensAt?: Date | null;
  reservationClosesAt?: Date | null;
  reservationEventDate?: Date | null;
}): ReservationWindow {
  const opensAt = row.reservationOpensAt ?? row.reservationEventDate ?? null;
  const eventDate = row.reservationEventDate ?? row.reservationOpensAt ?? null;
  return {
    opensAt,
    closesAt: row.reservationClosesAt ?? null,
    eventDate,
  };
}

export function evaluateSalesWindow(
  window: ReservationWindow,
  now: Date = new Date(),
):
  | { open: true }
  | { open: false; reason: Exclude<SalesClosedReason, 'sold_out'> } {
  if (!window.opensAt || !window.closesAt) {
    return { open: false, reason: 'not_configured' };
  }
  if (now.getTime() < window.opensAt.getTime()) {
    return { open: false, reason: 'not_started' };
  }
  if (now.getTime() > window.closesAt.getTime()) {
    return { open: false, reason: 'ended' };
  }
  return { open: true };
}

/** Date stored on seat reservations and used for inventory (event night, not sales open). */
export function eventDateForReservations(
  window: ReservationWindow,
): Date | null {
  return window.eventDate;
}
