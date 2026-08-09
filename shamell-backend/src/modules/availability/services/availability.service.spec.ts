import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AvailabilityClosureKind } from '@prisma/client';
import { Test } from '@nestjs/testing';
import { createAvailabilityRepositoryMock } from '../__mocks__/availability.repository.mock';
import {
  makeClosureDto,
  makeClosurePrismaRow,
  makeWeeklyPrismaRow,
  makeWeeklySlotsDto,
} from '../__mocks__/availability.fixtures';
import { AvailabilityRepository } from './availability.repository';
import { AvailabilityService } from './availability.service';

describe('AvailabilityService', () => {
  let service: AvailabilityService;
  const repository = createAvailabilityRepositoryMock();
  const config = {
    get: jest.fn().mockReturnValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    config.get.mockReturnValue(undefined);
    const moduleRef = await Test.createTestingModule({
      providers: [
        AvailabilityService,
        { provide: AvailabilityRepository, useValue: repository },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();
    service = moduleRef.get(AvailabilityService);
  });

  it('bookingTimeZone defaults to America/New_York', () => {
    expect(service.bookingTimeZone()).toBe('America/New_York');
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

  it('removeClosure maps missing to NotFound', async () => {
    repository.deleteClosure.mockRejectedValue(new Error('missing'));
    await expect(service.removeClosure('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('assertDateTimeAllowed rejects closed by closure', async () => {
    repository.findBlockingClosure.mockResolvedValue({ id: 'c-1' });
    await expect(
      service.assertDateTimeAllowed(new Date('2026-07-15T16:00:00.000Z')),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('assertDateTimeAllowed allows missing weekly slot', async () => {
    repository.findBlockingClosure.mockResolvedValue(null);
    repository.findWeeklySlotByWeekday.mockResolvedValue(null);
    await expect(
      service.assertDateTimeAllowed(new Date('2026-07-15T16:00:00.000Z')),
    ).resolves.toBeUndefined();
  });

  it('assertDateTimeAllowed rejects closed weekly slot', async () => {
    repository.findBlockingClosure.mockResolvedValue(null);
    repository.findWeeklySlotByWeekday.mockResolvedValue(
      makeWeeklyPrismaRow({ isClosed: true }),
    );
    await expect(
      service.assertDateTimeAllowed(new Date('2026-07-15T16:00:00.000Z')),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
