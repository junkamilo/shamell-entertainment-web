/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/require-await */
import { NotFoundException } from '@nestjs/common';

import {
  EventPublicSection,
  UpcomingClassEnrollmentStatus,
} from '@prisma/client';

export function createUpcomingEventsRepositoryMock() {
  const mock = {
    asPrisma: jest.fn(),

    runTransaction: jest.fn(),

    findClassEnrollmentByCheckoutSessionId: jest.fn(),

    findClassEnrollmentForCheckoutSession: jest.fn(),

    findClassEnrollmentForExpire: jest.fn(),

    markClassEnrollmentPaid: jest.fn(),

    stampClassEnrollmentEmailSent: jest.fn(),

    markClassEnrollmentExpired: jest.fn(),

    findPackageEnrollmentByCheckoutSessionId: jest.fn(),

    findPackageEnrollmentForCheckoutSession: jest.fn(),

    findPackageEnrollmentForExpire: jest.fn(),

    findPackageEnrollmentById: jest.fn(),

    markPackageEnrollmentPaid: jest.fn(),

    markPackageChildEnrollmentPaid: jest.fn(),

    stampPackageEnrollmentEmailSent: jest.fn(),

    markPackageEnrollmentExpired: jest.fn(),

    findFixedEnrollmentByCheckoutSessionId: jest.fn(),

    findFixedEnrollmentForCheckoutSession: jest.fn(),

    findFixedEnrollmentById: jest.fn(),

    findFixedEnrollmentRecordById: jest.fn(),

    stampFixedEnrollmentEmailSent: jest.fn(),

    stampFixedEnrollmentAdminNotifySent: jest.fn(),

    markFixedEnrollmentExpired: jest.fn(),

    markFixedEnrollmentPaidWithoutTicket: jest.fn(),

    finalizeFixedEnrollmentPayment: jest.fn(),

    findClassSessionById: jest.fn(),

    findVenueConfigByEventId: jest.fn(),

    countPaidClassEnrollmentsForSession: jest.fn().mockResolvedValue(0),

    findPublicUpcomingBySlug: jest.fn(async (slug: string) => {
      const prisma = mock.asPrisma();

      const normalized = slug.trim().toLowerCase();

      const event = await prisma.event.findFirst({
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
    }),

    findAdminUpcomingEventOrThrow: jest.fn(async (eventId: string) => {
      const prisma = mock.asPrisma();

      const event = await prisma.event.findFirst({
        where: {
          id: eventId,

          publicSection: EventPublicSection.UPCOMING_EVENTS,
        },

        include: { eventType: true },
      });

      if (!event) throw new NotFoundException('Upcoming event not found.');

      return event;
    }),

    batchSeatsRemaining: jest.fn(
      async (sessions: Array<{ id: string; capacity: number }>) => {
        const counts = new Map<string, number>();

        if (sessions.length === 0) return counts;

        const prisma = mock.asPrisma();

        const now = new Date();

        const enrollments = await prisma.upcomingClassEnrollment.findMany({
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

        for (const row of enrollments as Array<{ sessionId: string }>) {
          counts.set(row.sessionId, (counts.get(row.sessionId) ?? 0) + 1);
        }

        return counts;
      },
    ),

    seatsRemaining: jest.fn(async (sessionId: string, capacity: number) => {
      const prisma = mock.asPrisma();

      const now = new Date();

      const blocking = await prisma.upcomingClassEnrollment.count({
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
    }),

    findVenueConfigWithTemplate: jest.fn(async (eventId: string) => {
      const prisma = mock.asPrisma();

      return prisma.upcomingVenueConfig.findUnique({
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
    }),

    findActiveClassSessionsForEvent: jest.fn(
      async (eventId: string, now: Date) => {
        const prisma = mock.asPrisma();

        return prisma.upcomingClassSession.findMany({
          where: {
            eventId,

            isActive: true,

            endsAt: { gt: now },
          },

          include: { section: true },

          orderBy: [{ startsAt: 'asc' }, { sortOrder: 'asc' }],
        });
      },
    ),

    listActiveClassEventsWithVenueConfig: jest.fn(async () => {
      const prisma = mock.asPrisma();
      return prisma.event.findMany();
    }),

    listActiveClassSessionSummariesForEvents: jest.fn(
      async (eventIds: string[], now: Date) => {
        const prisma = mock.asPrisma();
        if (eventIds.length === 0) return [];
        return prisma.upcomingClassSession.findMany({
          where: {
            eventId: { in: eventIds },
            isActive: true,
            endsAt: { gt: now },
          },
          select: { id: true, capacity: true, eventId: true },
        });
      },
    ),

    createClassEnrollment: jest.fn(async (data, include) => {
      const prisma = mock.asPrisma();
      return prisma.upcomingClassEnrollment.create({ data, include });
    }),

    createClassPackageEnrollment: jest.fn(async (data, include) => {
      const prisma = mock.asPrisma();
      return prisma.upcomingClassPackageEnrollment.create({
        data,
        ...(include ? { include } : {}),
      });
    }),

    createClassPackageEnrollmentItem: jest.fn(async (data) => {
      const prisma = mock.asPrisma();
      return prisma.upcomingClassPackageEnrollmentItem.create({ data });
    }),

    findPendingClassPackageEnrollmentByPayToken: jest.fn(
      async (payTokenHash: string) => {
        const prisma = mock.asPrisma();
        return prisma.upcomingClassPackageEnrollment.findFirst({
          where: {
            payTokenHash,
            status: UpcomingClassEnrollmentStatus.PENDING_PAYMENT,
          },
          orderBy: { createdAt: 'desc' },
        });
      },
    ),

    findPendingClassEnrollmentByPayToken: jest.fn(
      async (payTokenHash: string) => {
        const prisma = mock.asPrisma();
        return prisma.upcomingClassEnrollment.findFirst({
          where: {
            payTokenHash,
            status: UpcomingClassEnrollmentStatus.PENDING_PAYMENT,
          },
          orderBy: { createdAt: 'desc' },
        });
      },
    ),

    findClassPackageEnrollmentWithAdminItems: jest.fn(async (id: string) => {
      const prisma = mock.asPrisma();
      return prisma.upcomingClassPackageEnrollment.findUnique({
        where: { id },
      });
    }),

    findActiveClassSessionForEvent: jest.fn(
      async (sessionId: string, eventId: string) => {
        const prisma = mock.asPrisma();
        return prisma.upcomingClassSession.findFirst({
          where: { id: sessionId, eventId, isActive: true },
        });
      },
    ),

    findActiveClassSessionsByIdsForEvent: jest.fn(
      async (sessionIds: string[], eventId: string) => {
        const prisma = mock.asPrisma();
        return prisma.upcomingClassSession.findMany({
          where: {
            id: { in: sessionIds },
            eventId,
            isActive: true,
          },
          include: { section: true },
        });
      },
    ),

    findVenueConfigForMonthPackage: jest.fn(async (eventId: string) => {
      const prisma = mock.asPrisma();
      return prisma.upcomingVenueConfig.findUnique({ where: { eventId } });
    }),

    listBoxOfficeEligibleEvents: jest.fn(async () => {
      const prisma = mock.asPrisma();
      return prisma.event.findMany();
    }),

    findActiveUpcomingEventWithVenueConfig: jest.fn(async (eventId: string) => {
      const prisma = mock.asPrisma();
      return prisma.event.findFirst({ where: { id: eventId } });
    }),

    createPaidFixedEnrollmentWithTicket: jest.fn(
      async (data, _eventId: string, _capacity: number) => {
        void _eventId;
        void _capacity;
        const prisma = mock.asPrisma();
        return prisma.$transaction(async (tx: typeof prisma) => {
          const created = await tx.upcomingFixedEventEnrollment.create({
            data,
            include: { event: { include: { eventType: true } } },
          });
          return tx.upcomingFixedEventEnrollment.findUniqueOrThrow({
            where: { id: created.id },
            include: { event: { include: { eventType: true } } },
          });
        });
      },
    ),

    createPendingFixedEventEnrollment: jest.fn(async (data) => {
      const prisma = mock.asPrisma();
      return prisma.upcomingFixedEventEnrollment.create({ data });
    }),

    listClassSessionsForAdmin: jest.fn(async (eventId: string) => {
      const prisma = mock.asPrisma();
      return prisma.upcomingClassSession.findMany({ where: { eventId } });
    }),

    createClassSession: jest.fn(async (data) => {
      const prisma = mock.asPrisma();
      return prisma.upcomingClassSession.create({ data });
    }),

    findClassSessionForEvent: jest.fn(
      async (sessionId: string, eventId: string) => {
        const prisma = mock.asPrisma();
        return prisma.upcomingClassSession.findFirst({
          where: { id: sessionId, eventId },
        });
      },
    ),

    updateClassSession: jest.fn(async (sessionId: string, data) => {
      const prisma = mock.asPrisma();
      return prisma.upcomingClassSession.update({
        where: { id: sessionId },
        data,
      });
    }),

    deleteClassSession: jest.fn(async (sessionId: string) => {
      const prisma = mock.asPrisma();
      return prisma.upcomingClassSession.delete({ where: { id: sessionId } });
    }),

    findVenueConfigWithReservationTemplate: jest.fn(async (eventId: string) => {
      const prisma = mock.asPrisma();
      return prisma.upcomingVenueConfig.findUnique({
        where: { eventId },
        include: { reservationEventTemplate: true },
      });
    }),

    updateUpcomingEventExperience: jest.fn(async (eventId: string, data) => {
      const prisma = mock.asPrisma();
      return prisma.event.update({ where: { id: eventId }, data });
    }),

    upsertVenueConfigWithTemplate: jest.fn(
      async (eventId: string, create, update) => {
        const prisma = mock.asPrisma();
        return prisma.upcomingVenueConfig.upsert({
          where: { eventId },
          create,
          update,
        });
      },
    ),

    findVenueConfigRecord: jest.fn(async (eventId: string) => {
      const prisma = mock.asPrisma();
      return prisma.upcomingVenueConfig.findUnique({ where: { eventId } });
    }),
  };

  return mock;
}

export type UpcomingEventsRepositoryMock = ReturnType<
  typeof createUpcomingEventsRepositoryMock
>;
