import { BadRequestException } from '@nestjs/common';
import { ReservationEventScheduleMode } from '@prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';
import {
  deriveVenueConfigFromTemplate,
  type TemplateForDerive,
} from '../reservation-event-templates/reservation-event-template.util';
import {
  eventDateForReservations,
  resolveReservationWindow,
} from '../venue-layout-settings/reservation-sales-window.util';

export type VenueConfigDateSource = {
  reservationOpensAt?: Date | null;
  reservationClosesAt?: Date | null;
  reservationEventDate?: Date | null;
  reservationEventTemplate?:
    | (TemplateForDerive & {
        scheduleMode: ReservationEventScheduleMode;
      })
    | null;
};

const templateSelect = {
  name: true,
  timezone: true,
  scheduleMode: true,
  salesStartDate: true,
  salesEndDate: true,
  eventDate: true,
  eventStartTime: true,
  eventEndTime: true,
  recurringEffectiveFrom: true,
  recurringStartTime: true,
  recurringEndTime: true,
} as const;

/** Event night for seat reservations — never silently uses sales-open for FIXED_EVENT templates. */
export function canonicalEventNightFromVenueConfig(
  config: VenueConfigDateSource,
): Date | null {
  if (config.reservationEventDate) {
    return config.reservationEventDate;
  }

  const template = config.reservationEventTemplate;
  if (template?.scheduleMode === ReservationEventScheduleMode.FIXED_EVENT) {
    try {
      return deriveVenueConfigFromTemplate(template).reservationEventDate;
    } catch {
      return null;
    }
  }

  const window = resolveReservationWindow({
    reservationOpensAt: config.reservationOpensAt ?? null,
    reservationClosesAt: config.reservationClosesAt ?? null,
    reservationEventDate: null,
  });
  return eventDateForReservations(window);
}

export function assertCanonicalEventNightForCheckout(
  config: VenueConfigDateSource,
): Date {
  const eventDate = canonicalEventNightFromVenueConfig(config);
  if (!eventDate) {
    if (
      config.reservationEventTemplate?.scheduleMode ===
      ReservationEventScheduleMode.FIXED_EVENT
    ) {
      throw new BadRequestException('Event night date is not configured.');
    }
    throw new BadRequestException('Reservations are not configured.');
  }
  return eventDate;
}

export async function resolveCanonicalReservationEventDate(
  prisma: Pick<
    PrismaService,
    'upcomingVenueConfig' | 'venueLayoutClientSettings'
  >,
  args: {
    upcomingEventId?: string | null;
    storedEventDate?: Date | null;
  },
): Promise<Date | null> {
  if (args.upcomingEventId) {
    const config = await prisma.upcomingVenueConfig.findUnique({
      where: { eventId: args.upcomingEventId },
      include: {
        reservationEventTemplate: { select: templateSelect },
      },
    });
    if (config) {
      const canonical = canonicalEventNightFromVenueConfig(config);
      if (canonical) {
        return canonical;
      }
    }
  }

  const legacy = await prisma.venueLayoutClientSettings.findFirst({
    orderBy: { updatedAt: 'desc' },
    select: {
      reservationOpensAt: true,
      reservationClosesAt: true,
      reservationEventDate: true,
    },
  });
  if (legacy) {
    const canonical = canonicalEventNightFromVenueConfig(legacy);
    if (canonical) {
      return canonical;
    }
  }

  return args.storedEventDate ?? null;
}
