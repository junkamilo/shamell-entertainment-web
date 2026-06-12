import type { PrismaService } from '../../prisma/prisma.service';

/** Keep seat reservations aligned when an upcoming event night is rescheduled. */
export async function syncVenueSeatReservationEventDates(
  prisma: Pick<PrismaService, 'venueSeatReservation'>,
  upcomingEventId: string,
  nextEventDate: Date,
): Promise<void> {
  await prisma.venueSeatReservation.updateMany({
    where: { upcomingEventId },
    data: { eventDate: nextEventDate },
  });
}
