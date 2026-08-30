import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EventPublicSection,
  EventTypeCatalogChannel,
  ReservationEventScheduleMode,
  UpcomingExperienceType,
} from '@prisma/client';
import { ensureUniqueEventSlug } from '../../../common/event-slug.util';
import { GalleryService } from '../../gallery/services/gallery.service';
import { resolveUpcomingPurchaseContext } from '../../upcoming-events/utils/upcoming-purchase-mode.util';
import { fixedEventStartsAtIso } from '../../upcoming-events/utils/upcoming-fixed-ticket.util';
import { CreateEventDto } from '../dto/create-event.dto';
import { CreateEventTypeDto } from '../dto/create-event-type.dto';
import { CreateOccasionTypeDto } from '../dto/create-occasion-type.dto';
import { EventTypeOccasionAssignmentDto } from '../dto/event-type-occasion-assignment.dto';
import { ListEventsQueryDto } from '../dto/list-events-query.dto';
import { UpdateEventDto } from '../dto/update-event.dto';
import { UpdateEventTypeDto } from '../dto/update-event-type.dto';
import { UpdateOccasionTypeDto } from '../dto/update-occasion-type.dto';
import type { MappedEvent } from '../types/events.types';
import { catalogChannelForPublicSection } from '../utils/booking-inquiry-catalog.util';
import {
  effectiveGalleryMediaType,
  mapContactLine,
  mapContactLineFromEventType,
  mapEvent,
  mapEventType,
  mapEventTypeAdmin,
} from '../utils/events-mapper.util';
import { EventsRepository } from './events.repository';

@Injectable()
export class EventsService {
  constructor(
    private readonly repository: EventsRepository,
    private readonly galleryService: GalleryService,
  ) {}

  private async resolveEventTypeIdForWrite(dto: {
    eventTypeId?: string;
    eventTypeName?: string;
    catalogChannel: EventTypeCatalogChannel;
  }): Promise<string> {
    if (dto.eventTypeId) {
      const eventType = await this.repository.findEventTypeByIdForWrite(
        dto.eventTypeId,
      );
      if (!eventType) throw new NotFoundException('Event type not found.');
      if (!eventType.isActive)
        throw new BadRequestException('Event type is inactive.');
      if (eventType.catalogChannel !== dto.catalogChannel) {
        throw new BadRequestException(
          'Event type belongs to a different catalog channel.',
        );
      }
      return eventType.id;
    }

    const name = dto.eventTypeName?.trim() ?? '';
    if (!name) {
      throw new BadRequestException(
        'Provide eventTypeId or eventTypeName for this event.',
      );
    }

    const existingType = await this.repository.findEventTypeByNameInChannel(
      name,
      dto.catalogChannel,
    );
    if (existingType) {
      const taken = await this.repository.findEventByEventTypeId(
        existingType.id,
      );
      if (taken) {
        throw new ConflictException(
          'An event with this name already exists. Choose a different name.',
        );
      }
      if (!existingType.isActive) {
        await this.repository.activateEventType(existingType.id);
      }
      return existingType.id;
    }

    const createdType = await this.repository.createEventTypeInline(
      name,
      dto.catalogChannel,
    );
    return createdType.id;
  }

  async createEvent(dto: CreateEventDto) {
    const publicSection = dto.publicSection ?? EventPublicSection.GENERAL;
    const catalogChannel = catalogChannelForPublicSection(publicSection);
    const eventTypeId = await this.resolveEventTypeIdForWrite({
      ...dto,
      catalogChannel,
    });
    const isUpcoming = publicSection === EventPublicSection.UPCOMING_EVENTS;
    const eventType = await this.repository.findEventTypeName(eventTypeId);
    const slug = isUpcoming
      ? dto.slug?.trim() ||
        (await ensureUniqueEventSlug(
          this.repository.asPrisma(),
          dto.eventTypeName?.trim() || eventType?.name || 'event',
        ))
      : null;
    const experienceType = isUpcoming ? (dto.experienceType ?? null) : null;

    const createData = {
      eventTypeId,
      description: dto.description,
      items: dto.items,
      showOnHome: dto.showOnHome ?? true,
      publicSection,
      slug,
      experienceType,
      classVariant: isUpcoming ? (dto.classVariant ?? null) : null,
      ...(dto.price !== undefined && dto.price !== null
        ? { price: dto.price }
        : {}),
    };

    try {
      const created = isUpcoming
        ? await this.repository.createUpcomingEventWithVenueConfig(createData)
        : await this.repository.createEvent(createData);

      return {
        message: 'Event created successfully.',
        event: mapEvent(created),
      };
    } catch (error: unknown) {
      const prismaError = error as { code?: string };
      if (prismaError?.code === 'P2002') {
        throw new ConflictException('An event for this type already exists.');
      }
      throw error;
    }
  }

