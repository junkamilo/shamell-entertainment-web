import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service';
import { createPrismaMock } from '../../../testing';
import { AdminPaymentsRepository } from './admin-payments.repository';

describe('AdminPaymentsRepository', () => {
  let repository: AdminPaymentsRepository;
  const prisma = createPrismaMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AdminPaymentsRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    repository = moduleRef.get(AdminPaymentsRepository);
  });

  it('buildUnionParts returns empty when no flows', () => {
    expect(
      repository.buildUnionParts([], undefined, undefined, null, null),
    ).toEqual([]);
  });

  it('buildUnionParts includes booking quote SQL', () => {
    const parts = repository.buildUnionParts(
      ['BOOKING_QUOTE'],
      'PAID',
      'ada',
      null,
      null,
    );
    expect(parts).toHaveLength(1);
    expect(Array.isArray(parts[0].strings)).toBe(true);
    expect(Array.isArray(parts[0].values)).toBe(true);
  });

  it('countUnion returns 0 for empty parts', async () => {
    await expect(repository.countUnion([])).resolves.toBe(0);
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });

  it('countUnion and listKeys call $queryRaw', async () => {
    const parts = repository.buildUnionParts(
      ['VENUE_SEAT'],
      undefined,
      undefined,
      null,
      null,
    );
    prisma.$queryRaw.mockResolvedValueOnce([{ total: 2n }]);
    await expect(repository.countUnion(parts)).resolves.toBe(2);

    prisma.$queryRaw.mockResolvedValueOnce([
      { flow: 'VENUE_SEAT', id: 'vsr-1', updated_at: new Date() },
    ]);
    const keys = await repository.listKeys(parts, 0, 20);
    expect(keys).toHaveLength(1);
    expect(prisma.$queryRaw).toHaveBeenCalled();
  });

  it('findBookingPaymentsByIds skips empty ids', async () => {
    await expect(repository.findBookingPaymentsByIds([])).resolves.toEqual([]);
    expect(prisma.bookingPayment.findMany).not.toHaveBeenCalled();
  });

  it('findBookingPaymentsByIds hydrates with include', async () => {
    prisma.bookingPayment.findMany.mockResolvedValue([{ id: 'bp-1' }]);
    await repository.findBookingPaymentsByIds(['bp-1']);
    expect(prisma.bookingPayment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: ['bp-1'] } },
      }),
    );
  });

  it('countBadgeSince aggregates terminal counts', async () => {
    prisma.bookingPayment.count.mockResolvedValue(1);
    prisma.venueSeatReservation.count.mockResolvedValue(2);
    prisma.upcomingClassEnrollment.count.mockResolvedValue(3);
    prisma.upcomingFixedEventEnrollment.count.mockResolvedValue(4);
    const since = new Date('2026-07-01T00:00:00.000Z');
    await expect(repository.countBadgeSince(since)).resolves.toBe(10);
  });
});
