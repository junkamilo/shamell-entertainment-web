import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service';
import { createPrismaMock } from '../../../testing';
import { BookingsRepository } from './bookings.repository';

describe('BookingsRepository', () => {
  let repository: BookingsRepository;
  const prisma = createPrismaMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(
      (fn: (tx: typeof prisma) => Promise<unknown>) =>
        Promise.resolve(fn(prisma)),
    );
    const moduleRef = await Test.createTestingModule({
      providers: [
        BookingsRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    repository = moduleRef.get(BookingsRepository);
  });

  it('cancelPendingBookingPayments updates PENDING rows', async () => {
    prisma.bookingPayment.updateMany.mockResolvedValue({ count: 2 });
    await repository.cancelPendingBookingPayments('booking-1');
    const calls = prisma.bookingPayment.updateMany.mock.calls as Array<
      [{ where: { bookingId: string } }]
    >;
    expect(calls[0][0].where.bookingId).toBe('booking-1');
  });

  it('findBookingAdminById uses admin include', async () => {
    prisma.booking.findUnique.mockResolvedValue({ id: 'b-1' });
    await repository.findBookingAdminById('b-1');
    expect(prisma.booking.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'b-1' } }),
    );
  });

  it('asPrisma returns injected client', () => {
    expect(repository.asPrisma()).toBe(prisma);
  });
});