  /** Home catalog: active events marked visible on home. */
  async getPublicEvents(query?: ListEventsQueryDto) {
    if (query?.publicSection === EventPublicSection.UPCOMING_EVENTS) {
      return this.getPublicUpcomingHubEvents();
    }

    const publicSection = query?.publicSection ?? EventPublicSection.GENERAL;
    const events =
      await this.repository.findPublicEventsForSection(publicSection);
    return events.map((item) => mapEvent(item));
  }

  /**
   * Lightweight upcoming hub cards (Home + /on-coming-events list).
   * Hero-only media; purchase context without per-event floor/reservation N+1.
   */
  async getPublicUpcomingHubEvents() {
    const events = await this.repository.findPublicUpcomingHubEvents();
    const mapped = events.map((item) => mapEvent(item));
    return this.enrichUpcomingHubEventsLight(mapped);
  }

  /** Contact / booking inquiry wizard: general catalog only (excludes ON COMING upcoming hub). */
  async getContactLines() {
    const events = await this.repository.findContactLineEvents();

    const fromEvents = events
      .filter((e) => e.eventType.isActive)
      .map((item) => mapContactLine(item));

    const coveredTypeIds = fromEvents.map((l) => l.eventTypeId);
    const orphanTypes =
      await this.repository.findOrphanBookingEventTypes(coveredTypeIds);

    const fromTypesOnly = orphanTypes.map((t) =>
      mapContactLineFromEventType(t),
    );

    return [...fromEvents, ...fromTypesOnly];
  }

  /** Public snippet for contact deep-link (general catalog event + active type only). */
  async getPublicCatalogById(id: string) {
    const event = await this.repository.findPublicCatalogEventById(id);
    if (!event || !event.eventType.isActive) {
      throw new NotFoundException('Event not found.');
    }
    const preview = event.description.replace(/\s+/g, ' ').trim().slice(0, 280);
    const hero = event.galleryPhotos[0];
    return {
      kind: 'event' as const,
      id: event.id,
      title: event.eventType.name.trim(),
      description: event.description,
      descriptionPreview: preview || undefined,
      items: event.items,
      imageUrl: hero?.imageUrl ?? null,
      heroMediaType: hero
        ? effectiveGalleryMediaType(hero.imageUrl, hero.mediaType)
        : null,
      contactInquiryCode: event.eventType.contactInquiryCode ?? null,
    };
  }

  async getAdminEvents(query?: ListEventsQueryDto) {
    const publicSection = query?.publicSection ?? EventPublicSection.GENERAL;
    const events = await this.repository.findAdminEvents(publicSection);
    return events.map((item) => {
      const { _count, ...rest } = item;
      return {
        ...mapEvent(rest),
        bookingCount: _count.bookings,
        galleryPhotoCount: _count.galleryPhotos,
      };
    });
  }

  async getAdminEventById(id: string) {
    const event = await this.repository.findAdminEventById(id);
    if (!event) throw new NotFoundException('Event not found.');
    return mapEvent(event);
  }

