import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FixedTicketMode,
  ReservationEventScheduleMode,
  UpcomingExperienceType,
} from '@prisma/client';
import { buildPublicScheduleDisplay } from '../utils/upcoming-event-public-schedule.util';
import { UpcomingEventsRepository } from './upcoming-events.repository';
import { UpcomingEventsVenueConfigService } from './upcoming-events-venue-config.service';
import {
  eventDateForReservations,
  resolveReservationWindow,
} from '../../venue-layout-settings/utils/reservation-sales-window.util';
import { resolveUpcomingPurchaseContext } from '../utils/upcoming-purchase-mode.util';
import {
  fixedEventStartsAtIso,
  fixedTicketPublicStats,
  getFixedTicketInventory,
} from '../utils/upcoming-fixed-ticket.util';
import { venueTablePublicStats } from '../utils/upcoming-venue-table.util';
import {
  currentCalendarMonthIso,
  listPurchasableMonths,
  sessionCalendarMonthIso,
} from '../utils/class-month-package.util';
import {
  mapPublicHero,
  mapPublicSummary,
  mapSessionPublic,
} from '../utils/upcoming-events-mapper.util';
import { UpcomingFixedEventPackagesRepository } from '../packages/upcoming-fixed-event-packages.repository';
import {
  mapActivityPublic,
  mapPackagePublic,
} from '../packages/util/fixed-event-package.mapper';
import type { FixedEventPackagePublicDto } from '../packages/util/fixed-event-package.mapper';

@Injectable()
export class UpcomingEventsPublicService {
  constructor(
    private readonly repository: UpcomingEventsRepository,
    private readonly venueConfigService: UpcomingEventsVenueConfigService,
    private readonly packagesRepository: UpcomingFixedEventPackagesRepository,
  ) {}

  private get prisma() {
    return this.repository.asPrisma();
  }

