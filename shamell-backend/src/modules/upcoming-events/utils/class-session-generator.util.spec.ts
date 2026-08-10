import { BadRequestException } from '@nestjs/common';
import {
  Prisma,
  type PrismaClient,
  ReservationEventScheduleMode,
} from '@prisma/client';
import { regenerateClassSessionsForEvent } from './class-session-generator.util';

type GeneratorPrismaMock = {
  upcomingVenueConfig: {
    findUnique: jest.Mock;
  };
  event: {
    findUnique: jest.Mock;
  };
  reservationEventClassSection: {
    findMany: jest.Mock;
    findFirst: jest.Mock;
  };
  upcomingClassSession: {
    findFirst: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    findMany: jest.Mock;
    updateMany: jest.Mock;
  };
  upcomingClassEnrollment: {
    count: jest.Mock;
  };
  $transaction: jest.Mock;
};

function asPrismaClient(mock: GeneratorPrismaMock): PrismaClient {
  return mock as unknown as PrismaClient;
}

function makeSection(overrides: Record<string, unknown> = {}) {
  return {
    id: 'section-1',
    weekday: 1,
    startTime: '10:00',
    endTime: '12:00',
    sortOrder: 0,
    defaultCapacity: 20,
    defaultPrice: new Prisma.Decimal(50),
    ...overrides,
  };
}

function makeTemplateConfig(
  overrides: {
    weekdays?: Array<{ weekday: number; isActive: boolean }>;
    templateExtras?: Record<string, unknown>;
  } = {},
) {
  return {
    reservationEventTemplateId: 'template-1',
    reservationEventTemplate: {
      id: 'template-1',
      timezone: 'America/New_York',
      scheduleMode: ReservationEventScheduleMode.RECURRING_WEEKLY,
      recurringEffectiveFrom: new Date('2020-01-01T00:00:00.000Z'),
      recurringStartTime: '10:00',
      recurringEndTime: '12:00',
      weekdays: overrides.weekdays ?? [
        { weekday: 0, isActive: true },
        { weekday: 1, isActive: true },
        { weekday: 2, isActive: true },
        { weekday: 3, isActive: true },
        { weekday: 4, isActive: true },
        { weekday: 5, isActive: true },
        { weekday: 6, isActive: true },
      ],
      ...overrides.templateExtras,
    },
  };
}

function createGeneratorPrismaMock(): {
  prisma: GeneratorPrismaMock;
  section: ReturnType<typeof makeSection>;
} {
  const section = makeSection();
  const prisma: GeneratorPrismaMock = {
    upcomingVenueConfig: {
      findUnique: jest.fn(),
    },
    event: {
      findUnique: jest.fn().mockResolvedValue({ id: 'event-1' }),
    },
    reservationEventClassSection: {
      findMany: jest.fn().mockResolvedValue([section]),
      findFirst: jest.fn().mockResolvedValue(section),
    },
    upcomingClassSession: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'sess-new' }),
      update: jest.fn().mockResolvedValue({ id: 'sess-existing' }),
      findMany: jest.fn().mockResolvedValue([]),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    upcomingClassEnrollment: {
      count: jest.fn().mockResolvedValue(0),
    },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation(
    (fn: (tx: GeneratorPrismaMock) => Promise<unknown>) => fn(prisma),
  );
  return { prisma, section };
}

