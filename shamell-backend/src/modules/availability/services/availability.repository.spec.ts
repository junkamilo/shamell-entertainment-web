import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service';
import { createPrismaMock } from '../../../testing';
import { AvailabilityRepository } from './availability.repository';

describe('AvailabilityRepository', () => {
  let repository: AvailabilityRepository;
  const prisma = createPrismaMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(async (ops: unknown) => {
      if (Array.isArray(ops)) {
        return Promise.all(ops);
      }
      if (typeof ops === 'function') {
        return (ops as (tx: typeof prisma) => Promise<unknown>)(prisma);
      }
      return undefined;
    });
    const moduleRef = await Test.createTestingModule({
      providers: [
        AvailabilityRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    repository = moduleRef.get(AvailabilityRepository);
  });

  it('findWeeklySlots orders by weekday', async () => {
    prisma.weeklyAvailabilitySlot.findMany.mockResolvedValue([]);
    await repository.findWeeklySlots();
    expect(prisma.weeklyAvailabilitySlot.findMany).toHaveBeenCalledWith({
      orderBy: { weekday: 'asc' },
    });
  });

  it('upsertAllWeeklySlots uses $transaction', async () => {
    prisma.weeklyAvailabilitySlot.upsert.mockResolvedValue({});
    await repository.upsertAllWeeklySlots([
      {
        weekday: 0,
        isClosed: false,
        startTime: '09:00',
        endTime: '17:00',
      },
    ]);
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.weeklyAvailabilitySlot.upsert).toHaveBeenCalled();
  });

  it('createClosure and deleteClosure delegate to prisma', async () => {
    prisma.availabilityClosure.create.mockResolvedValue({ id: 'c-1' });
    await repository.createClosure({
      kind: 'SPECIFIC_DATE',
      date: new Date('2026-07-15T12:00:00.000Z'),
    } as never);
    expect(prisma.availabilityClosure.create).toHaveBeenCalled();

    prisma.availabilityClosure.delete.mockResolvedValue({ id: 'c-1' });
    await repository.deleteClosure('c-1');
    expect(prisma.availabilityClosure.delete).toHaveBeenCalledWith({
      where: { id: 'c-1' },
    });
  });
});