  async getPublicBySlug(slug: string) {
    const event = await this.repository.findPublicUpcomingBySlug(slug);
    const base = mapPublicSummary(event);
    const hero = mapPublicHero(event);
    const now = new Date();

    const venueConfigRow = await this.repository.findVenueConfigWithTemplate(
      event.id,
    );

    const schedule = venueConfigRow?.reservationEventTemplate
      ? buildPublicScheduleDisplay(venueConfigRow.reservationEventTemplate)
      : null;

    let hasActiveSessions = false;
    let sessions: (ReturnType<typeof mapSessionPublic> & {
      seatsRemaining: number;
    })[] = [];
    let ticketsRemaining: number | undefined;
    let fixedTicketCapacity: number | null | undefined;
    let ticketsSold: number | undefined;
    let tablesRemaining: number | undefined;
    let tableCapacity: number | undefined;
    let tablesSold: number | undefined;
    let eventStartsAt: string | null | undefined;

    if (event.experienceType === UpcomingExperienceType.CLASSES) {
      const rows = await this.repository.findActiveClassSessionsForEvent(
        event.id,
        now,
      );
      sessions = await Promise.all(
        rows.map(async (s) => ({
          ...mapSessionPublic(s),
          seatsRemaining: await this.repository.seatsRemaining(
            s.id,
            s.capacity,
          ),
        })),
      );
      hasActiveSessions = sessions.length > 0;
    }

    let ticketMode: 'SINGLE' | 'PACKAGES' = 'SINGLE';
    let packagesPublic: FixedEventPackagePublicDto[] = [];
    let activitiesPublic: ReturnType<typeof mapActivityPublic>[] = [];

    const templateScheduleMode =
      venueConfigRow?.reservationEventTemplate?.scheduleMode ?? null;
    const clientEnabled = venueConfigRow?.clientEnabled ?? false;
    const fixedTicketMode =
      venueConfigRow?.fixedTicketMode ?? FixedTicketMode.SINGLE;

    if (
      templateScheduleMode === ReservationEventScheduleMode.FIXED_EVENT &&
      !clientEnabled
    ) {
      eventStartsAt = fixedEventStartsAtIso(
        venueConfigRow?.reservationEventDate,
      );

      if (fixedTicketMode === FixedTicketMode.PACKAGES) {
        ticketMode = 'PACKAGES';
        const inventory = await getFixedTicketInventory(this.prisma, event.id, {
          fixedTicketMode: FixedTicketMode.PACKAGES,
          fixedTicketCapacity: null,
        });
        ticketsRemaining = inventory.total.remaining;
        ticketsSold = inventory.total.sold;

        const [activities, packages] = await Promise.all([
          this.packagesRepository.listActiveActivitiesByEvent(event.id),
          this.packagesRepository.listPackagesByEvent(event.id, true),
        ]);
        activitiesPublic = activities.map(mapActivityPublic);
        packagesPublic = packages.map((pkg) =>
          mapPackagePublic(
            pkg,
            inventory.byPackage.get(pkg.id) ?? {
              blocking: 0,
              remaining: pkg.capacity,
              sold: 0,
              capacity: pkg.capacity,
            },
          ),
        );
      } else if (
        venueConfigRow?.fixedTicketCapacity != null &&
        venueConfigRow.fixedTicketCapacity >= 1
      ) {
        fixedTicketCapacity = venueConfigRow.fixedTicketCapacity;
        const stats = await fixedTicketPublicStats(
          this.prisma,
          event.id,
          venueConfigRow.fixedTicketCapacity,
        );
        ticketsRemaining = stats.ticketsRemaining;
        ticketsSold = stats.ticketsSold;
      }
    }

    if (
      event.experienceType === UpcomingExperienceType.VENUE_SEATING &&
      clientEnabled &&
      venueConfigRow
    ) {
      eventStartsAt = fixedEventStartsAtIso(
        venueConfigRow.reservationEventDate ??
          venueConfigRow.reservationOpensAt,
      );
      const window = resolveReservationWindow({
        reservationOpensAt: venueConfigRow.reservationOpensAt ?? null,
        reservationClosesAt: venueConfigRow.reservationClosesAt ?? null,
        reservationEventDate: venueConfigRow.reservationEventDate ?? null,
      });
      const eventDate = eventDateForReservations(window);
      if (eventDate) {
        const stats = await venueTablePublicStats(this.prisma, {
          eventId: event.id,
          eventDate,
          floorLayoutId: venueConfigRow.floorLayoutId ?? null,
        });
        if (stats.tableCapacity >= 1) {
          tableCapacity = stats.tableCapacity;
          tablesRemaining = stats.tablesRemaining;
          tablesSold = stats.tablesSold;
        }
      }
    }

    const purchaseCtx = resolveUpcomingPurchaseContext({
      experienceType: event.experienceType,
      price: event.price != null ? Number(event.price) : null,
      clientEnabled,
      templateScheduleMode,
      reservationOpensAt: venueConfigRow?.reservationOpensAt ?? null,
      reservationClosesAt: venueConfigRow?.reservationClosesAt ?? null,
      reservationEventDate: venueConfigRow?.reservationEventDate ?? null,
      reservationTimezone: venueConfigRow?.reservationTimezone ?? null,
      hasActiveSessions,
      fixedTicketCapacity,
      ticketsRemaining,
      ticketMode,
      packages: packagesPublic,
    });

    const scheduleTimezone =
      schedule?.mode === 'RECURRING_WEEKLY'
        ? schedule.timezone
        : 'America/New_York';
    const currentMonthIso = currentCalendarMonthIso(scheduleTimezone, now);
    const monthPackage =
      event.experienceType === UpcomingExperienceType.CLASSES && venueConfigRow
        ? (() => {
            const enabled = venueConfigRow.classPackageEnabled ?? false;
            const price =
              venueConfigRow.classPackagePrice != null
                ? Number(venueConfigRow.classPackagePrice)
                : null;
            const mappedSessions = sessions.map((s) => ({
              startsAt: new Date(s.startsAt),
              endsAt: new Date(s.endsAt),
              timezone: s.timezone || scheduleTimezone,
            }));
            const currentMonthSessionCount = mappedSessions.filter(
              (s) =>
                s.endsAt > now &&
                sessionCalendarMonthIso(s.startsAt, s.timezone) ===
                  currentMonthIso,
            ).length;
            return {
              enabled,
              price,
              label: venueConfigRow.classPackageLabel ?? null,
              currentMonthIso,
              currentMonthSessionCount,
              purchasable:
                enabled &&
                price != null &&
                Number.isFinite(price) &&
                price >= 0.5 &&
                currentMonthSessionCount > 0,
              purchasableMonths: listPurchasableMonths(mappedSessions, now),
            };
          })()
        : undefined;

    return {
      ...base,
      ...hero,
      schedule,
      hasActiveSessions,
      salesOpen: purchaseCtx.salesOpen,
      purchasable: purchaseCtx.purchasable,
      purchaseMode: purchaseCtx.purchaseMode,
      ticketMode: purchaseCtx.ticketMode,
      sessions,
      ...(monthPackage ? { monthPackage } : {}),
      ...(ticketsRemaining !== undefined ? { ticketsRemaining } : {}),
      ...(fixedTicketCapacity != null ? { fixedTicketCapacity } : {}),
      ...(ticketsSold !== undefined ? { ticketsSold } : {}),
      ...(packagesPublic.length > 0 ? { packages: packagesPublic } : {}),
      ...(activitiesPublic.length > 0 ? { activities: activitiesPublic } : {}),
      ...(eventStartsAt != null ? { eventStartsAt } : {}),
      ...(tableCapacity !== undefined ? { tableCapacity } : {}),
      ...(tablesRemaining !== undefined ? { tablesRemaining } : {}),
      ...(tablesSold !== undefined ? { tablesSold } : {}),
    };
  }

