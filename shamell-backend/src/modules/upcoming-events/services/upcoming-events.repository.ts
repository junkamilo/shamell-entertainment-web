import { Injectable, NotFoundException } from '@nestjs/common';

import {
  EventPublicSection,
  Prisma,
  ReservationEventScheduleMode,
  UpcomingClassEnrollmentStatus,
  UpcomingExperienceType,
} from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';

import { assignFixedEventTicketNumber } from '../utils/upcoming-fixed-ticket.util';

export const CLASS_ENROLLMENT_CHECKOUT_INCLUDE = {
  session: {
    include: {
      section: true,

      event: { include: { eventType: true } },
    },
  },
} as const satisfies Prisma.UpcomingClassEnrollmentInclude;

export const CLASS_ENROLLMENT_EXPIRE_INCLUDE = {
  session: { include: { event: { include: { eventType: true } } } },
} as const satisfies Prisma.UpcomingClassEnrollmentInclude;

export const PACKAGE_ENROLLMENT_WEBHOOK_INCLUDE = {
  event: { include: { eventType: true } },

  items: {
    include: {
      enrollment: {
        include: {
          session: {
            include: {
              section: true,

              event: { include: { eventType: true } },
            },
          },
        },
      },
    },
  },
} as const satisfies Prisma.UpcomingClassPackageEnrollmentInclude;

export const PACKAGE_ENROLLMENT_EXPIRE_INCLUDE = {
  items: true,

  event: { include: { eventType: true } },
} as const satisfies Prisma.UpcomingClassPackageEnrollmentInclude;

export const FIXED_ENROLLMENT_WEBHOOK_INCLUDE = {
  event: { include: { eventType: true } },
} as const satisfies Prisma.UpcomingFixedEventEnrollmentInclude;

export const ADMIN_CLASS_ENROLLMENT_CREATE_INCLUDE = {
  session: {
    include: {
      section: true,
      event: { include: { eventType: true } },
    },
  },
} as const satisfies Prisma.UpcomingClassEnrollmentInclude;

export const ADMIN_CLASS_PACKAGE_ENROLLMENT_INCLUDE = {
  event: { include: { eventType: true } },
  items: {
    include: {
      enrollment: {
        include: {
          session: {
            include: {
              section: true,
              event: { include: { eventType: true } },
            },
          },
        },
      },
    },
  },
} as const satisfies Prisma.UpcomingClassPackageEnrollmentInclude;

@Injectable()
export class UpcomingEventsRepository {
  constructor(private readonly prisma: PrismaService) {}

  asPrisma(): PrismaService {
    return this.prisma;
  }

  runTransaction<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,

