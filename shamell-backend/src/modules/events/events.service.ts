import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventTypeOccasionUsage, GalleryMediaType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { CreateEventTypeDto } from './dto/create-event-type.dto';
import { CreateOccasionTypeDto } from './dto/create-occasion-type.dto';
import { EventTypeOccasionAssignmentDto } from './dto/event-type-occasion-assignment.dto';
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
  constructor(private readonly prisma: PrismaService) {}

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

  async createEvent(dto: CreateEventDto) {
    const eventType = await this.prisma.eventType.findUnique({
      where: { id: dto.eventTypeId },
      select: { id: true, isActive: true },
    });
    if (!eventType) throw new NotFoundException('Event type not found.');
    if (!eventType.isActive)
      throw new BadRequestException('Event type is inactive.');

    try {
      const created = await this.prisma.event.create({
        data: {
          eventTypeId: dto.eventTypeId,
          description: dto.description,
          items: dto.items,
          showOnHome: dto.showOnHome ?? true,
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
  async getPublicEvents() {
    const events = await this.prisma.event.findMany({
      where: { isActive: true, showOnHome: true },
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

  /** Contact wizard: active events plus active event types that do not yet have an active event row. */
  async getContactLines() {
    const events = await this.prisma.event.findMany({
      where: { isActive: true },
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

  /** Public snippet for contact deep-link (active event + active type only). */
  async getPublicCatalogById(id: string) {
    const event = await this.prisma.event.findFirst({
      where: { id, isActive: true },
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

  async getAdminEvents() {
    const events = await this.prisma.event.findMany({
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
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Event not found.');

    if (dto.isActive === false) {
      await this.ensureEventCanBeDisabled(id);
    }

    if (dto.eventTypeId) {
      const eventType = await this.prisma.eventType.findUnique({
        where: { id: dto.eventTypeId },
        select: { id: true, isActive: true },
      });
      if (!eventType) throw new NotFoundException('Event type not found.');
      if (!eventType.isActive)
        throw new BadRequestException('Event type is inactive.');
    }

    try {
      const updated = await this.prisma.event.update({
        where: { id },
        data: {
          ...(dto.eventTypeId ? { eventTypeId: dto.eventTypeId } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description }
            : {}),
          ...(dto.items !== undefined ? { items: dto.items } : {}),
          ...(dto.price !== undefined ? { price: dto.price } : {}),
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
          ...(dto.showOnHome !== undefined
            ? { showOnHome: dto.showOnHome }
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
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Event not found.');

    await this.ensureEventCanBeDeleted(id);

    await this.prisma.event.delete({ where: { id } });

    return {
      message: 'Event deleted successfully.',
    };
  }

  async createEventType(dto: CreateEventTypeDto) {
    try {
      const created = await this.prisma.eventType.create({
        data: {
          name: dto.name,
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
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });
    return types.map((item) => this.mapEventType(item));
  }

  async getAdminEventTypes() {
    const types = await this.prisma.eventType.findMany({
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

  private async ensureEventCanBeDeleted(eventId: string) {
    const [bookingCount, galleryCount] = await Promise.all([
      this.prisma.booking.count({ where: { eventId } }),
      this.prisma.galleryPhoto.count({ where: { eventId } }),
    ]);
    if (bookingCount > 0) {
      throw new ConflictException(
        'Cannot delete this event because it has associated bookings.',
      );
    }
    if (galleryCount > 0) {
      throw new ConflictException(
        'Cannot delete this event because gallery photos are still linked to it.',
      );
    }
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
    galleryPhotos: { imageUrl: string; mediaType: GalleryMediaType }[];
    isActive: boolean;
    showOnHome: boolean;
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
    return {
      id: item.id,
      eventTypeId: item.eventType.id,
      eventTypeName: item.eventType.name,
      contactInquiryCode: item.eventType.contactInquiryCode,
      description: item.description,
      items: item.items,
      images: photos
        .filter((p) => p.mediaType === GalleryMediaType.IMAGE)
        .map((p) => p.imageUrl),
      heroImageUrl: first?.imageUrl ?? null,
      heroMediaType: first
        ? this.effectiveGalleryMediaType(first.imageUrl, first.mediaType)
        : null,
      showOnHome: item.showOnHome,
      lineKind: 'event' as const,
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
    const firstMediaType = first
      ? this.effectiveGalleryMediaType(
          first.imageUrl,
          'mediaType' in first && first.mediaType ? first.mediaType : null,
        )
      : GalleryMediaType.IMAGE;

    return {
      id: item.id,
      eventTypeId: item.eventType.id,
      eventTypeName: item.eventType.name,
      contactInquiryCode: item.eventType.contactInquiryCode,
      eventType: this.mapEventType(item.eventType),
      description: item.description,
      items: item.items,
      price: item.price != null ? Number(item.price) : null,
      images: imageRows.map((p) => p.imageUrl),
      heroImageUrl: first?.imageUrl ?? null,
      heroMediaType: first ? firstMediaType : null,
      catalogImages: catalogImages.map((p) => ({
        id: p.id,
        imageUrl: p.imageUrl,
        mediaType: p.mediaType,
      })),
      isActive: item.isActive,
      showOnHome: item.showOnHome,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  private mapEventType(item: {
    id: string;
    name: string;
    contactInquiryCode: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: item.id,
      name: item.name,
      contactInquiryCode: item.contactInquiryCode,
      isActive: item.isActive,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  private mapEventTypeAdmin(item: {
    id: string;
    name: string;
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
