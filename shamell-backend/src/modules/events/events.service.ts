import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EventPublicSection,
  EventTypeCatalogChannel,
  EventTypeOccasionUsage,
  GalleryMediaType,
  ReservationEventScheduleMode,
  UpcomingExperienceType,
} from '@prisma/client';
import { ensureUniqueEventSlug } from '../../common/event-slug.util';
import {
  type ImagePreset,
  type VideoVariant,
  mediaDeliveryUrl,
  videoUrl as toDeliveryVideoUrl,
} from '../../common/util/cloudinary-delivery.util';
import { PrismaService } from '../../prisma/prisma.service';
import { GalleryService } from '../gallery/gallery.service';
import { resolveUpcomingPurchaseContext } from '../upcoming-events/upcoming-purchase-mode.util';
import { fixedEventStartsAtIso } from '../upcoming-events/upcoming-fixed-ticket.util';
import {
  adminEventTypesWhereForSection,
  bookingInquiryCatalogEventWhere,
  catalogChannelForPublicSection,
  eventsWhereForPublicSection,
} from './booking-inquiry-catalog.util';
import { CreateEventDto } from './dto/create-event.dto';
import { CreateEventTypeDto } from './dto/create-event-type.dto';
import { CreateOccasionTypeDto } from './dto/create-occasion-type.dto';
import { EventTypeOccasionAssignmentDto } from './dto/event-type-occasion-assignment.dto';
import { ListEventsQueryDto } from './dto/list-events-query.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { UpdateEventTypeDto } from './dto/update-event-type.dto';
import { UpdateOccasionTypeDto } from './dto/update-occasion-type.dto';