    options?: {
      maxWait?: number;

      timeout?: number;

      isolationLevel?: Prisma.TransactionIsolationLevel;
    },
  ): Promise<T> {
    return this.prisma.$transaction(fn, options);
  }

  findClassEnrollmentByCheckoutSessionId(checkoutSessionId: string) {
    return this.prisma.upcomingClassEnrollment.findUnique({
      where: { stripeCheckoutSessionId: checkoutSessionId },
    });
  }

  findClassEnrollmentForCheckoutSession(sessionId: string) {
    return this.prisma.upcomingClassEnrollment.findUnique({
      where: { stripeCheckoutSessionId: sessionId },

      include: CLASS_ENROLLMENT_CHECKOUT_INCLUDE,
    });
  }

  findClassEnrollmentForExpire(sessionId: string) {
    return this.prisma.upcomingClassEnrollment.findUnique({
      where: { stripeCheckoutSessionId: sessionId },

      include: CLASS_ENROLLMENT_EXPIRE_INCLUDE,
    });
  }

  markClassEnrollmentPaid(
    id: string,

    data: { paymentIntentId: string | null },
  ) {
    return this.prisma.upcomingClassEnrollment.update({
      where: { id },

      data: {
        status: UpcomingClassEnrollmentStatus.PAID,

        paidAt: new Date(),

        stripePaymentIntentId: data.paymentIntentId,

        expiresAt: null,
      },
    });
  }

  stampClassEnrollmentEmailSent(id: string) {
    return this.prisma.upcomingClassEnrollment.update({
      where: { id },

      data: { customerEmailSentAt: new Date() },
    });
  }

  markClassEnrollmentExpired(id: string) {
    return this.prisma.upcomingClassEnrollment.update({
      where: { id },

      data: { status: UpcomingClassEnrollmentStatus.EXPIRED },
    });
  }

  findPackageEnrollmentByCheckoutSessionId(checkoutSessionId: string) {
    return this.prisma.upcomingClassPackageEnrollment.findUnique({
      where: { stripeCheckoutSessionId: checkoutSessionId },
    });
  }

  findPackageEnrollmentForCheckoutSession(sessionId: string) {
    return this.prisma.upcomingClassPackageEnrollment.findUnique({
      where: { stripeCheckoutSessionId: sessionId },

      include: PACKAGE_ENROLLMENT_WEBHOOK_INCLUDE,
    });
  }

  findPackageEnrollmentForExpire(sessionId: string) {
    return this.prisma.upcomingClassPackageEnrollment.findUnique({
      where: { stripeCheckoutSessionId: sessionId },

      include: PACKAGE_ENROLLMENT_EXPIRE_INCLUDE,
    });
  }

  findPackageEnrollmentById(id: string) {
    return this.prisma.upcomingClassPackageEnrollment.findUnique({
      where: { id },

      include: PACKAGE_ENROLLMENT_WEBHOOK_INCLUDE,
    });
  }

  markPackageEnrollmentPaid(id: string) {
    return this.prisma.upcomingClassPackageEnrollment.update({
      where: { id },

      data: {
        status: UpcomingClassEnrollmentStatus.PAID,

        paidAt: new Date(),

        expiresAt: null,
      },
    });
  }

  markPackageChildEnrollmentPaid(enrollmentId: string) {
    return this.prisma.upcomingClassEnrollment.update({
      where: { id: enrollmentId },

      data: {
        status: UpcomingClassEnrollmentStatus.PAID,

        paidAt: new Date(),

        expiresAt: null,
      },
    });
  }

  stampPackageEnrollmentEmailSent(id: string, sentAt: Date = new Date()) {
    return this.prisma.upcomingClassPackageEnrollment.update({
      where: { id },

      data: { customerEmailSentAt: sentAt },
    });
  }

  async markPackageEnrollmentExpired(id: string, childEnrollmentIds: string[]) {
    await this.prisma.upcomingClassPackageEnrollment.update({
      where: { id },

      data: { status: UpcomingClassEnrollmentStatus.EXPIRED },
    });

    for (const enrollmentId of childEnrollmentIds) {
      await this.prisma.upcomingClassEnrollment.update({
        where: { id: enrollmentId },

        data: { status: UpcomingClassEnrollmentStatus.EXPIRED },
      });
    }
  }

  findFixedEnrollmentByCheckoutSessionId(checkoutSessionId: string) {
    return this.prisma.upcomingFixedEventEnrollment.findUnique({
      where: { stripeCheckoutSessionId: checkoutSessionId },
    });
  }

  findFixedEnrollmentForCheckoutSession(sessionId: string) {
    return this.prisma.upcomingFixedEventEnrollment.findUnique({
      where: { stripeCheckoutSessionId: sessionId },

      include: FIXED_ENROLLMENT_WEBHOOK_INCLUDE,
    });
  }

  findFixedEnrollmentById(id: string) {
    return this.prisma.upcomingFixedEventEnrollment.findUnique({
      where: { id },

      include: FIXED_ENROLLMENT_WEBHOOK_INCLUDE,
    });
  }

  findFixedEnrollmentRecordById(id: string) {
    return this.prisma.upcomingFixedEventEnrollment.findUnique({
      where: { id },
    });
  }

  stampFixedEnrollmentEmailSent(id: string) {
    return this.prisma.upcomingFixedEventEnrollment.update({
      where: { id },

      data: { customerEmailSentAt: new Date() },
    });
  }

  stampFixedEnrollmentAdminNotifySent(id: string) {
    return this.prisma.upcomingFixedEventEnrollment.update({
      where: { id },

      data: { adminNotifySentAt: new Date() },
    });
  }

  markFixedEnrollmentExpired(id: string) {
    return this.prisma.upcomingFixedEventEnrollment.update({
      where: { id },

      data: { status: UpcomingClassEnrollmentStatus.EXPIRED },
    });
  }

  markFixedEnrollmentPaidWithoutTicket(
    id: string,

    data: {
      paymentIntentId: string | null;

      paymentMethodType: string | null;

      paymentMethodBrand: string | null;

      paymentMethodLast4: string | null;
    },
  ) {
    return this.prisma.upcomingFixedEventEnrollment.updateMany({
      where: {
        id,

        status: UpcomingClassEnrollmentStatus.PENDING_PAYMENT,
      },

      data: {
        status: UpcomingClassEnrollmentStatus.PAID,

        paidAt: new Date(),

        stripePaymentIntentId: data.paymentIntentId,

        expiresAt: null,

        paymentMethodType: data.paymentMethodType,

        paymentMethodBrand: data.paymentMethodBrand,

        paymentMethodLast4: data.paymentMethodLast4,
      },
    });
  }

  async finalizeFixedEnrollmentPayment<
    TEnrollment extends {
      id: string;

      eventId: string;

      ticketNumber: number | null;

      event: { eventType: { name: string } };
    },
  >(
    enrollment: TEnrollment,

    data: {
      paymentIntentId: string | null;

      paymentMethodType: string | null;

      paymentMethodBrand: string | null;

      paymentMethodLast4: string | null;

      fixedTicketCapacity: number | null;
    },
  ): Promise<(TEnrollment & { ticketNumber: number | null }) | null> {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.upcomingFixedEventEnrollment.findUnique({
        where: { id: enrollment.id },
      });

      if (!current) return null;

      if (current.status === UpcomingClassEnrollmentStatus.PAID) {
        return { ...enrollment, ticketNumber: current.ticketNumber };
      }

      if (current.status !== UpcomingClassEnrollmentStatus.PENDING_PAYMENT) {
        return null;
      }

      const updated = await tx.upcomingFixedEventEnrollment.updateMany({
        where: {
          id: enrollment.id,

          status: UpcomingClassEnrollmentStatus.PENDING_PAYMENT,
        },

        data: {
          status: UpcomingClassEnrollmentStatus.PAID,

          paidAt: new Date(),

          stripePaymentIntentId: data.paymentIntentId,

          expiresAt: null,

          paymentMethodType: data.paymentMethodType,

          paymentMethodBrand: data.paymentMethodBrand,

          paymentMethodLast4: data.paymentMethodLast4,
        },
      });

      if (updated.count === 0) return null;

      let ticketNumber: number | null = current.ticketNumber;

      if (ticketNumber == null) {
        ticketNumber = await assignFixedEventTicketNumber(
          tx,

          enrollment.eventId,

          enrollment.id,

          data.fixedTicketCapacity,
        );
      }

      return { ...enrollment, ticketNumber };
    });
  }

  findClassSessionById(id: string) {
    return this.prisma.upcomingClassSession.findUnique({ where: { id } });
  }

  findVenueConfigByEventId(eventId: string) {
    return this.prisma.upcomingVenueConfig.findUnique({ where: { eventId } });
  }

  countPaidClassEnrollmentsForSession(sessionId: string) {
    return this.prisma.upcomingClassEnrollment.count({
      where: {
        sessionId,

        status: UpcomingClassEnrollmentStatus.PAID,
      },
    });
  }

  async findPublicUpcomingBySlug(slug: string) {
    const normalized = slug.trim().toLowerCase();

    const event = await this.prisma.event.findFirst({
      where: {
        slug: normalized,

        publicSection: EventPublicSection.UPCOMING_EVENTS,

        isActive: true,
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

    if (!event?.slug) {
      throw new NotFoundException('Upcoming event not found.');
    }

    return event;
  }

  async findAdminUpcomingEventOrThrow(eventId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, publicSection: EventPublicSection.UPCOMING_EVENTS },

      include: { eventType: true },
    });

    if (!event) throw new NotFoundException('Upcoming event not found.');

    return event;
  }

  async batchSeatsRemaining(
    sessions: Array<{ id: string; capacity: number }>,
  ): Promise<Map<string, number>> {
    const counts = new Map<string, number>();

    if (sessions.length === 0) return counts;

    const now = new Date();

    const enrollments = await this.prisma.upcomingClassEnrollment.findMany({
      where: {
        sessionId: { in: sessions.map((s) => s.id) },

        OR: [
          { status: UpcomingClassEnrollmentStatus.PAID },

          {
            status: UpcomingClassEnrollmentStatus.PENDING_PAYMENT,

            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          },
        ],
      },

      select: { sessionId: true },
    });

    for (const row of enrollments) {
      counts.set(row.sessionId, (counts.get(row.sessionId) ?? 0) + 1);
    }

    return counts;
  }

  async seatsRemaining(sessionId: string, capacity: number) {
    const now = new Date();

    const blocking = await this.prisma.upcomingClassEnrollment.count({
      where: {
        sessionId,

        OR: [
          { status: UpcomingClassEnrollmentStatus.PAID },

          {
            status: UpcomingClassEnrollmentStatus.PENDING_PAYMENT,

            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          },
        ],
      },
    });

    return Math.max(0, capacity - blocking);
  }

  findVenueConfigWithTemplate(eventId: string) {
    return this.prisma.upcomingVenueConfig.findUnique({
      where: { eventId },

      include: {
        reservationEventTemplate: {
          include: {
            weekdays: { orderBy: { weekday: 'asc' } },

            classSections: {
              orderBy: [{ weekday: 'asc' }, { sortOrder: 'asc' }],
            },
          },
        },
      },
    });
  }

  findActiveClassSessionsForEvent(eventId: string, now: Date) {
    return this.prisma.upcomingClassSession.findMany({
      where: {
        eventId,

        isActive: true,

        endsAt: { gt: now },
      },

      include: { section: true },

      orderBy: [{ startsAt: 'asc' }, { sortOrder: 'asc' }],
    });
  }

  listActiveClassEventsWithVenueConfig() {
    return this.prisma.event.findMany({
      where: {
        publicSection: EventPublicSection.UPCOMING_EVENTS,
        isActive: true,
        experienceType: UpcomingExperienceType.CLASSES,
      },
      include: {
        eventType: true,
        venueConfig: {
          include: {
            reservationEventTemplate: {
              include: {
                weekdays: true,
                classSections: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  listActiveClassSessionSummariesForEvents(
    eventIds: string[],
    now: Date,
  ): Promise<Array<{ id: string; capacity: number; eventId: string }>> {
    if (eventIds.length === 0) {
      return Promise.resolve([]);
    }
    return this.prisma.upcomingClassSession.findMany({
      where: {
        eventId: { in: eventIds },
        isActive: true,
        endsAt: { gt: now },
      },
      select: { id: true, capacity: true, eventId: true },
    });
  }

  createClassEnrollment(
    data: Prisma.UpcomingClassEnrollmentUncheckedCreateInput,
  ): Promise<
    Prisma.UpcomingClassEnrollmentGetPayload<{
      include: typeof ADMIN_CLASS_ENROLLMENT_CREATE_INCLUDE;
    }>
  >;
  createClassEnrollment(
    data: Prisma.UpcomingClassEnrollmentUncheckedCreateInput,
    include: Prisma.UpcomingClassEnrollmentInclude,
  ): Promise<
    Prisma.UpcomingClassEnrollmentGetPayload<{
      include: Prisma.UpcomingClassEnrollmentInclude;
    }>
  >;
  createClassEnrollment(
    data: Prisma.UpcomingClassEnrollmentUncheckedCreateInput,
    include?: Prisma.UpcomingClassEnrollmentInclude,
  ): Promise<unknown> {
    if (include !== undefined) {
      return this.prisma.upcomingClassEnrollment.create({ data, include });
    }
    return this.prisma.upcomingClassEnrollment.create({
      data,
      include: ADMIN_CLASS_ENROLLMENT_CREATE_INCLUDE,
    });
  }

  createClassPackageEnrollment(
    data: Prisma.UpcomingClassPackageEnrollmentUncheckedCreateInput,
  ): Promise<{ id: string }>;
  createClassPackageEnrollment(
    data: Prisma.UpcomingClassPackageEnrollmentUncheckedCreateInput,
    include: typeof ADMIN_CLASS_PACKAGE_ENROLLMENT_INCLUDE,
  ): Promise<
    Prisma.UpcomingClassPackageEnrollmentGetPayload<{
      include: typeof ADMIN_CLASS_PACKAGE_ENROLLMENT_INCLUDE;
    }>
  >;
  createClassPackageEnrollment(
    data: Prisma.UpcomingClassPackageEnrollmentUncheckedCreateInput,
    include?: Prisma.UpcomingClassPackageEnrollmentInclude,
  ): Promise<unknown> {
    return this.prisma.upcomingClassPackageEnrollment.create({
      data,
      ...(include ? { include } : {}),
    });
  }

  createClassPackageEnrollmentItem(
    data: Prisma.UpcomingClassPackageEnrollmentItemUncheckedCreateInput,
  ) {
    return this.prisma.upcomingClassPackageEnrollmentItem.create({ data });
  }

  findPendingClassPackageEnrollmentByPayToken(payTokenHash: string) {
    return this.prisma.upcomingClassPackageEnrollment.findFirst({
      where: {
        payTokenHash,
        status: UpcomingClassEnrollmentStatus.PENDING_PAYMENT,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findPendingClassEnrollmentByPayToken(payTokenHash: string) {
    return this.prisma.upcomingClassEnrollment.findFirst({
      where: {
        payTokenHash,
        status: UpcomingClassEnrollmentStatus.PENDING_PAYMENT,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findClassPackageEnrollmentWithAdminItems(id: string) {
    return this.prisma.upcomingClassPackageEnrollment.findUnique({
      where: { id },
      include: ADMIN_CLASS_PACKAGE_ENROLLMENT_INCLUDE,
    });
  }

  findActiveClassSessionForEvent(sessionId: string, eventId: string) {
    return this.prisma.upcomingClassSession.findFirst({
      where: {
        id: sessionId,
        eventId,
        isActive: true,
      },
    });
  }

  findActiveClassSessionsByIdsForEvent(sessionIds: string[], eventId: string) {
    return this.prisma.upcomingClassSession.findMany({
      where: {
        id: { in: sessionIds },
        eventId,
        isActive: true,
      },
      include: { section: true },
    });
  }

  findVenueConfigForMonthPackage(eventId: string) {
    return this.prisma.upcomingVenueConfig.findUnique({
      where: { eventId },
      include: {
        reservationEventTemplate: {
          include: { weekdays: true },
        },
      },
    });
  }

  listBoxOfficeEligibleEvents() {
    return this.prisma.event.findMany({
      where: {
        publicSection: EventPublicSection.UPCOMING_EVENTS,
        isActive: true,
        OR: [
          { experienceType: UpcomingExperienceType.VENUE_SEATING },
          {
            venueConfig: {
              is: {
                clientEnabled: false,
                reservationEventTemplate: {
                  is: {
                    scheduleMode: ReservationEventScheduleMode.FIXED_EVENT,
                  },
                },
              },
            },
          },
        ],
      },
      include: {
        eventType: true,
        venueConfig: {
          include: { reservationEventTemplate: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  findActiveUpcomingEventWithVenueConfig(eventId: string) {
    return this.prisma.event.findFirst({
      where: {
        id: eventId,
        publicSection: EventPublicSection.UPCOMING_EVENTS,
        isActive: true,
      },
      include: {
        eventType: true,
        venueConfig: {
          include: { reservationEventTemplate: true },
        },
      },
    });
  }

  createPaidFixedEnrollmentWithTicket(
    data: Prisma.UpcomingFixedEventEnrollmentUncheckedCreateInput,
    eventId: string,
    capacity: number,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const created = await tx.upcomingFixedEventEnrollment.create({
        data,
        include: { event: { include: { eventType: true } } },
      });
      await assignFixedEventTicketNumber(tx, eventId, created.id, capacity);
      return tx.upcomingFixedEventEnrollment.findUniqueOrThrow({
        where: { id: created.id },
        include: { event: { include: { eventType: true } } },
      });
    });
  }

  createPendingFixedEventEnrollment(
    data: Prisma.UpcomingFixedEventEnrollmentUncheckedCreateInput,
  ) {
    return this.prisma.upcomingFixedEventEnrollment.create({ data });
  }

  listClassSessionsForAdmin(eventId: string) {
    return this.prisma.upcomingClassSession.findMany({
      where: { eventId },
      orderBy: [{ startsAt: 'asc' }, { sortOrder: 'asc' }],
    });
  }

  createClassSession(data: Prisma.UpcomingClassSessionUncheckedCreateInput) {
    return this.prisma.upcomingClassSession.create({ data });
  }

  findClassSessionForEvent(sessionId: string, eventId: string) {
    return this.prisma.upcomingClassSession.findFirst({
      where: { id: sessionId, eventId },
    });
  }

  updateClassSession(
    sessionId: string,
    data: Prisma.UpcomingClassSessionUpdateInput,
  ) {
    return this.prisma.upcomingClassSession.update({
      where: { id: sessionId },
      data,
    });
  }

  deleteClassSession(sessionId: string) {
    return this.prisma.upcomingClassSession.delete({
      where: { id: sessionId },
    });
  }

  findVenueConfigWithReservationTemplate(eventId: string) {
    return this.prisma.upcomingVenueConfig.findUnique({
      where: { eventId },
      include: { reservationEventTemplate: true },
    });
  }

  updateUpcomingEventExperience(
    eventId: string,
    data: Pick<Prisma.EventUpdateInput, 'experienceType' | 'classVariant'>,
  ) {
    return this.prisma.event.update({
      where: { id: eventId },
      data,
    });
  }

  upsertVenueConfigWithTemplate(
    eventId: string,
    create: Prisma.UpcomingVenueConfigUncheckedCreateInput,
    update: Prisma.UpcomingVenueConfigUncheckedUpdateInput,
  ) {
    return this.prisma.upcomingVenueConfig.upsert({
      where: { eventId },
      create,
      update,
      include: {
        reservationEventTemplate: {
          include: {
            weekdays: { orderBy: { weekday: 'asc' } },
            classSections: {
              orderBy: [{ weekday: 'asc' }, { sortOrder: 'asc' }],
            },
          },
        },
      },
    });
  }

  findVenueConfigRecord(eventId: string) {
    return this.prisma.upcomingVenueConfig.findUnique({ where: { eventId } });
  }
}
