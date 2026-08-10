import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AvailabilityClosureKind } from '@prisma/client';
import {
  makeClosureDto,
  makeClosurePrismaRow,
  makeWeeklyPrismaRow,
  makeWeeklySlotsDto,
} from '../__mocks__/availability.fixtures';
import type { AvailabilityRepositoryMock } from '../__mocks__/availability.repository.mock';
import { createAvailabilityServiceTestModule } from '../testing/availability-service.test-module';
import type { AvailabilityService } from './availability.service';

describe('AvailabilityService', () => {
  let service: AvailabilityService;
  let repository: AvailabilityRepositoryMock;
  let config: { get: jest.Mock };

  beforeEach(async () => {
    const harness = await createAvailabilityServiceTestModule();
    service = harness.service;
    repository = harness.repository;
    config = harness.config;
  });

  it('bookingTimeZone defaults to America/New_York', () => {
    expect(service.bookingTimeZone()).toBe('America/New_York');
  });

  it('bookingTimeZone reads BOOKING_TZ from config', () => {
    config.get.mockImplementation((key: string) =>
      key === 'BOOKING_TZ' ? 'America/Los_Angeles' : undefined,
    );
    expect(service.bookingTimeZone()).toBe('America/Los_Angeles');
  });

  it('getPublicRules projects without ids', async () => {
    repository.findWeeklySlots.mockResolvedValue([makeWeeklyPrismaRow()]);
    repository.findClosures.mockResolvedValue([makeClosurePrismaRow()]);
    const rules = await service.getPublicRules();
    expect(rules.weekly[0]).not.toHaveProperty('id');
    expect(rules.closures[0]).not.toHaveProperty('id');
    expect(rules.closures[0].date).toBe('2026-07-15');
  });

  it('getAdminSnapshot includes ids', async () => {
    repository.findWeeklySlots.mockResolvedValue([makeWeeklyPrismaRow()]);
    repository.findClosures.mockResolvedValue([makeClosurePrismaRow()]);
    const snap = await service.getAdminSnapshot();
    expect(snap.weekly[0].id).toBe('w-1');
    expect(snap.closures[0].id).toBe('c-1');
  });

  it('putWeeklySlots validates then upserts', async () => {
    repository.findWeeklySlots.mockResolvedValue([]);
    repository.findClosures.mockResolvedValue([]);
    await service.putWeeklySlots(makeWeeklySlotsDto());
    expect(repository.upsertAllWeeklySlots).toHaveBeenCalled();
  });

  it('putWeeklySlots invalid weekday set BadRequest', async () => {
    await expect(
      service.putWeeklySlots({
        slots: [
          {
            weekday: 0,
            isClosed: false,
            startTime: '09:00',
            endTime: '21:00',
          },
          {
            weekday: 0,
            isClosed: false,
            startTime: '09:00',
            endTime: '21:00',
          },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.upsertAllWeeklySlots).not.toHaveBeenCalled();
  });

  it('createClosure SPECIFIC_DATE requires date', async () => {
    await expect(
      service.createClosure({
        kind: AvailabilityClosureKind.SPECIFIC_DATE,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('createClosure SPECIFIC_DATE delegates', async () => {
    repository.createClosure.mockResolvedValue(makeClosurePrismaRow());
    await service.createClosure(makeClosureDto());
    expect(repository.createClosure).toHaveBeenCalled();
  });

  it('createClosure DATE_RANGE happy path', async () => {
    const row = makeClosurePrismaRow({
      kind: AvailabilityClosureKind.DATE_RANGE,
      date: null,
      startDate: new Date('2026-07-10T12:00:00.000Z'),
      endDate: new Date('2026-07-20T12:00:00.000Z'),
    });
    repository.createClosure.mockResolvedValue(row);
    const result = await service.createClosure(
      makeClosureDto({
        kind: AvailabilityClosureKind.DATE_RANGE,
        date: undefined,
        startDate: '2026-07-10',
        endDate: '2026-07-20',
      }),
    );
    expect(result).toEqual(row);
    expect(repository.createClosure).toHaveBeenCalledTimes(1);
    const [[payload]] = repository.createClosure.mock.calls as [
      [
        {
          kind: AvailabilityClosureKind;
          startDate: Date;
          endDate: Date;
        },
      ],
    ];
    expect(payload.kind).toBe(AvailabilityClosureKind.DATE_RANGE);
    expect(payload.startDate.toISOString()).toBe('2026-07-10T12:00:00.000Z');
    expect(payload.endDate.toISOString()).toBe('2026-07-20T12:00:00.000Z');
  });

  it('createClosure DATE_RANGE end < start BadRequest', async () => {
    await expect(
      service.createClosure(
        makeClosureDto({
          kind: AvailabilityClosureKind.DATE_RANGE,
          date: undefined,
          startDate: '2026-07-20',
          endDate: '2026-07-10',
        }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.createClosure).not.toHaveBeenCalled();
  });

  it('createClosure RECURRING_WEEKDAY happy path', async () => {
    const row = makeClosurePrismaRow({
      kind: AvailabilityClosureKind.RECURRING_WEEKDAY,
      date: null,
      weekday: 3,
    });
    repository.createClosure.mockResolvedValue(row);
    const result = await service.createClosure(
      makeClosureDto({
        kind: AvailabilityClosureKind.RECURRING_WEEKDAY,
        date: undefined,
        weekday: 3,
      }),
    );
    expect(result).toEqual(row);
    expect(repository.createClosure).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: AvailabilityClosureKind.RECURRING_WEEKDAY,
        weekday: 3,
      }),
    );
  });

  it('createClosure RECURRING_WEEKDAY missing weekday BadRequest', async () => {
    await expect(
      service.createClosure({
        kind: AvailabilityClosureKind.RECURRING_WEEKDAY,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.createClosure).not.toHaveBeenCalled();
  });

  it('removeClosure NotFound when repository delete fails', async () => {
    repository.deleteClosure.mockRejectedValue(new Error('missing'));
    await expect(service.removeClosure('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('removeClosure returns ok when delete succeeds', async () => {
    repository.deleteClosure.mockResolvedValue(undefined);
    await expect(service.removeClosure('c-1')).resolves.toEqual({ ok: true });
  });

  it('assertDateTimeAllowed rejects closed by SPECIFIC_DATE hit', async () => {
    repository.findBlockingClosure.mockResolvedValue({ id: 'c-1' });
    await expect(
      service.assertDateTimeAllowed(new Date('2026-07-15T16:00:00.000Z')),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('assertDateTimeAllowed rejects closed weekday slot', async () => {
    repository.findBlockingClosure.mockResolvedValue(null);
    repository.findWeeklySlotByWeekday.mockResolvedValue(
      makeWeeklyPrismaRow({ isClosed: true }),
    );
    await expect(
      service.assertDateTimeAllowed(new Date('2026-07-15T16:00:00.000Z')),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('assertDateTimeAllowed outside open window BadRequest', async () => {
    repository.findBlockingClosure.mockResolvedValue(null);
    repository.findWeeklySlotByWeekday.mockResolvedValue(
      makeWeeklyPrismaRow({
        isClosed: false,
        startTime: '09:00',
        endTime: '21:00',
      }),
    );
    // 2026-07-15T10:00Z = 06:00 America/New_York — before 09:00
    await expect(
      service.assertDateTimeAllowed(new Date('2026-07-15T10:00:00.000Z')),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('assertDateTimeAllowed allows missing weekly slot', async () => {
    repository.findBlockingClosure.mockResolvedValue(null);
    repository.findWeeklySlotByWeekday.mockResolvedValue(null);
    await expect(
      service.assertDateTimeAllowed(new Date('2026-07-15T16:00:00.000Z')),
    ).resolves.toBeUndefined();
  });

  it('assertDateTimeAllowed allows time inside open window', async () => {
    repository.findBlockingClosure.mockResolvedValue(null);
    repository.findWeeklySlotByWeekday.mockResolvedValue(
      makeWeeklyPrismaRow({
        isClosed: false,
        startTime: '09:00',
        endTime: '21:00',
      }),
    );
    // 2026-07-15T16:00Z = 12:00 America/New_York
    await expect(
      service.assertDateTimeAllowed(new Date('2026-07-15T16:00:00.000Z')),
    ).resolves.toBeUndefined();
  });
});
