import {
  ReservationEventScheduleMode,
  UpcomingExperienceType,
} from '@prisma/client';
import {
  evaluateSalesWindow,
  resolveReservationWindow,
} from '../venue-layout-settings/reservation-sales-window.util';

export type UpcomingPurchaseMode =
  | 'none'
  | 'classes'
  | 'venue_seating'
  | 'fixed_ticket';

export function resolveUpcomingPurchaseContext(input: {
  experienceType: UpcomingExperienceType | null;
  price: number | null;
  clientEnabled: boolean;
  templateScheduleMode: ReservationEventScheduleMode | null;
  reservationOpensAt: Date | null;
  reservationClosesAt: Date | null;
  reservationEventDate: Date | null;
  reservationTimezone?: string | null;
  hasActiveSessions?: boolean;
  fixedTicketCapacity?: number | null;
  ticketsRemaining?: number;
}): {
  purchaseMode: UpcomingPurchaseMode;
  salesOpen: boolean;
  purchasable: boolean;
} {
  const dateOnlyWindowOpen = (
    opensAt: Date | null,
    closesAt: Date | null,
    timezone?: string | null,
  ): boolean | null => {
    if (!opensAt || !closesAt) return null;
    const tz = timezone?.trim() || 'America/New_York';
    try {
      const fmt = new Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      const todayIso = fmt.format(new Date());
      const startIso = fmt.format(opensAt);
      const endIso = fmt.format(closesAt);
      return todayIso >= startIso && todayIso <= endIso;
    } catch {
      return null;
    }
  };

  const evaluateWindowOpen = (): boolean => {
    const window = resolveReservationWindow({
      reservationOpensAt: input.reservationOpensAt,
      reservationClosesAt: input.reservationClosesAt,
      reservationEventDate: input.reservationEventDate,
    });
    const status = evaluateSalesWindow(window);
    if (status.open) return true;
    if (status.reason === 'not_started' || status.reason === 'ended') {
      const byDateOnly = dateOnlyWindowOpen(
        input.reservationOpensAt,
        input.reservationClosesAt,
        input.reservationTimezone,
      );
      if (byDateOnly != null) return byDateOnly;
    }
    return false;
  };

  const hasActiveSessions = input.hasActiveSessions ?? false;
  let purchaseMode: UpcomingPurchaseMode = 'none';
  let salesOpen = false;

  if (input.experienceType === UpcomingExperienceType.CLASSES) {
    purchaseMode = 'classes';
    return {
      purchaseMode,
      salesOpen: false,
      purchasable: hasActiveSessions,
    };
  }

  if (
    input.experienceType === UpcomingExperienceType.VENUE_SEATING &&
    input.clientEnabled
  ) {
    purchaseMode = 'venue_seating';
    salesOpen = evaluateWindowOpen();
    return { purchaseMode, salesOpen, purchasable: salesOpen };
  }

  if (
    input.templateScheduleMode === ReservationEventScheduleMode.FIXED_EVENT &&
    !input.clientEnabled
  ) {
    purchaseMode = 'fixed_ticket';
    salesOpen = evaluateWindowOpen();
    const priceOk =
      input.price != null && !Number.isNaN(input.price) && input.price >= 0.5;
    const ticketsOk =
      input.ticketsRemaining == null ? true : input.ticketsRemaining > 0;
    return {
      purchaseMode,
      salesOpen,
      purchasable: salesOpen && priceOk && ticketsOk,
    };
  }

  return { purchaseMode, salesOpen: false, purchasable: false };
}
