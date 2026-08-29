import {
  ReservationEventScheduleMode,
  UpcomingExperienceType,
} from '@prisma/client';
import {
  evaluateSalesWindow,
  resolveReservationWindow,
} from '../../venue-layout-settings/utils/reservation-sales-window.util';
import type { UpcomingPurchaseMode } from '../types/upcoming-events.types';
import type { FixedEventPackagePublicDto } from '../packages/util/fixed-event-package.mapper';

export type { UpcomingPurchaseMode } from '../types/upcoming-events.types';

export type FixedTicketPurchaseContext = {
  purchaseMode: UpcomingPurchaseMode;
  ticketMode: 'SINGLE' | 'PACKAGES';
  packages: FixedEventPackagePublicDto[];
  salesOpen: boolean;
  purchasable: boolean;
  ticketsRemaining?: number;
};

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
  ticketMode?: 'SINGLE' | 'PACKAGES';
  packages?: FixedEventPackagePublicDto[];
  packagesPriceOk?: boolean;
}): FixedTicketPurchaseContext {
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
  const ticketMode = input.ticketMode ?? 'SINGLE';
  const packages = input.packages ?? [];
  let purchaseMode: UpcomingPurchaseMode = 'none';
  let salesOpen = false;

  if (input.experienceType === UpcomingExperienceType.CLASSES) {
    purchaseMode = 'classes';
    return {
      purchaseMode,
      ticketMode: 'SINGLE',
      packages: [],
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
    return {
      purchaseMode,
      ticketMode: 'SINGLE',
      packages: [],
      salesOpen,
      purchasable: salesOpen,
    };
  }

  if (
    input.templateScheduleMode === ReservationEventScheduleMode.FIXED_EVENT &&
    !input.clientEnabled
  ) {
    purchaseMode = 'fixed_ticket';
    salesOpen = evaluateWindowOpen();

    if (ticketMode === 'PACKAGES') {
      const anyRemaining = packages.some(
        (p) => p.isActive !== false && p.ticketsRemaining > 0,
      );
      const priceOk =
        input.packagesPriceOk ??
        packages.some((p) => p.priceCents >= 50 && p.isActive !== false);
      const ticketsRemaining =
        input.ticketsRemaining ??
        packages.reduce((sum, p) => sum + p.ticketsRemaining, 0);
      return {
        purchaseMode,
        ticketMode,
        packages,
        salesOpen,
        purchasable: salesOpen && priceOk && anyRemaining,
        ticketsRemaining,
      };
    }

    const priceOk =
      input.price != null && !Number.isNaN(input.price) && input.price >= 0.5;
    const ticketsOk =
      input.ticketsRemaining == null ? true : input.ticketsRemaining > 0;
    return {
      purchaseMode,
      ticketMode: 'SINGLE',
      packages: [],
      salesOpen,
      purchasable: salesOpen && priceOk && ticketsOk,
      ticketsRemaining: input.ticketsRemaining,
    };
  }

  return {
    purchaseMode,
    ticketMode: 'SINGLE',
    packages: [],
    salesOpen: false,
    purchasable: false,
  };
}
