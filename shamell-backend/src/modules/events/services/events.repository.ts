import { Injectable } from '@nestjs/common';
import {
  EventPublicSection,
  EventTypeCatalogChannel,
  EventTypeOccasionUsage,
  Prisma,
  UpcomingClassEnrollmentStatus,
  VenueSeatReservationStatus,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  ACTIVE_CLASS_ENROLLMENT_STATUSES,
  ACTIVE_SEAT_RESERVATION_STATUSES,
  adminEventListInclude,
  contactLineEventInclude,
  eventTypeAdminInclude,
  eventTypeAdminReloadInclude,
  eventWithTypeAndGalleryAdminInclude,
  eventWithTypeAndGalleryInclude,
  eventWithTypeAndHeroGalleryInclude,
  hubVenueConfigSelect,
  orphanEventTypeInclude,
} from '../constants/events.constants';
import type {
  EventDeleteGuardCounts,
  EventTypeUsageCounts,
  HubVenueConfigRow,
  OrphanEventTypeCounts,
} from '../types/events.types';
import {
  adminEventTypesWhereForSection,
  bookingInquiryCatalogEventWhere,
  eventsWhereForPublicSection,
} from '../utils/booking-inquiry-catalog.util';

export type CreateEventData = {
  eventTypeId: string;
  description: string;
  items: string[];
  showOnHome: boolean;
  publicSection: EventPublicSection;
  slug: string | null;
  experienceType: Prisma.EventCreateInput['experienceType'];
  classVariant: Prisma.EventCreateInput['classVariant'];
  price?: number;
};

export type UpdateEventData = Prisma.EventUpdateInput;

export type OccasionAssignmentRow = {
  occasionTypeId: string;
  usage: EventTypeOccasionUsage;
};

