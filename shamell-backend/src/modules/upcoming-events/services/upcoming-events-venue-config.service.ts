import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  FixedTicketMode,
  ReservationEventScheduleMode,
  UpcomingExperienceType,
} from '@prisma/client';
import { UpcomingEventsRepository } from './upcoming-events.repository';
import {
  deriveVenueConfigFromTemplate,
  experienceFromScheduleMode,
} from '../../reservation-event-templates/utils/reservation-event-template.util';
import { ReservationEventTemplatesService } from '../../reservation-event-templates/services/reservation-event-templates.service';
import { UpsertVenueConfigDto } from '../dto/upsert-venue-config.dto';
import { resolveReservationWindow } from '../../venue-layout-settings/utils/reservation-sales-window.util';
import { syncVenueSeatReservationEventDates } from '../../venue-reservations/utils/sync-venue-seat-reservation-event-date.util';
import { normalizeFixedTicketCapacity } from '../utils/upcoming-fixed-ticket.util';
import { countBlockingFixedEventEnrollments } from '../utils/upcoming-fixed-ticket.util';
import { mapVenueConfig } from '../utils/upcoming-events-mapper.util';
import { UpcomingFixedEventPackagesRepository } from '../packages/upcoming-fixed-event-packages.repository';
import {
  FIXED_EVENT_PACKAGE_ERROR_CODES,
  packageErrorBody,
} from '../packages/util/fixed-event-package-errors';

@Injectable()
export class UpcomingEventsVenueConfigService {
  constructor(
    private readonly repository: UpcomingEventsRepository,
    private readonly reservationTemplates: ReservationEventTemplatesService,
    private readonly packagesRepository: UpcomingFixedEventPackagesRepository,
  ) {}

  private get prisma() {
    return this.repository.asPrisma();
  }

  async getAdminVenueConfig(eventId: string) {
    await this.repository.findAdminUpcomingEventOrThrow(eventId);
    const config = await this.repository.findVenueConfigWithTemplate(eventId);
    return config ? mapVenueConfig(config) : null;
  }

