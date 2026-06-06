export type ReservationWindow = {
  opensAt: Date | null;
  closesAt: Date | null;
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
  return {
    opensAt: row.reservationOpensAt ?? row.reservationEventDate ?? null,
    closesAt: row.reservationClosesAt ?? null,
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

export function eventDateForReservations(
  window: ReservationWindow,
): Date | null {
  return window.opensAt;
}