  async updateEvent(id: string, dto: UpdateEventDto) {
    const existing = await this.repository.findEventForUpdate(id);
    if (!existing) throw new NotFoundException('Event not found.');

    if (
      dto.publicSection !== undefined &&
      dto.publicSection !== existing.publicSection
    ) {
      throw new BadRequestException(
        'publicSection cannot be changed after create; create the event in the correct admin surface.',
      );
    }

    if (dto.isActive === false) {
      await this.ensureEventCanBeDisabled(id);
    }

    const catalogChannel = catalogChannelForPublicSection(
      existing.publicSection,
    );

    let nextEventTypeId: string | undefined;
    if (dto.eventTypeId) {
      nextEventTypeId = await this.resolveEventTypeIdForWrite({
        eventTypeId: dto.eventTypeId,
        catalogChannel,
      });
    } else if (dto.eventTypeName?.trim()) {
      const name = dto.eventTypeName.trim();
      const duplicate = await this.repository.findDuplicateEventTypeName(
        name,
        catalogChannel,
        existing.eventTypeId,
      );
      if (duplicate) {
        const taken = await this.repository.findEventByEventTypeId(
          duplicate.id,
        );
        if (taken) {
          throw new ConflictException(
            'An event with this name already exists. Choose a different name.',
          );
        }
      }
      await this.repository.renameEventType(existing.eventTypeId, name);
    }

    try {
      const updated = await this.repository.updateEvent(id, {
        ...(nextEventTypeId ? { eventTypeId: nextEventTypeId } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto.items !== undefined ? { items: dto.items } : {}),
        ...(dto.price !== undefined ? { price: dto.price } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.showOnHome !== undefined ? { showOnHome: dto.showOnHome } : {}),
        ...(dto.slug !== undefined ? { slug: dto.slug.trim() || null } : {}),
        ...(dto.experienceType !== undefined
          ? { experienceType: dto.experienceType }
          : {}),
        ...(dto.classVariant !== undefined
          ? { classVariant: dto.classVariant }
          : {}),
      });

      if (
        updated.publicSection === EventPublicSection.UPCOMING_EVENTS &&
        updated.experienceType === UpcomingExperienceType.VENUE_SEATING
      ) {
        await this.repository.upsertUpcomingVenueConfig(updated.id);
      }

      return {
        message: 'Event updated successfully.',
        event: mapEvent(updated),
      };
    } catch (error: unknown) {
      const prismaError = error as { code?: string };
      if (prismaError?.code === 'P2002' && dto.eventTypeId) {
        throw new ConflictException('An event for this type already exists.');
      }
      throw error;
    }
  }

  async deleteEvent(id: string) {
    const existing = await this.repository.findEventForDelete(id);
    if (!existing) throw new NotFoundException('Event not found.');

    await this.ensureEventCanBeDeleted(id);

    const venueConfig = await this.repository.findVenueConfigTemplateId(id);
    const linkedTemplateId = venueConfig?.reservationEventTemplateId ?? null;

    const catalogPhotos = await this.repository.findGalleryPhotoIdsForEvent(id);
    for (const photo of catalogPhotos) {
      await this.galleryService.deletePhoto(photo.id);
    }

    await this.repository.deleteEvent(id);

    if (linkedTemplateId) {
      await this.repository.deleteReservationTemplateIfUnlinked(
        linkedTemplateId,
      );
    }

    if (existing.publicSection === EventPublicSection.UPCOMING_EVENTS) {
      await this.repository.deleteOrphanInlineEventType(existing.eventTypeId);
    }

    return {
      message: 'Event deleted successfully.',
    };
  }

  async createEventType(dto: CreateEventTypeDto) {
    try {
      const created = await this.repository.createBookingEventType(
        dto.name,
        dto.contactInquiryCode ?? null,
      );
      if (dto.occasions !== undefined) {
        await this.syncOccasionAssignments(created.id, dto.occasions);
      }
      const full = await this.repository.findEventTypeAdminById(created.id);
      return {
        message: 'Event type created successfully.',
        eventType: mapEventTypeAdmin(full),
      };
    } catch (error: unknown) {
      const prismaError = error as { code?: string };
      if (prismaError?.code === 'P2002') {
        throw new ConflictException(`Event type "${dto.name}" already exists.`);
      }
      throw error;
    }
  }

  async getPublicEventTypes() {
    const types = await this.repository.findPublicBookingEventTypes();
    return types.map((item) => mapEventType(item));
  }

  async getAdminEventTypes(query?: { publicSection?: EventPublicSection }) {
    const section = query?.publicSection ?? EventPublicSection.GENERAL;
    const types = await this.repository.findAdminEventTypes(section);
    return types.map((item) => {
      const { _count, ...rest } = item;
      return {
        ...mapEventTypeAdmin(rest),
        eventCount: _count.events,
        bookingCount: _count.bookings,
        galleryPhotoCount: _count.galleryPhotos,
      };
    });
  }

  async updateEventType(id: string, dto: UpdateEventTypeDto) {
    const existing = await this.repository.findEventTypeId(id);
    if (!existing) throw new NotFoundException('Event type not found.');

    if (dto.isActive === false) {
      await this.ensureEventTypeHasNoBlockingUsage(id);
    }

    try {
      const dataPayload = {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.contactInquiryCode !== undefined
          ? { contactInquiryCode: dto.contactInquiryCode }
          : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      };
      if (Object.keys(dataPayload).length > 0) {
        await this.repository.updateEventType(id, dataPayload);
      }

      if (dto.occasions !== undefined) {
        await this.syncOccasionAssignments(id, dto.occasions);
      }

      const reloaded = await this.repository.findEventTypeAdminById(id);

      return {
        message: 'Event type updated successfully.',
        eventType: mapEventTypeAdmin(reloaded),
      };
    } catch (error: unknown) {
      const prismaError = error as { code?: string };
      if (prismaError?.code === 'P2002' && dto.name) {
        throw new ConflictException(`Event type "${dto.name}" already exists.`);
      }
      throw error;
    }
  }