describe('regenerateClassSessionsForEvent', () => {
  it('returns zeros when event has no linked template', async () => {
    const prisma = asPrismaClient({
      upcomingVenueConfig: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ reservationEventTemplateId: null }),
      },
      event: { findUnique: jest.fn() },
      reservationEventClassSection: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
      upcomingClassSession: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        updateMany: jest.fn(),
      },
      upcomingClassEnrollment: { count: jest.fn() },
      $transaction: jest.fn(),
    });

    await expect(
      regenerateClassSessionsForEvent(prisma, 'event-1'),
    ).resolves.toEqual({
      upserted: 0,
      deactivated: 0,
    });
  });

  it('upserts sessions for recurring template with active sections', async () => {
    const { prisma } = createGeneratorPrismaMock();
    prisma.upcomingVenueConfig.findUnique
      .mockResolvedValueOnce({ reservationEventTemplateId: 'template-1' })
      .mockResolvedValue(makeTemplateConfig());

    const result = await regenerateClassSessionsForEvent(
      asPrismaClient(prisma),
      'event-1',
    );

    expect(result.upserted).toBeGreaterThan(0);
    expect(prisma.upcomingClassSession.create).toHaveBeenCalled();
    expect(result.deactivated).toBe(0);
  });

  it('re-run updates existing sessions instead of only creating', async () => {
    const { prisma } = createGeneratorPrismaMock();
    prisma.upcomingVenueConfig.findUnique
      .mockResolvedValueOnce({ reservationEventTemplateId: 'template-1' })
      .mockResolvedValue(makeTemplateConfig());
    prisma.upcomingClassSession.findFirst.mockResolvedValue({
      id: 'sess-existing',
    });

    const result = await regenerateClassSessionsForEvent(
      asPrismaClient(prisma),
      'event-1',
    );

    expect(result.upserted).toBeGreaterThan(0);
    expect(prisma.upcomingClassSession.update).toHaveBeenCalled();
    expect(prisma.upcomingClassSession.create).not.toHaveBeenCalled();
  });

  it('deactivates orphan future sessions outside generated keys', async () => {
    const { prisma } = createGeneratorPrismaMock();
    prisma.upcomingVenueConfig.findUnique
      .mockResolvedValueOnce({ reservationEventTemplateId: 'template-1' })
      .mockResolvedValue(makeTemplateConfig());
    prisma.upcomingClassSession.findMany.mockResolvedValue([
      {
        id: 'orphan-1',
        sectionId: 'section-orphan',
        startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    ]);

    const result = await regenerateClassSessionsForEvent(
      asPrismaClient(prisma),
      'event-1',
    );

    expect(result.deactivated).toBeGreaterThan(0);
    expect(prisma.upcomingClassSession.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'orphan-1' },
        data: { isActive: false },
      }),
    );
  });

  it('throws when active weekdays have no class sections', async () => {
    const { prisma } = createGeneratorPrismaMock();
    prisma.upcomingVenueConfig.findUnique
      .mockResolvedValueOnce({ reservationEventTemplateId: 'template-1' })
      .mockResolvedValue(
        makeTemplateConfig({
          weekdays: [
            { weekday: 1, isActive: true },
            { weekday: 0, isActive: false },
            { weekday: 2, isActive: false },
            { weekday: 3, isActive: false },
            { weekday: 4, isActive: false },
            { weekday: 5, isActive: false },
            { weekday: 6, isActive: false },
          ],
        }),
      );
    prisma.reservationEventClassSection.findMany.mockResolvedValue([]);

    await expect(
      regenerateClassSessionsForEvent(asPrismaClient(prisma), 'event-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('skips days when resolveLiveSection finds inactive section', async () => {
    const { prisma } = createGeneratorPrismaMock();
    const listed = makeSection({ id: 'section-listed', weekday: 1 });
    prisma.upcomingVenueConfig.findUnique
      .mockResolvedValueOnce({ reservationEventTemplateId: 'template-1' })
      .mockResolvedValue(
        makeTemplateConfig({
          weekdays: [
            { weekday: 1, isActive: true },
            { weekday: 0, isActive: false },
            { weekday: 2, isActive: false },
            { weekday: 3, isActive: false },
            { weekday: 4, isActive: false },
            { weekday: 5, isActive: false },
            { weekday: 6, isActive: false },
          ],
        }),
      );
    prisma.reservationEventClassSection.findMany.mockResolvedValue([listed]);
    prisma.reservationEventClassSection.findFirst.mockResolvedValue(null);

    const result = await regenerateClassSessionsForEvent(
      asPrismaClient(prisma),
      'event-1',
    );

    expect(result.upserted).toBe(0);
    expect(prisma.upcomingClassSession.create).not.toHaveBeenCalled();
  });

  it('retries once on Prisma P2003 FK error', async () => {
    const { prisma } = createGeneratorPrismaMock();
    prisma.upcomingVenueConfig.findUnique
      .mockResolvedValueOnce({ reservationEventTemplateId: 'template-1' })
      .mockResolvedValue(makeTemplateConfig());

    const fkError = new Prisma.PrismaClientKnownRequestError('FK', {
      code: 'P2003',
      clientVersion: 'test',
    });
    prisma.$transaction
      .mockRejectedValueOnce(fkError)
      .mockImplementationOnce(
        (fn: (tx: GeneratorPrismaMock) => Promise<unknown>) => fn(prisma),
      );

    const result = await regenerateClassSessionsForEvent(
      asPrismaClient(prisma),
      'event-1',
    );

    expect(result.upserted).toBeGreaterThan(0);
    expect(prisma.$transaction).toHaveBeenCalledTimes(2);
  });
});
