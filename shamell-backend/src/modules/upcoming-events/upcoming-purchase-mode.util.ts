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
  hasActiveSessions?: boolean;
  fixedTicketCapacity?: number | null;
  ticketsRemaining?: number;
}): {
  purchaseMode: UpcomingPurchaseMode;
  salesOpen: boolean;
  purchasable: boolean;
} {
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
    const window = resolveReservationWindow({
      reservationOpensAt: input.reservationOpensAt,
      reservationClosesAt: input.reservationClosesAt,
      reservationEventDate: input.reservationEventDate,
    });
    salesOpen = evaluateSalesWindow(window).open;
    return { purchaseMode, salesOpen, purchasable: salesOpen };
  }

  if (
    input.templateScheduleMode === ReservationEventScheduleMode.FIXED_EVENT &&
    !input.clientEnabled
  ) {
    purchaseMode = 'fixed_ticket';
    const window = resolveReservationWindow({
      reservationOpensAt: input.reservationOpensAt,
      reservationClosesAt: input.reservationClosesAt,
      reservationEventDate: input.reservationEventDate,
    });
    salesOpen = evaluateSalesWindow(window).open;
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
