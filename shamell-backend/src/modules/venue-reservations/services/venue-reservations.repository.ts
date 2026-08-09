import { Injectable } from '@nestjs/common';
import { Prisma, VenueSeatReservationStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class VenueReservationsRepository {
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

  findReservationById(id: string) {
    return this.prisma.venueSeatReservation.findUnique({ where: { id } });
  }

  findReservationByCheckoutSessionId(checkoutSessionId: string) {
    return this.prisma.venueSeatReservation.findUnique({
      where: { stripeCheckoutSessionId: checkoutSessionId },
    });
  }

  findReservationByPayTokenHash(payTokenHash: string) {
    return this.prisma.venueSeatReservation.findFirst({
      where: { payTokenHash },
    });
  }

  updateReservation(id: string, data: Prisma.VenueSeatReservationUpdateInput) {
    return this.prisma.venueSeatReservation.update({ where: { id }, data });
  }

  createReservation(data: Prisma.VenueSeatReservationUncheckedCreateInput) {
    return this.prisma.venueSeatReservation.create({ data });
  }

  countReservations(where: Prisma.VenueSeatReservationWhereInput) {
    return this.prisma.venueSeatReservation.count({ where });
  }

  findManyReservations(args: Prisma.VenueSeatReservationFindManyArgs) {
    return this.prisma.venueSeatReservation.findMany(args);
  }

  findPaidReservationsForEvent(upcomingEventId: string) {
    return this.prisma.venueSeatReservation.findMany({
      where: {
        upcomingEventId,
        status: VenueSeatReservationStatus.PAID,
      },
    });
  }

  findVenueConfigByEventId(eventId: string) {
    return this.prisma.upcomingVenueConfig.findUnique({ where: { eventId } });
  }
}
