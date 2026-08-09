import { Injectable } from '@nestjs/common';
import { Prisma, UpcomingClassEnrollmentStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

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

  findPackageEnrollmentByCheckoutSessionId(checkoutSessionId: string) {
    return this.prisma.upcomingClassPackageEnrollment.findUnique({
      where: { stripeCheckoutSessionId: checkoutSessionId },
    });
  }

  findFixedEnrollmentByCheckoutSessionId(checkoutSessionId: string) {
    return this.prisma.upcomingFixedEventEnrollment.findUnique({
      where: { stripeCheckoutSessionId: checkoutSessionId },
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
}