  async deleteEventType(id: string) {
    const existing = await this.repository.findEventTypeId(id);
    if (!existing) throw new NotFoundException('Event type not found.');

    await this.ensureEventTypeHasNoBlockingUsage(id);

    await this.repository.deleteEventType(id);

    return {
      message: 'Event type deleted successfully.',
    };
  }

  async getAdminOccasionTypes() {
    const rows = await this.repository.findAdminOccasionTypes();
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      isActive: r.isActive,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      bookingCount: r._count.bookings,
      eventTypeLinkCount: r._count.eventLinks,
    }));
  }

  async createOccasionType(dto: CreateOccasionTypeDto) {
    try {
      const created = await this.repository.createOccasionType(
        dto.name,
        dto.isActive ?? true,
      );
      return {
        message: 'Occasion type created successfully.',
        occasionType: {
          id: created.id,
          name: created.name,
          isActive: created.isActive,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
        },
      };
    } catch (error: unknown) {
      const prismaError = error as { code?: string };
      if (prismaError?.code === 'P2002') {
        throw new ConflictException(`Occasion "${dto.name}" already exists.`);
      }
      throw error;
    }
  }

  async updateOccasionType(id: string, dto: UpdateOccasionTypeDto) {
    const existing = await this.repository.findOccasionTypeId(id);
    if (!existing) throw new NotFoundException('Occasion type not found.');

    if (dto.isActive === false) {
      await this.ensureOccasionTypeCanBeDisabled(id);
    }

    try {
      const updated = await this.repository.updateOccasionType(id, {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      });
      return {
        message: 'Occasion type updated successfully.',
        occasionType: {
          id: updated.id,
          name: updated.name,
          isActive: updated.isActive,
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
        },
      };
    } catch (error: unknown) {
      const prismaError = error as { code?: string };
      if (prismaError?.code === 'P2002' && dto.name) {
        throw new ConflictException(`Occasion "${dto.name}" already exists.`);
      }
      throw error;
    }
  }

  async deleteOccasionType(id: string) {
    const existing = await this.repository.findOccasionTypeId(id);
    if (!existing) throw new NotFoundException('Occasion type not found.');

    await this.ensureOccasionTypeCanBeDeleted(id);

    await this.repository.deleteOccasionType(id);

    return {
      message: 'Occasion type deleted successfully.',
    };
  }

  private async ensureOccasionTypeCanBeDisabled(occasionTypeId: string) {
    const n = await this.repository.countBookingsForOccasion(occasionTypeId);
    if (n > 0) {
      throw new ConflictException(
        'Cannot disable this occasion type because it is associated with existing bookings.',
      );
    }
  }

  private async ensureOccasionTypeCanBeDeleted(occasionTypeId: string) {
    const n = await this.repository.countBookingsForOccasion(occasionTypeId);
    if (n > 0) {
      throw new ConflictException(
        'Cannot delete this occasion type because it is associated with existing bookings.',
      );
    }
  }

  private async syncOccasionAssignments(
    eventTypeId: string,
    assignments: EventTypeOccasionAssignmentDto[],
  ) {
    const seen = new Set<string>();
    for (const row of assignments) {
      if (seen.has(row.occasionTypeId)) {
        throw new BadRequestException(
          'Duplicate occasion type in assignment list.',
        );
      }
      seen.add(row.occasionTypeId);
    }
    const ids = [...seen];
    if (ids.length === 0) {
      await this.repository.clearOccasionAssignments(eventTypeId);
      return;
    }
    const occasions = await this.repository.findActiveOccasionIds(ids);
    if (occasions.length !== ids.length) {
      throw new BadRequestException(
        'One or more occasion types are invalid or inactive.',
      );
    }
    await this.repository.replaceOccasionAssignments(eventTypeId, assignments);
  }

  private async ensureEventCanBeDisabled(eventId: string) {
    const n = await this.repository.countBookingsForEvent(eventId);
    if (n > 0) {
      throw new ConflictException(
        'Cannot disable this event because it has associated bookings.',
      );
    }
  }

  private async ensureEventCanBeDeleted(eventId: string) {
    const { bookingCount, seatReservationCount, classEnrollmentCount } =
      await this.repository.getEventDeleteGuardCounts(eventId);
    if (bookingCount > 0) {
      throw new ConflictException(
        'Cannot delete this event because it has associated bookings.',
      );
    }
    if (seatReservationCount > 0) {
      throw new ConflictException(
        'Cannot delete this event because it has active seat reservations.',
      );
    }
    if (classEnrollmentCount > 0) {
      throw new ConflictException(
        'Cannot delete this event because it has active class enrollments.',
      );
    }
  }

  private async ensureEventTypeHasNoBlockingUsage(eventTypeId: string) {
    const { eventCount, bookingCount, galleryCount } =
      await this.repository.getEventTypeUsageCounts(eventTypeId);
    if (eventCount > 0) {
      throw new ConflictException(
        'Cannot perform this action because this event type is associated with existing catalog events.',
      );
    }
    if (bookingCount > 0) {
      throw new ConflictException(
        'Cannot perform this action because this event type is associated with existing bookings.',
      );
    }
    if (galleryCount > 0) {
      throw new ConflictException(
        'Cannot perform this action because gallery photos are still linked to this event type.',
      );
    }
  }

  /**
   * Hub/home enrichment: purchase mode + start time only.
   * Inventory (tables/tickets) is left to detail/checkout pages.
   */
  private async enrichUpcomingHubEventsLight(events: MappedEvent[]) {
    if (events.length === 0) return [];

    const now = new Date();
    const eventIds = events.map((event) => event.id);
    const classEventIds = events
      .filter(
        (event) => event.experienceType === UpcomingExperienceType.CLASSES,
      )
      .map((event) => event.id);

    const [activeSessionCounts, configs] = await Promise.all([
      this.repository.groupActiveClassSessionsByEvent(classEventIds, now),
      this.repository.findHubVenueConfigs(eventIds),
    ]);

    const configByEventId = new Map(
      configs.map((config) => [config.eventId, config] as const),
    );
    const activeSessionsByEventId = new Map<string, number>(
      activeSessionCounts.map(
        (row) => [row.eventId, row._count._all] as [string, number],
      ),
    );

    return events.map((event) => {
      const hasActiveSessions =
        (activeSessionsByEventId.get(event.id) ?? 0) > 0;
      const config = configByEventId.get(event.id);
      const templateScheduleMode =
        config?.reservationEventTemplate?.scheduleMode ?? null;
      const clientEnabled = config?.clientEnabled ?? false;

      let eventStartsAt: string | null | undefined;
      let fixedTicketCapacity: number | null | undefined;

      if (
        templateScheduleMode === ReservationEventScheduleMode.FIXED_EVENT &&
        !clientEnabled &&
        config?.fixedTicketCapacity != null &&
        config.fixedTicketCapacity >= 1
      ) {
        fixedTicketCapacity = config.fixedTicketCapacity;
        eventStartsAt = fixedEventStartsAtIso(config.reservationEventDate);
      }

      if (
        event.experienceType === UpcomingExperienceType.VENUE_SEATING &&
        clientEnabled &&
        config
      ) {
        eventStartsAt = fixedEventStartsAtIso(
          config.reservationEventDate ?? config.reservationOpensAt,
        );
      }

      const purchaseCtx = resolveUpcomingPurchaseContext({
        experienceType: event.experienceType ?? null,
        price: event.price,
        clientEnabled,
        templateScheduleMode:
          templateScheduleMode as ReservationEventScheduleMode | null,
        reservationOpensAt: config?.reservationOpensAt ?? null,
        reservationClosesAt: config?.reservationClosesAt ?? null,
        reservationEventDate: config?.reservationEventDate ?? null,
        reservationTimezone: config?.reservationTimezone ?? null,
        hasActiveSessions,
        fixedTicketCapacity,
      });

      return {
        ...event,
        hasActiveSessions,
        salesOpen: purchaseCtx.salesOpen,
        purchaseMode: purchaseCtx.purchaseMode,
        purchasable: purchaseCtx.purchasable,
        ...(fixedTicketCapacity != null ? { fixedTicketCapacity } : {}),
        ...(eventStartsAt != null ? { eventStartsAt } : {}),
      };
    });
  }
}