@Injectable()
export class EventsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Expose Prisma for helpers like `ensureUniqueEventSlug`. */
  asPrisma(): PrismaService {
    return this.prisma;
  }

  findEventTypeByIdForWrite(id: string) {
    return this.prisma.eventType.findUnique({
      where: { id },
      select: { id: true, isActive: true, catalogChannel: true },
    });
  }

  findEventTypeByNameInChannel(
    name: string,
    catalogChannel: EventTypeCatalogChannel,
  ) {
    return this.prisma.eventType.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        catalogChannel,
      },
      select: { id: true, isActive: true },
    });
  }

  findEventByEventTypeId(eventTypeId: string) {
    return this.prisma.event.findUnique({
      where: { eventTypeId },
      select: { id: true },
    });
  }

  activateEventType(id: string) {
    return this.prisma.eventType.update({
      where: { id },
      data: { isActive: true },
    });
  }

  createEventTypeInline(name: string, catalogChannel: EventTypeCatalogChannel) {
    return this.prisma.eventType.create({
      data: { name, catalogChannel },
      select: { id: true },
    });
  }

  findEventTypeName(id: string) {
    return this.prisma.eventType.findUnique({
      where: { id },
      select: { name: true },
    });
  }

  createEvent(data: CreateEventData) {
    return this.prisma.event.create({
      data: {
        eventTypeId: data.eventTypeId,
        description: data.description,
        items: data.items,
        showOnHome: data.showOnHome,
        publicSection: data.publicSection,
        slug: data.slug,
        experienceType: data.experienceType,
        classVariant: data.classVariant,
        ...(data.price !== undefined ? { price: data.price } : {}),
      },
      include: eventWithTypeAndGalleryInclude,
    }) as Promise<
      Prisma.EventGetPayload<{ include: typeof eventWithTypeAndGalleryInclude }>
    >;
  }

  upsertUpcomingVenueConfig(eventId: string) {
    return this.prisma.upcomingVenueConfig.upsert({
      where: { eventId },
      create: { eventId },
      update: {},
    });
  }

  findPublicEventsForSection(publicSection: EventPublicSection) {
    return this.prisma.event.findMany({
      where: {
        isActive: true,
        showOnHome: true,
        ...eventsWhereForPublicSection(publicSection),
      },
      include: eventWithTypeAndGalleryInclude,
      orderBy: { createdAt: 'asc' },
    });
  }

  findPublicUpcomingHubEvents() {
    return this.prisma.event.findMany({
      where: {
        isActive: true,
        showOnHome: true,
        ...eventsWhereForPublicSection(EventPublicSection.UPCOMING_EVENTS),
      },
      include: eventWithTypeAndHeroGalleryInclude,
      orderBy: { createdAt: 'asc' },
    });
  }

  groupActiveClassSessionsByEvent(classEventIds: string[], now: Date) {
    if (classEventIds.length === 0) {
      return Promise.resolve(
        [] as Array<{ eventId: string; _count: { _all: number } }>,
      );
    }
    return this.prisma.upcomingClassSession.groupBy({
      by: ['eventId'],
      where: {
        eventId: { in: classEventIds },
        isActive: true,
        endsAt: { gt: now },
      },
      _count: { _all: true },
    });
  }

  findHubVenueConfigs(eventIds: string[]): Promise<HubVenueConfigRow[]> {
    return this.prisma.upcomingVenueConfig.findMany({
      where: { eventId: { in: eventIds } },
      select: hubVenueConfigSelect,
    });
  }

  findContactLineEvents() {
    return this.prisma.event.findMany({
      where: bookingInquiryCatalogEventWhere,
      include: contactLineEventInclude,
      orderBy: { createdAt: 'asc' },
    });
  }

  findOrphanBookingEventTypes(coveredTypeIds: string[]) {
    return this.prisma.eventType.findMany({
      where: {
        isActive: true,
        catalogChannel: EventTypeCatalogChannel.BOOKING,
        occasionLinks: { some: { occasionType: { isActive: true } } },
        ...(coveredTypeIds.length > 0 ? { id: { notIn: coveredTypeIds } } : {}),
      },
      include: orphanEventTypeInclude,
      orderBy: { name: 'asc' },
    });
  }

  findPublicCatalogEventById(id: string) {
    return this.prisma.event.findFirst({
      where: {
        id,
        ...bookingInquiryCatalogEventWhere,
      },
      include: eventWithTypeAndGalleryInclude,
    });
  }

  findAdminEvents(publicSection: EventPublicSection) {
    return this.prisma.event.findMany({
      where: eventsWhereForPublicSection(publicSection),
      include: adminEventListInclude,
      orderBy: { createdAt: 'asc' },
    });
  }

  findAdminEventById(id: string) {
    return this.prisma.event.findUnique({
      where: { id },
      include: eventWithTypeAndGalleryAdminInclude,
    });
  }

  findEventForUpdate(id: string) {
    return this.prisma.event.findUnique({
      where: { id },
      select: { id: true, eventTypeId: true, publicSection: true },
    });
  }

  findDuplicateEventTypeName(
    name: string,
    catalogChannel: EventTypeCatalogChannel,
    excludeEventTypeId: string,
  ) {
    return this.prisma.eventType.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        catalogChannel,
        NOT: { id: excludeEventTypeId },
      },
      select: { id: true },
    });
  }

  renameEventType(id: string, name: string) {
    return this.prisma.eventType.update({
      where: { id },
      data: { name },
    });
  }

  updateEvent(id: string, data: UpdateEventData) {
    return this.prisma.event.update({
      where: { id },
      data,
      include: eventWithTypeAndGalleryAdminInclude,
    });
  }

  findEventForDelete(id: string) {
    return this.prisma.event.findUnique({
      where: { id },
      select: { id: true, eventTypeId: true, publicSection: true },
    });
  }

  findVenueConfigTemplateId(eventId: string) {
    return this.prisma.upcomingVenueConfig.findUnique({
      where: { eventId },
      select: { reservationEventTemplateId: true },
    });
  }

  findGalleryPhotoIdsForEvent(eventId: string) {
    return this.prisma.galleryPhoto.findMany({
      where: { eventId },
      select: { id: true },
    });
  }

  deleteEvent(id: string) {
    return this.prisma.event.delete({ where: { id } });
  }

  countVenueConfigsForTemplate(templateId: string) {
    return this.prisma.upcomingVenueConfig.count({
      where: { reservationEventTemplateId: templateId },
    });
  }

  deleteReservationEventTemplate(templateId: string) {
    return this.prisma.reservationEventTemplate.delete({
      where: { id: templateId },
    });
  }

  async deleteReservationTemplateIfUnlinked(templateId: string) {
    const remainingLinks = await this.countVenueConfigsForTemplate(templateId);
    if (remainingLinks === 0) {
      await this.deleteReservationEventTemplate(templateId);
    }
  }

  async getEventDeleteGuardCounts(
    eventId: string,
  ): Promise<EventDeleteGuardCounts> {
    const [bookingCount, seatReservationCount, classEnrollmentCount] =
      await Promise.all([
        this.prisma.booking.count({ where: { eventId } }),
        this.prisma.venueSeatReservation.count({
          where: {
            upcomingEventId: eventId,
            status: {
              in: [
                ...ACTIVE_SEAT_RESERVATION_STATUSES,
              ] as VenueSeatReservationStatus[],
            },
          },
        }),
        this.prisma.upcomingClassEnrollment.count({
          where: {
            session: { eventId },
            status: {
              in: [
                ...ACTIVE_CLASS_ENROLLMENT_STATUSES,
              ] as UpcomingClassEnrollmentStatus[],
            },
          },
        }),
      ]);
    return { bookingCount, seatReservationCount, classEnrollmentCount };
  }

  countBookingsForEvent(eventId: string) {
    return this.prisma.booking.count({ where: { eventId } });
  }

  async getOrphanEventTypeCounts(
    eventTypeId: string,
  ): Promise<OrphanEventTypeCounts> {
    const [eventCount, bookingCount, galleryCount, occasionCount] =
      await Promise.all([
        this.prisma.event.count({ where: { eventTypeId } }),
        this.prisma.booking.count({ where: { eventTypeId } }),
        this.prisma.galleryPhoto.count({ where: { eventTypeId } }),
        this.prisma.eventTypeOccasion.count({ where: { eventTypeId } }),
      ]);
    return { eventCount, bookingCount, galleryCount, occasionCount };
  }

  findEventTypeContactInquiryCode(eventTypeId: string) {
    return this.prisma.eventType.findUnique({
      where: { id: eventTypeId },
      select: { contactInquiryCode: true },
    });
  }

  deleteEventType(id: string) {
    return this.prisma.eventType.delete({ where: { id } });
  }

  async deleteOrphanInlineEventType(eventTypeId: string) {
    const counts = await this.getOrphanEventTypeCounts(eventTypeId);
    if (
      counts.eventCount > 0 ||
      counts.bookingCount > 0 ||
      counts.galleryCount > 0 ||
      counts.occasionCount > 0
    ) {
      return;
    }
    const type = await this.findEventTypeContactInquiryCode(eventTypeId);
    if (type?.contactInquiryCode) return;
    await this.deleteEventType(eventTypeId);
  }

  createBookingEventType(name: string, contactInquiryCode: string | null) {
    return this.prisma.eventType.create({
      data: {
        name,
        catalogChannel: EventTypeCatalogChannel.BOOKING,
        contactInquiryCode,
      },
    });
  }

  findEventTypeAdminById(id: string) {
    return this.prisma.eventType.findUniqueOrThrow({
      where: { id },
      include: eventTypeAdminReloadInclude,
    });
  }

  findPublicBookingEventTypes() {
    return this.prisma.eventType.findMany({
      where: {
        isActive: true,
        catalogChannel: EventTypeCatalogChannel.BOOKING,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  findAdminEventTypes(section: EventPublicSection) {
    return this.prisma.eventType.findMany({
      where: adminEventTypesWhereForSection(section),
      orderBy: { createdAt: 'asc' },
      include: eventTypeAdminInclude,
    });
  }

  findEventTypeId(id: string) {
    return this.prisma.eventType.findUnique({
      where: { id },
      select: { id: true },
    });
  }

  updateEventType(
    id: string,
    data: {
      name?: string;
      contactInquiryCode?: string | null;
      isActive?: boolean;
    },
  ) {
    return this.prisma.eventType.update({
      where: { id },
      data,
    });
  }

  async getEventTypeUsageCounts(
    eventTypeId: string,
  ): Promise<EventTypeUsageCounts> {
    const [eventCount, bookingCount, galleryCount] = await Promise.all([
      this.prisma.event.count({ where: { eventTypeId } }),
      this.prisma.booking.count({ where: { eventTypeId } }),
      this.prisma.galleryPhoto.count({ where: { eventTypeId } }),
    ]);
    return { eventCount, bookingCount, galleryCount };
  }

  findAdminOccasionTypes() {
    return this.prisma.occasionType.findMany({
      orderBy: [{ name: 'asc' }],
      include: {
        _count: {
          select: { bookings: true, eventLinks: true },
        },
      },
    });
  }

  createOccasionType(name: string, isActive: boolean) {
    return this.prisma.occasionType.create({
      data: { name, isActive },
    });
  }

  findOccasionTypeId(id: string) {
    return this.prisma.occasionType.findUnique({
      where: { id },
      select: { id: true },
    });
  }

  updateOccasionType(id: string, data: { name?: string; isActive?: boolean }) {
    return this.prisma.occasionType.update({
      where: { id },
      data,
    });
  }

  deleteOccasionType(id: string) {
    return this.prisma.occasionType.delete({ where: { id } });
  }

  countBookingsForOccasion(occasionTypeId: string) {
    return this.prisma.booking.count({ where: { occasionTypeId } });
  }

  findActiveOccasionIds(ids: string[]) {
    return this.prisma.occasionType.findMany({
      where: { id: { in: ids }, isActive: true },
      select: { id: true },
    });
  }

  clearOccasionAssignments(eventTypeId: string) {
    return this.prisma.eventTypeOccasion.deleteMany({
      where: { eventTypeId },
    });
  }

  async replaceOccasionAssignments(
    eventTypeId: string,
    assignments: OccasionAssignmentRow[],
  ) {
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
}