type OccasionLinkRow = {
  usage: EventTypeOccasionUsage;
  sortOrder: number;
  occasionType: { id: string; name: string; isActive: boolean };
};

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly galleryService: GalleryService,
  ) {}

  /** Cloudinary videos and common extensions → VIDEO even if DB `mediaType` is stale. */
  private effectiveGalleryMediaType(
    imageUrl: string | null | undefined,
    mediaType?: GalleryMediaType | null,
  ): GalleryMediaType {
    const u = typeof imageUrl === 'string' ? imageUrl.trim() : '';
    if (u) {
      const lower = u.toLowerCase();
      if (
        lower.includes('/video/upload/') ||
        /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i.test(lower)
      ) {
        return GalleryMediaType.VIDEO;
      }
    }
    return mediaType ?? GalleryMediaType.IMAGE;
  }

  /** Optimized delivery URL for a gallery row, branching image vs video. */
  private deliverGalleryUrl(
    url: string | null | undefined,
    mediaType: GalleryMediaType | null | undefined,
    imagePreset: ImagePreset,
    videoVariant: VideoVariant = 'stream720',
  ): string | null {
    if (!url?.trim()) return null;
    const isVideo =
      this.effectiveGalleryMediaType(url, mediaType) === GalleryMediaType.VIDEO;
    return mediaDeliveryUrl(url, isVideo, imagePreset, videoVariant) ?? url;
  }

  /** Catalog hero: stream/image URL + poster pair for video cards. */
  private mapCatalogHeroFields(
    rawUrl: string | null | undefined,
    mediaType: GalleryMediaType | null | undefined,
  ) {
    if (!rawUrl?.trim()) {
      return {
        heroImageUrl: null as string | null,
        heroMediaType: null as GalleryMediaType | null,
        heroPosterUrl: null as string | null,
        heroPosterUrlMobile: null as string | null,
      };
    }
    const heroMediaType = this.effectiveGalleryMediaType(rawUrl, mediaType);
    const isVideo = heroMediaType === GalleryMediaType.VIDEO;
    return {
      heroImageUrl: this.deliverGalleryUrl(rawUrl, mediaType, 'card'),
      heroMediaType,
      heroPosterUrl: isVideo ? toDeliveryVideoUrl(rawUrl, 'poster720') : null,
      heroPosterUrlMobile: isVideo
        ? toDeliveryVideoUrl(rawUrl, 'poster480')
        : null,
    };
  }

  private async resolveEventTypeIdForWrite(dto: {
    eventTypeId?: string;
    eventTypeName?: string;
    catalogChannel: EventTypeCatalogChannel;
  }): Promise<string> {
    if (dto.eventTypeId) {
      const eventType = await this.prisma.eventType.findUnique({
        where: { id: dto.eventTypeId },
        select: { id: true, isActive: true, catalogChannel: true },
      });
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

    const existingType = await this.prisma.eventType.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        catalogChannel: dto.catalogChannel,
      },
      select: { id: true, isActive: true },
    });
    if (existingType) {
      const taken = await this.prisma.event.findUnique({
        where: { eventTypeId: existingType.id },
        select: { id: true },
      });
      if (taken) {
        throw new ConflictException(
          'An event with this name already exists. Choose a different name.',
        );
      }
      if (!existingType.isActive) {
        await this.prisma.eventType.update({
          where: { id: existingType.id },
          data: { isActive: true },
        });
      }
      return existingType.id;
    }

    const createdType = await this.prisma.eventType.create({
      data: { name, catalogChannel: dto.catalogChannel },
      select: { id: true },
    });
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
    const eventType = await this.prisma.eventType.findUnique({
      where: { id: eventTypeId },
      select: { name: true },
    });
    const slug = isUpcoming
      ? dto.slug?.trim() ||
        (await ensureUniqueEventSlug(
          this.prisma,
          dto.eventTypeName?.trim() || eventType?.name || 'event',
        ))
      : null;
    // Upcoming events may be NORMAL (no experience) when no schedule is chosen;
    // the inline form sends VENUE_SEATING / CLASSES explicitly when applicable.
    const experienceType = isUpcoming ? (dto.experienceType ?? null) : null;

    try {
      const created = await this.prisma.event.create({
        data: {
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
        },
        include: {
          eventType: true,
          galleryPhotos: {
            where: { isActive: true },
            orderBy: { createdAt: 'asc' },
            select: { imageUrl: true, mediaType: true },
          },
        },
      });

      if (created.publicSection === EventPublicSection.UPCOMING_EVENTS) {
        await this.prisma.upcomingVenueConfig.upsert({
          where: { eventId: created.id },
          create: { eventId: created.id },
          update: {},
        });
      }

      return {
        message: 'Event created successfully.',
        event: this.mapEvent(created),
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

    const events = await this.prisma.event.findMany({
      where: {
        isActive: true,
        showOnHome: true,
        ...eventsWhereForPublicSection(publicSection),
      },
      include: {
        eventType: true,
        galleryPhotos: {
          where: { isActive: true },
          orderBy: { createdAt: 'asc' },
          select: { imageUrl: true, mediaType: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    return events.map((item) => this.mapEvent(item));
  }

  /**
   * Lightweight upcoming hub cards (Home + /on-coming-events list).
   * Hero-only media; purchase context without per-event floor/reservation N+1.
   */
  async getPublicUpcomingHubEvents() {
    const events = await this.prisma.event.findMany({
      where: {
        isActive: true,
        showOnHome: true,
        ...eventsWhereForPublicSection(EventPublicSection.UPCOMING_EVENTS),
      },
      include: {
        eventType: true,
        galleryPhotos: {
          where: { isActive: true },
          orderBy: { createdAt: 'asc' },
          take: 1,
          select: { imageUrl: true, mediaType: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    const mapped = events.map((item) => this.mapEvent(item));
    return this.enrichUpcomingHubEventsLight(mapped);
  }

  /** Contact / booking inquiry wizard: general catalog only (excludes ON COMING upcoming hub). */
  async getContactLines() {
    const events = await this.prisma.event.findMany({
      where: bookingInquiryCatalogEventWhere,
      include: {
        galleryPhotos: {
          where: { isActive: true },
          orderBy: { createdAt: 'asc' },
          select: { imageUrl: true, mediaType: true },
        },
        eventType: {
          include: {
            occasionLinks: {
              where: { occasionType: { isActive: true } },
              orderBy: [{ sortOrder: 'asc' }],
              include: {
                occasionType: {
                  select: { id: true, name: true, isActive: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const fromEvents = events
      .filter((e) => e.eventType.isActive)
      .map((item) => this.mapContactLine(item));

    const coveredTypeIds = fromEvents.map((l) => l.eventTypeId);
    const orphanTypes = await this.prisma.eventType.findMany({
      where: {
        isActive: true,
        catalogChannel: EventTypeCatalogChannel.BOOKING,
        occasionLinks: { some: { occasionType: { isActive: true } } },
        ...(coveredTypeIds.length > 0 ? { id: { notIn: coveredTypeIds } } : {}),
      },
      include: {
        occasionLinks: {
          where: { occasionType: { isActive: true } },
          orderBy: [{ sortOrder: 'asc' }],
          include: {
            occasionType: { select: { id: true, name: true, isActive: true } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const fromTypesOnly = orphanTypes.map((t) =>
      this.mapContactLineFromEventType(t),
    );

    return [...fromEvents, ...fromTypesOnly];
  }

  /** Public snippet for contact deep-link (general catalog event + active type only). */
  async getPublicCatalogById(id: string) {
    const event = await this.prisma.event.findFirst({
      where: {
        id,
        ...bookingInquiryCatalogEventWhere,
      },
      include: {
        eventType: true,
        galleryPhotos: {
          where: { isActive: true },
          orderBy: { createdAt: 'asc' },
          select: { imageUrl: true, mediaType: true },
        },
      },
    });
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
        ? this.effectiveGalleryMediaType(hero.imageUrl, hero.mediaType)
        : null,
      contactInquiryCode: event.eventType.contactInquiryCode ?? null,
    };
  }

  async getAdminEvents(query?: ListEventsQueryDto) {
    const publicSection = query?.publicSection ?? EventPublicSection.GENERAL;
    const events = await this.prisma.event.findMany({
      where: eventsWhereForPublicSection(publicSection),
      include: {
        eventType: true,
        galleryPhotos: {
          where: { isActive: true },
          orderBy: { createdAt: 'asc' },
          select: { id: true, imageUrl: true, mediaType: true },
        },
        _count: {
          select: { bookings: true, galleryPhotos: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    return events.map((item) => {
      const { _count, ...rest } = item;
      return {
        ...this.mapEvent(rest),
        bookingCount: _count.bookings,
        galleryPhotoCount: _count.galleryPhotos,
      };
    });
  }

  async getAdminEventById(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        eventType: true,
        galleryPhotos: {
          where: { isActive: true },
          orderBy: { createdAt: 'asc' },
          select: { id: true, imageUrl: true, mediaType: true },
        },
      },
    });
    if (!event) throw new NotFoundException('Event not found.');
    return this.mapEvent(event);
  }

  async updateEvent(id: string, dto: UpdateEventDto) {
    const existing = await this.prisma.event.findUnique({
      where: { id },
      select: { id: true, eventTypeId: true, publicSection: true },
    });
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
      const duplicate = await this.prisma.eventType.findFirst({
        where: {
          name: { equals: name, mode: 'insensitive' },
          catalogChannel,
          NOT: { id: existing.eventTypeId },
        },
        select: { id: true },
      });
      if (duplicate) {
        const taken = await this.prisma.event.findUnique({
          where: { eventTypeId: duplicate.id },
          select: { id: true },
        });
        if (taken) {
          throw new ConflictException(
            'An event with this name already exists. Choose a different name.',
          );
        }
      }
      await this.prisma.eventType.update({
        where: { id: existing.eventTypeId },
        data: { name },
      });
    }

    try {
      const updated = await this.prisma.event.update({
        where: { id },
        data: {
          ...(nextEventTypeId ? { eventTypeId: nextEventTypeId } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description }
            : {}),
          ...(dto.items !== undefined ? { items: dto.items } : {}),
          ...(dto.price !== undefined ? { price: dto.price } : {}),
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
          ...(dto.showOnHome !== undefined
            ? { showOnHome: dto.showOnHome }
            : {}),
          ...(dto.slug !== undefined ? { slug: dto.slug.trim() || null } : {}),
          ...(dto.experienceType !== undefined
            ? { experienceType: dto.experienceType }
            : {}),
          ...(dto.classVariant !== undefined
            ? { classVariant: dto.classVariant }
            : {}),
        },
        include: {
          eventType: true,
          galleryPhotos: {
            where: { isActive: true },
            orderBy: { createdAt: 'asc' },
            select: { id: true, imageUrl: true, mediaType: true },
          },
        },
      });

      if (
        updated.publicSection === EventPublicSection.UPCOMING_EVENTS &&
        updated.experienceType === UpcomingExperienceType.VENUE_SEATING
      ) {
        await this.prisma.upcomingVenueConfig.upsert({
          where: { eventId: updated.id },
          create: { eventId: updated.id },
          update: {},
        });
      }

      return {
        message: 'Event updated successfully.',
        event: this.mapEvent(updated),
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
    const existing = await this.prisma.event.findUnique({
      where: { id },
      select: { id: true, eventTypeId: true, publicSection: true },
    });
    if (!existing) throw new NotFoundException('Event not found.');

    await this.ensureEventCanBeDeleted(id);

    const venueConfig = await this.prisma.upcomingVenueConfig.findUnique({
      where: { eventId: id },
      select: { reservationEventTemplateId: true },
    });
    const linkedTemplateId = venueConfig?.reservationEventTemplateId ?? null;

    const catalogPhotos = await this.prisma.galleryPhoto.findMany({
      where: { eventId: id },
      select: { id: true },
    });
    for (const photo of catalogPhotos) {
      await this.galleryService.deletePhoto(photo.id);
    }

    await this.prisma.event.delete({ where: { id } });

    if (linkedTemplateId) {
      await this.deleteReservationTemplateIfUnlinked(linkedTemplateId);
    }

    if (existing.publicSection === EventPublicSection.UPCOMING_EVENTS) {
      await this.deleteOrphanInlineEventType(existing.eventTypeId);
    }

    return {
      message: 'Event deleted successfully.',
    };
  }

  async createEventType(dto: CreateEventTypeDto) {
    try {
      const created = await this.prisma.eventType.create({
        data: {
          name: dto.name,
          catalogChannel: EventTypeCatalogChannel.BOOKING,
          contactInquiryCode: dto.contactInquiryCode ?? null,
        },
      });
      if (dto.occasions !== undefined) {
        await this.syncOccasionAssignments(created.id, dto.occasions);
      }
      const full = await this.prisma.eventType.findUniqueOrThrow({
        where: { id: created.id },
        include: {
          occasionLinks: {
            orderBy: [{ sortOrder: 'asc' }],
            include: { occasionType: true },
          },
        },
      });
      return {
        message: 'Event type created successfully.',
        eventType: this.mapEventTypeAdmin(full),
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
    const types = await this.prisma.eventType.findMany({
      where: {
        isActive: true,
        catalogChannel: EventTypeCatalogChannel.BOOKING,
      },
      orderBy: { createdAt: 'asc' },
    });
    return types.map((item) => this.mapEventType(item));
  }

  async getAdminEventTypes(query?: { publicSection?: EventPublicSection }) {
    const section = query?.publicSection ?? EventPublicSection.GENERAL;
    const types = await this.prisma.eventType.findMany({
      where: adminEventTypesWhereForSection(section),
      orderBy: { createdAt: 'asc' },
      include: {
        occasionLinks: {
          orderBy: [{ sortOrder: 'asc' }],
          include: { occasionType: true },
        },
        _count: {
          select: { events: true, bookings: true, galleryPhotos: true },
        },
      },
    });
    return types.map((item) => {
      const { _count, ...rest } = item;
      return {
        ...this.mapEventTypeAdmin(rest),
        eventCount: _count.events,
        bookingCount: _count.bookings,
        galleryPhotoCount: _count.galleryPhotos,
      };
    });
  }

  async updateEventType(id: string, dto: UpdateEventTypeDto) {
    const existing = await this.prisma.eventType.findUnique({
      where: { id },
      select: { id: true },
    });
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
        await this.prisma.eventType.update({
          where: { id },
          data: dataPayload,
        });
      }

      if (dto.occasions !== undefined) {
        await this.syncOccasionAssignments(id, dto.occasions);
      }

      const reloaded = await this.prisma.eventType.findUniqueOrThrow({
        where: { id },
        include: {
          occasionLinks: {
            orderBy: [{ sortOrder: 'asc' }],
            include: { occasionType: true },
          },
        },
      });

      return {
        message: 'Event type updated successfully.',
        eventType: this.mapEventTypeAdmin(reloaded),
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
    const existing = await this.prisma.eventType.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Event type not found.');

    await this.ensureEventTypeHasNoBlockingUsage(id);

    await this.prisma.eventType.delete({ where: { id } });

    return {
      message: 'Event type deleted successfully.',
    };
  }

  async getAdminOccasionTypes() {
    const rows = await this.prisma.occasionType.findMany({
      orderBy: [{ name: 'asc' }],
      include: {
        _count: {
          select: { bookings: true, eventLinks: true },
        },
      },
    });
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
      const created = await this.prisma.occasionType.create({
        data: {
          name: dto.name,
          isActive: dto.isActive ?? true,
        },
      });
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
    const existing = await this.prisma.occasionType.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Occasion type not found.');

    if (dto.isActive === false) {
      await this.ensureOccasionTypeCanBeDisabled(id);
    }

    try {
      const updated = await this.prisma.occasionType.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        },
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
    const existing = await this.prisma.occasionType.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Occasion type not found.');

    await this.ensureOccasionTypeCanBeDeleted(id);

    await this.prisma.occasionType.delete({ where: { id } });

    return {
      message: 'Occasion type deleted successfully.',
    };
  }

  private async ensureOccasionTypeCanBeDisabled(occasionTypeId: string) {
    const n = await this.prisma.booking.count({ where: { occasionTypeId } });
    if (n > 0) {
      throw new ConflictException(
        'Cannot disable this occasion type because it is associated with existing bookings.',
      );
    }
  }

  private async ensureOccasionTypeCanBeDeleted(occasionTypeId: string) {
    const n = await this.prisma.booking.count({ where: { occasionTypeId } });
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
      await this.prisma.eventTypeOccasion.deleteMany({
        where: { eventTypeId },
      });
      return;
    }
    const occasions = await this.prisma.occasionType.findMany({
      where: { id: { in: ids }, isActive: true },
      select: { id: true },
    });
    if (occasions.length !== ids.length) {
      throw new BadRequestException(
        'One or more occasion types are invalid or inactive.',
      );
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.eventTypeOccasion.deleteMany({ where: { eventTypeId } });
      await tx.eventTypeOccasion.createMany({
        data: assignments.map((a, sortOrder) => ({
          eventTypeId,
          occasionTypeId: a.occasionTypeId,
          usage: a.usage,
          sortOrder,
        })),
      });
    });
  }

  private async ensureEventCanBeDisabled(eventId: string) {
    const n = await this.prisma.booking.count({ where: { eventId } });
    if (n > 0) {
      throw new ConflictException(
        'Cannot disable this event because it has associated bookings.',
      );
    }
  }

  /** Removes a reservation schedule row left behind after its only venue config is deleted. */
  private async deleteReservationTemplateIfUnlinked(templateId: string) {
    const remainingLinks = await this.prisma.upcomingVenueConfig.count({
      where: { reservationEventTemplateId: templateId },
    });
    if (remainingLinks === 0) {
      await this.prisma.reservationEventTemplate.delete({
        where: { id: templateId },
      });
    }
  }

  private async ensureEventCanBeDeleted(eventId: string) {
    const [bookingCount, seatReservationCount, classEnrollmentCount] =
      await Promise.all([
        this.prisma.booking.count({ where: { eventId } }),
        this.prisma.venueSeatReservation.count({
          where: {
            upcomingEventId: eventId,
            status: { in: ['PAID', 'PENDING_PAYMENT'] },
          },
        }),
        this.prisma.upcomingClassEnrollment.count({
          where: {
            session: { eventId },
            status: { in: ['PAID', 'PENDING_PAYMENT'] },
          },
        }),
      ]);
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

  /** Removes event types auto-created for a single upcoming catalog entry. */
  private async deleteOrphanInlineEventType(eventTypeId: string) {
    const [eventCount, bookingCount, galleryCount, occasionCount] =
      await Promise.all([
        this.prisma.event.count({ where: { eventTypeId } }),
        this.prisma.booking.count({ where: { eventTypeId } }),
        this.prisma.galleryPhoto.count({ where: { eventTypeId } }),
        this.prisma.eventTypeOccasion.count({ where: { eventTypeId } }),
      ]);
    if (
      eventCount > 0 ||
      bookingCount > 0 ||
      galleryCount > 0 ||
      occasionCount > 0
    ) {
      return;
    }
    const type = await this.prisma.eventType.findUnique({
      where: { id: eventTypeId },
      select: { contactInquiryCode: true },
    });
    if (type?.contactInquiryCode) return;

    await this.prisma.eventType.delete({ where: { id: eventTypeId } });
  }

  private async ensureEventTypeHasNoBlockingUsage(eventTypeId: string) {
    const [eventCount, bookingCount, galleryCount] = await Promise.all([
      this.prisma.event.count({ where: { eventTypeId } }),
      this.prisma.booking.count({ where: { eventTypeId } }),
      this.prisma.galleryPhoto.count({ where: { eventTypeId } }),
    ]);
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

  private mapOccasionGroups(links: OccasionLinkRow[]) {
    const occasionSingle: { id: string; name: string }[] = [];
    const occasionBespokeProject: { id: string; name: string }[] = [];
    const occasionBespokeRole: { id: string; name: string }[] = [];
    const sorted = [...links].sort((a, b) => {
      if (a.usage !== b.usage) return a.usage.localeCompare(b.usage);
      return a.sortOrder - b.sortOrder;
    });
    for (const L of sorted) {
      const row = { id: L.occasionType.id, name: L.occasionType.name };
      if (L.usage === EventTypeOccasionUsage.OCCASION_SINGLE)
        occasionSingle.push(row);
      else if (L.usage === EventTypeOccasionUsage.BESPOKE_PROJECT)
        occasionBespokeProject.push(row);
      else if (L.usage === EventTypeOccasionUsage.BESPOKE_ROLE)
        occasionBespokeRole.push(row);
    }
    return { occasionSingle, occasionBespokeProject, occasionBespokeRole };
  }

  private mapContactLine(item: {
    id: string;
    eventTypeId: string;
    description: string;
    items: string[];
    price: unknown;
    galleryPhotos: { imageUrl: string; mediaType: GalleryMediaType }[];
    isActive: boolean;
    showOnHome: boolean;
    publicSection: EventPublicSection;
    createdAt: Date;
    updatedAt: Date;
    eventType: {
      id: string;
      name: string;
      contactInquiryCode: string | null;
      isActive: boolean;
      occasionLinks: OccasionLinkRow[];
    };
  }) {
    const groups = this.mapOccasionGroups(item.eventType.occasionLinks);
    const photos = item.galleryPhotos ?? [];
    const first = photos[0];
    const hero = this.mapCatalogHeroFields(first?.imageUrl, first?.mediaType);
    return {
      id: item.id,
      eventTypeId: item.eventType.id,
      eventTypeName: item.eventType.name,
      contactInquiryCode: item.eventType.contactInquiryCode,
      description: item.description,
      items: item.items,
      images: photos
        .filter((p) => p.mediaType === GalleryMediaType.IMAGE)
        .map((p) => this.deliverGalleryUrl(p.imageUrl, p.mediaType, 'card')),
      ...hero,
      showOnHome: item.showOnHome,
      publicSection: item.publicSection,
      lineKind: 'event' as const,
      price: item.price != null ? Number(item.price) : null,
      ...groups,
    };
  }

  /** Catalog line when only EventType exists (no Event row yet). Same shape as mapContactLine; `id` is event type id — clients must not send it as eventId. */
  private mapContactLineFromEventType(item: {
    id: string;
    name: string;
    contactInquiryCode: string | null;
    occasionLinks: OccasionLinkRow[];
  }) {
    const groups = this.mapOccasionGroups(item.occasionLinks);
    return {
      id: item.id,
      eventTypeId: item.id,
      eventTypeName: item.name,
      contactInquiryCode: item.contactInquiryCode,
      description: '',
      items: [] as string[],
      images: [] as string[],
      heroImageUrl: null as string | null,
      heroMediaType: null as GalleryMediaType | null,
      lineKind: 'event_type' as const,
      price: null,
      ...groups,
    };
  }

  private mapEvent(item: {
    id: string;
    eventTypeId: string;
    description: string;
    items: string[];
    price: unknown;
    isActive: boolean;
    showOnHome: boolean;
    publicSection: EventPublicSection;
    slug?: string | null;
    experienceType?: UpcomingExperienceType | null;
    classVariant?: string | null;
    createdAt: Date;
    updatedAt: Date;
    galleryPhotos?: Array<
      | { imageUrl: string }
      | { id: string; imageUrl: string; mediaType: GalleryMediaType }
    >;
    eventType: {
      id: string;
      name: string;
      contactInquiryCode: string | null;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
    };
  }) {
    const rows = item.galleryPhotos ?? [];
    const imageRows = rows.filter(
      (p) => !('mediaType' in p) || p.mediaType === GalleryMediaType.IMAGE,
    );
    const catalogImages = rows.filter(
      (p): p is { id: string; imageUrl: string; mediaType: GalleryMediaType } =>
        'id' in p &&
        typeof (p as { id: unknown }).id === 'string' &&
        'mediaType' in p,
    );
    const first = rows[0];
    const firstMediaType =
      first && 'mediaType' in first && first.mediaType ? first.mediaType : null;
    const hero = this.mapCatalogHeroFields(first?.imageUrl, firstMediaType);

    return {
      id: item.id,
      eventTypeId: item.eventType.id,
      eventTypeName: item.eventType.name,
      contactInquiryCode: item.eventType.contactInquiryCode,
      eventType: this.mapEventType(item.eventType),
      description: item.description,
      items: item.items,
      price: item.price != null ? Number(item.price) : null,
      images: imageRows.map(
        (p) =>
          this.deliverGalleryUrl(
            p.imageUrl,
            'mediaType' in p ? p.mediaType : null,
            'card',
          ) ?? p.imageUrl,
      ),
      ...hero,
      catalogImages: catalogImages.map((p) => ({
        id: p.id,
        imageUrl:
          this.deliverGalleryUrl(p.imageUrl, p.mediaType, 'galleryThumb') ??
          p.imageUrl,
        mediaType: p.mediaType,
      })),
      isActive: item.isActive,
      showOnHome: item.showOnHome,
      publicSection: item.publicSection,
      slug: item.slug ?? null,
      experienceType: item.experienceType ?? null,
      classVariant: item.classVariant ?? null,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  /**
   * Hub/home enrichment: purchase mode + start time only.
   * Inventory (tables/tickets) is left to detail/checkout pages.
   */
  private async enrichUpcomingHubEventsLight(
    events: ReturnType<typeof this.mapEvent>[],
  ) {
    if (events.length === 0) return [];

    const now = new Date();
    const eventIds = events.map((event) => event.id);
    const classEventIds = events
      .filter(
        (event) => event.experienceType === UpcomingExperienceType.CLASSES,
      )
      .map((event) => event.id);

    const [activeSessionCounts, configs] = await Promise.all([
      classEventIds.length > 0
        ? this.prisma.upcomingClassSession.groupBy({
            by: ['eventId'],
            where: {
              eventId: { in: classEventIds },
              isActive: true,
              endsAt: { gt: now },
            },
            _count: { _all: true },
          })
        : Promise.resolve(
            [] as Array<{ eventId: string; _count: { _all: number } }>,
          ),
      this.prisma.upcomingVenueConfig.findMany({
        where: { eventId: { in: eventIds } },
        select: {
          eventId: true,
          clientEnabled: true,
          fixedTicketCapacity: true,
          reservationOpensAt: true,
          reservationClosesAt: true,
          reservationEventDate: true,
          reservationTimezone: true,
          reservationEventTemplate: {
            select: { scheduleMode: true },
          },
        },
      }),
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
        templateScheduleMode,
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

  private mapEventType(item: {
    id: string;
    name: string;
    catalogChannel?: EventTypeCatalogChannel;
    contactInquiryCode: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: item.id,
      name: item.name,
      ...(item.catalogChannel != null
        ? { catalogChannel: item.catalogChannel }
        : {}),
      contactInquiryCode: item.contactInquiryCode,
      isActive: item.isActive,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  private mapEventTypeAdmin(item: {
    id: string;
    name: string;
    catalogChannel?: EventTypeCatalogChannel;
    contactInquiryCode: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    occasionLinks: OccasionLinkRow[];
  }) {
    const base = this.mapEventType(item);
    const groups = this.mapOccasionGroups(item.occasionLinks);
    return {
      ...base,
      occasionAssignments: item.occasionLinks.map((L) => ({
        occasionTypeId: L.occasionType.id,
        occasionName: L.occasionType.name,
        occasionActive: L.occasionType.isActive,
        usage: L.usage,
        sortOrder: L.sortOrder,
      })),
      ...groups,
    };
  }
}