  async listPublicSessions(slug: string) {
    const event = await this.repository.findPublicUpcomingBySlug(slug);
    if (event.experienceType !== UpcomingExperienceType.CLASSES) {
      throw new BadRequestException(
        'This event does not offer class sessions.',
      );
    }
    const now = new Date();
    const sessions = await this.repository.findActiveClassSessionsForEvent(
      event.id,
      now,
    );
    const seatCounts = await this.repository.batchSeatsRemaining(
      sessions.map((s) => ({ id: s.id, capacity: s.capacity })),
    );
    const withCounts = sessions.map((s) => ({
      ...mapSessionPublic(s),
      seatsRemaining: Math.max(0, s.capacity - (seatCounts.get(s.id) ?? 0)),
    }));
    return { event: mapPublicSummary(event), sessions: withCounts };
  }

  async getPublicClassOptions(slug: string) {
    const detail = await this.getPublicBySlug(slug);
    if (detail.purchaseMode !== 'classes') {
      throw new BadRequestException(
        'This event does not offer class sessions.',
      );
    }
    const schedule = detail.schedule;
    const days = schedule?.mode === 'RECURRING_WEEKLY' ? schedule.days : [];
    const sessionsByDay = new Map<number, typeof detail.sessions>();
    for (const s of detail.sessions) {
      if (s.weekday == null) continue;
      const list = sessionsByDay.get(s.weekday) ?? [];
      list.push(s);
      sessionsByDay.set(s.weekday, list);
    }
    return {
      eventSlug: slug,
      timezone:
        schedule?.mode === 'RECURRING_WEEKLY'
          ? schedule.timezone
          : 'America/New_York',
      days: days.map((d) => ({
        ...d,
        sessions: (sessionsByDay.get(d.weekday) ?? []).sort((a, b) =>
          a.startsAt.localeCompare(b.startsAt),
        ),
      })),
    };
  }

  async getPublicVenueBundle(slug: string) {
    const event = await this.repository.findPublicUpcomingBySlug(slug);
    if (event.experienceType !== UpcomingExperienceType.VENUE_SEATING) {
      throw new BadRequestException(
        'This event does not offer seat reservations.',
      );
    }
    const config = await this.venueConfigService.getVenueConfigForEvent(
      event.id,
    );
    if (!config?.clientEnabled) {
      throw new NotFoundException(
        'Seat reservations are not published for this event.',
      );
    }
    return {
      event: mapPublicSummary(event),
      config: {
        reservationEventLabel: config.reservationEventLabel,
        reservationTimezone: config.reservationTimezone,
        reservationEventDate: config.window.eventDate?.toISOString() ?? null,
        reservationOpensAt: config.window.opensAt?.toISOString() ?? null,
        reservationClosesAt: config.window.closesAt?.toISOString() ?? null,
        floorLayoutId: config.floorLayoutId,
      },
    };
  }
}
