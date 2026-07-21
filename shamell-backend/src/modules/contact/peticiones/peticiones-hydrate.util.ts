import { buildPaginationMeta } from '../../../common/pagination/pagination.util';
import { PrismaService } from '../../../prisma/prisma.service';
import { feedInclude } from '../../bookings/booking-includes';

export type PeticionesFeedRow = {
  origin: 'CONTACT' | 'BOOKING_ADMIN';
  id: string;
  created_at: Date;
};

export async function hydratePeticionesPage(
  prisma: PrismaService,
  feedRows: PeticionesFeedRow[],
  page: number,
  perPage: number,
  totalItems: number,
) {
  const contactIds = feedRows
    .filter((r) => r.origin === 'CONTACT')
    .map((r) => r.id);
  const bookingIds = feedRows
    .filter((r) => r.origin === 'BOOKING_ADMIN')
    .map((r) => r.id);

  const [contactRows, bookingRows] = await Promise.all([
    prisma.contactRequest.findMany({
      where: { id: { in: contactIds } },
      include: { _count: { select: { bookings: true } } },
    }),
    prisma.booking.findMany({
      where: { id: { in: bookingIds } },
      include: feedInclude,
    }),
  ]);

  const linkedContactIds = [
    ...new Set(
      bookingRows
        .map((b) => b.contactRequestId)
        .filter(
          (id): id is string => typeof id === 'string' && id.length > 0,
        ),
    ),
  ].filter((id) => !contactIds.includes(id));

  const linkedContactRows =
    linkedContactIds.length > 0
      ? await prisma.contactRequest.findMany({
          where: { id: { in: linkedContactIds } },
        })
      : [];

  const contactById = new Map(
    [...contactRows, ...linkedContactRows].map((row) => [row.id, row]),
  );
  const hasLinkedBookingByContactId = new Map(
    contactRows.map((row) => [row.id, row._count.bookings > 0]),
  );
  const bookingById = new Map(bookingRows.map((row) => [row.id, row]));
  const pageItems = feedRows
    .map((row) => {
      if (row.origin === 'CONTACT') {
        const contact = contactById.get(row.id);
        if (!contact) return null;
        return {
          origin: 'CONTACT' as const,
          id: contact.id,
          createdAt: contact.createdAt,
          state: contact.status,
          hasLinkedBooking:
            hasLinkedBookingByContactId.get(contact.id) ?? false,
          contact,
        };
      }
      const booking = bookingById.get(row.id);
      if (!booking) return null;
      const linkedContact = booking.contactRequestId
        ? (contactById.get(booking.contactRequestId) ?? null)
        : null;
      return {
        origin: 'BOOKING_ADMIN' as const,
        id: booking.id,
        createdAt: booking.createdAt,
        status: booking.status,
        booking,
        ...(linkedContact ? { linkedContact } : {}),
      };
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  return {
    items: pageItems,
    meta: buildPaginationMeta({ page, perPage, totalItems }),
  };
}