  async upsertAdminVenueConfig(eventId: string, dto: UpsertVenueConfigDto) {
    const event = await this.repository.findAdminUpcomingEventOrThrow(eventId);
    const existingConfig =
      await this.repository.findVenueConfigWithReservationTemplate(eventId);
    const linkingTemplate = Boolean(dto.reservationEventTemplateId);
    const unlinking = dto.reservationEventTemplateId === null;
    const dtoFixedTicketCapacity = normalizeFixedTicketCapacity(
      dto.fixedTicketCapacity,
    );

    let templateDerived: ReturnType<
      typeof deriveVenueConfigFromTemplate
    > | null = null;
    let linkedScheduleMode: ReservationEventScheduleMode | null = null;
    let reservationEventTemplateId: string | null | undefined =
      dto.reservationEventTemplateId;
    let resolvedClientEnabled: boolean | undefined = dto.clientEnabled;

    if (dto.reservationEventTemplateId) {
      const template = await this.reservationTemplates.findByIdOrThrow(
        dto.reservationEventTemplateId,
      );
      linkedScheduleMode = template.scheduleMode;
      templateDerived = deriveVenueConfigFromTemplate(template);

      if (template.scheduleMode === ReservationEventScheduleMode.FIXED_EVENT) {
        const enableSeating = dto.clientEnabled === true;
        resolvedClientEnabled = enableSeating;
        await this.repository.updateUpcomingEventExperience(
          eventId,
          enableSeating
            ? {
                experienceType: UpcomingExperienceType.VENUE_SEATING,
                classVariant: null,
              }
            : { experienceType: null, classVariant: null },
        );
      } else {
        const { experienceType, classVariant } = experienceFromScheduleMode(
          template.scheduleMode,
        );
        await this.repository.updateUpcomingEventExperience(eventId, {
          experienceType,
          classVariant,
        });
      }
    } else if (unlinking) {
      // Detaching the schedule turns this back into a normal event: clear the
      // experience type and make sure seat sales are switched off.
      linkedScheduleMode = null;
      reservationEventTemplateId = null;
      await this.repository.updateUpcomingEventExperience(eventId, {
        experienceType: null,
        classVariant: null,
      });
    } else if (existingConfig?.reservationEventTemplate) {
      linkedScheduleMode = existingConfig.reservationEventTemplate.scheduleMode;
    }

    const existingFixedTicketMode =
      existingConfig?.reservationEventTemplate?.scheduleMode ===
        ReservationEventScheduleMode.FIXED_EVENT &&
      !(existingConfig?.clientEnabled ?? false);

    const patchingFixedTicketCapacity =
      dtoFixedTicketCapacity !== undefined ||
      (dto.fixedTicketCapacity === null && dto.clientEnabled === true);

    if (
      !linkingTemplate &&
      !unlinking &&
      !patchingFixedTicketCapacity &&
      linkedScheduleMode !== ReservationEventScheduleMode.FIXED_EVENT &&
      !existingFixedTicketMode &&
      event.experienceType !== UpcomingExperienceType.VENUE_SEATING &&
      dto.clientEnabled !== true
    ) {
      throw new BadRequestException('Event is not a venue seating experience.');
    }

    const seatingEnabled =
      (resolvedClientEnabled ?? existingConfig?.clientEnabled ?? false) ===
      true;

    let resolvedFixedTicketMode: FixedTicketMode =
      existingConfig?.fixedTicketMode ?? FixedTicketMode.SINGLE;
    if (dto.fixedTicketMode !== undefined) {
      resolvedFixedTicketMode = dto.fixedTicketMode;
    }
    if (seatingEnabled) {
      if (resolvedFixedTicketMode === FixedTicketMode.PACKAGES) {
        throw new UnprocessableEntityException(
          packageErrorBody(
            FIXED_EVENT_PACKAGE_ERROR_CODES.PACKAGES_SEATING_CONFLICT,
            'Ticket packages cannot be enabled with table and seat sales.',
          ),
        );
      }
      resolvedFixedTicketMode = FixedTicketMode.SINGLE;
    }

    let resolvedFixedTicketCapacity: number | null | undefined;
    if (linkedScheduleMode === ReservationEventScheduleMode.FIXED_EVENT) {
      if (seatingEnabled) {
        resolvedFixedTicketCapacity = null;
      } else if (resolvedFixedTicketMode === FixedTicketMode.PACKAGES) {
        // Allow PACKAGES with zero packages so admin can create the event first,
        // then add packages. Sales stay blocked until active packages exist
        // (purchaseMode / checkout / public UI).
        resolvedFixedTicketCapacity = null;
        const minCents =
          await this.packagesRepository.minActivePackagePriceCents(eventId);
        if (minCents != null) {
          await this.repository.updateUpcomingEventPrice(
            eventId,
            minCents / 100,
          );
        }
      } else {
        const capacity =
          dtoFixedTicketCapacity !== undefined
            ? dtoFixedTicketCapacity
            : (normalizeFixedTicketCapacity(
                existingConfig?.fixedTicketCapacity ?? undefined,
              ) ?? null);
        if (capacity == null || capacity < 1) {
          throw new BadRequestException(
            'Ticket capacity is required for fixed events without table and seat sales.',
          );
        }
        const blocking = await countBlockingFixedEventEnrollments(
          this.prisma,
          eventId,
        );
        if (capacity < blocking) {
          throw new ConflictException(
            `Ticket capacity cannot be less than ${blocking} (already sold or reserved).`,
          );
        }
        resolvedFixedTicketCapacity = capacity;
        resolvedFixedTicketMode = FixedTicketMode.SINGLE;
      }
    } else if (
      unlinking ||
      linkingTemplate ||
      dto.reservationEventTemplateId !== undefined
    ) {
      resolvedFixedTicketCapacity = null;
    }

    const effectiveScheduleMode =
      linkedScheduleMode ??
      existingConfig?.reservationEventTemplate?.scheduleMode ??
      null;
    const classPackageEnabled = dto.classPackageEnabled;
    const classPackagePrice = dto.classPackagePrice;
    const classPackageLabel = dto.classPackageLabel;
    if (
      classPackageEnabled &&
      effectiveScheduleMode === ReservationEventScheduleMode.RECURRING_WEEKLY
    ) {
      const price = classPackagePrice != null ? Number(classPackagePrice) : NaN;
      if (!Number.isFinite(price) || price < 0.5) {
        throw new BadRequestException(
          'Full month package price must be at least $0.50 when enabled.',
        );
      }
    }

    const data = {
      clientEnabled: resolvedClientEnabled ?? (unlinking ? false : undefined),
      promoTitle: dto.promoTitle,
      promoDescription: dto.promoDescription,
      reservationEventDate:
        templateDerived?.reservationEventDate ??
        (dto.reservationEventDate
          ? new Date(dto.reservationEventDate)
          : undefined),
      reservationOpensAt:
        templateDerived?.reservationOpensAt ??
        (dto.reservationOpensAt ? new Date(dto.reservationOpensAt) : undefined),
      reservationClosesAt:
        templateDerived?.reservationClosesAt ??
        (dto.reservationClosesAt
          ? new Date(dto.reservationClosesAt)
          : undefined),
      reservationEventLabel:
        templateDerived?.reservationEventLabel ?? dto.reservationEventLabel,
      reservationTimezone:
        templateDerived?.reservationTimezone ??
        (dto.reservationTimezone?.trim() || undefined),
      floorLayoutId: dto.floorLayoutId ?? undefined,
      reservationEventTemplateId,
      fixedTicketCapacity: resolvedFixedTicketCapacity,
      fixedTicketMode: resolvedFixedTicketMode,
      classPackageEnabled,
      classPackagePrice,
      classPackageLabel,
    };

    const createData = {
      eventId,
      clientEnabled: data.clientEnabled ?? false,
      promoTitle: data.promoTitle ?? null,
      promoDescription: data.promoDescription ?? null,
      reservationEventDate: data.reservationEventDate ?? null,
      reservationOpensAt: data.reservationOpensAt ?? null,
      reservationClosesAt: data.reservationClosesAt ?? null,
      reservationEventLabel: data.reservationEventLabel ?? null,
      reservationTimezone: data.reservationTimezone ?? 'America/New_York',
      floorLayoutId: data.floorLayoutId ?? null,
      reservationEventTemplateId: data.reservationEventTemplateId ?? null,
      fixedTicketCapacity:
        data.fixedTicketCapacity !== undefined
          ? data.fixedTicketCapacity
          : null,
      fixedTicketMode: data.fixedTicketMode ?? FixedTicketMode.SINGLE,
      classPackageEnabled: data.classPackageEnabled ?? false,
      classPackagePrice: data.classPackagePrice ?? null,
      classPackageLabel: data.classPackageLabel ?? null,
    };

    const previousEventDateMs =
      existingConfig?.reservationEventDate?.getTime() ?? null;

    const saved = await this.repository.upsertVenueConfigWithTemplate(
      eventId,
      createData,
      {
        ...(data.clientEnabled !== undefined
          ? { clientEnabled: data.clientEnabled }
          : {}),
        ...(data.promoTitle !== undefined
          ? { promoTitle: data.promoTitle }
          : {}),
        ...(data.promoDescription !== undefined
          ? { promoDescription: data.promoDescription }
          : {}),
        ...(data.reservationEventDate !== undefined
          ? { reservationEventDate: data.reservationEventDate }
          : {}),
        ...(data.reservationOpensAt !== undefined
          ? { reservationOpensAt: data.reservationOpensAt }
          : {}),
        ...(data.reservationClosesAt !== undefined
          ? { reservationClosesAt: data.reservationClosesAt }
          : {}),
        ...(data.reservationEventLabel !== undefined
          ? { reservationEventLabel: data.reservationEventLabel }
          : {}),
        ...(data.reservationTimezone !== undefined
          ? { reservationTimezone: data.reservationTimezone }
          : {}),
        ...(data.floorLayoutId !== undefined
          ? { floorLayoutId: data.floorLayoutId }
          : {}),
        ...(data.reservationEventTemplateId !== undefined
          ? { reservationEventTemplateId: data.reservationEventTemplateId }
          : {}),
        ...(data.fixedTicketCapacity !== undefined
          ? { fixedTicketCapacity: data.fixedTicketCapacity }
          : {}),
        ...(data.fixedTicketMode !== undefined
          ? { fixedTicketMode: data.fixedTicketMode }
          : {}),
        ...(data.classPackageEnabled !== undefined
          ? { classPackageEnabled: data.classPackageEnabled }
          : {}),
        ...(data.classPackagePrice !== undefined
          ? { classPackagePrice: data.classPackagePrice }
          : {}),
        ...(data.classPackageLabel !== undefined
          ? { classPackageLabel: data.classPackageLabel }
          : {}),
      },
    );

    // Session generation runs via POST .../sessions/regenerate after the client
    // saves the template and venue config, so this PATCH never fails after a
    // successful link when section rows are still settling.

    const nextEventDateMs = saved.reservationEventDate?.getTime() ?? null;
    const eventDateChanged =
      saved.reservationEventDate &&
      nextEventDateMs !== null &&
      nextEventDateMs !== previousEventDateMs;
    if (saved.reservationEventDate && (linkingTemplate || eventDateChanged)) {
      await syncVenueSeatReservationEventDates(
        this.prisma,
        eventId,
        saved.reservationEventDate,
      );
    }

    return mapVenueConfig(saved);
  }

  async resolveEventIdBySlug(slug: string): Promise<string> {
    const event = await this.repository.findPublicUpcomingBySlug(slug);
    return event.id;
  }

  async getVenueConfigForEvent(eventId: string) {
    const config = await this.repository.findVenueConfigRecord(eventId);
    if (!config) return null;
    const window = resolveReservationWindow({
      reservationOpensAt: config.reservationOpensAt,
      reservationClosesAt: config.reservationClosesAt,
      reservationEventDate: config.reservationEventDate,
    });
    return {
      clientEnabled: config.clientEnabled,
      window,
      reservationEventLabel: config.reservationEventLabel,
      reservationTimezone: config.reservationTimezone,
      floorLayoutId: config.floorLayoutId,
      promoTitle: config.promoTitle,
      promoDescription: config.promoDescription,
      promoImageUrl: config.promoImageUrl,
    };
  }
}
