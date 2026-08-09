import { Test } from '@nestjs/testing';
import { ReservationEventScheduleMode } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { createPrismaMock } from '../../../testing';
import {
  makeTemplateRow,
  makeValidatedFixedPayload,
} from '../__mocks__/reservation-event-templates.fixtures';
import { ReservationEventTemplatesRepository } from './reservation-event-templates.repository';

describe('ReservationEventTemplatesRepository', () => {
  let repository: ReservationEventTemplatesRepository;
  const prisma = createPrismaMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        ReservationEventTemplatesRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    repository = moduleRef.get(ReservationEventTemplatesRepository);
  });

  it('findManyAdmin filters by scheduleMode', async () => {
    const row = makeTemplateRow();
    prisma.reservationEventTemplate.findMany.mockResolvedValue([row]);
    await expect(
      repository.findManyAdmin(ReservationEventScheduleMode.FIXED_EVENT),
    ).resolves.toEqual([row]);
    expect(prisma.reservationEventTemplate.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { scheduleMode: ReservationEventScheduleMode.FIXED_EVENT },
      }),
    );
  });

  it('findById returns template', async () => {
    const row = makeTemplateRow();
    prisma.reservationEventTemplate.findUnique.mockResolvedValue(row);
    await expect(repository.findById('tmpl-1')).resolves.toEqual(row);
  });

  it('replaceClassSections upserts and deletes stale keys', async () => {
    const tx = {
      reservationEventClassSection: {
        upsert: jest.fn().mockResolvedValue({}),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };
    const sections = makeValidatedFixedPayload().classSections;
    sections.push({
      weekday: 1,
      label: 'A',
      startTime: '18:00',
      endTime: '19:00',
      sortOrder: 0,
      defaultCapacity: 10,
      defaultPrice: 20,
      isActive: true,
    });

    await repository.replaceClassSections(tx as never, 'tmpl-1', sections);

    expect(tx.reservationEventClassSection.upsert).toHaveBeenCalled();
    const deleteCalls = tx.reservationEventClassSection.deleteMany.mock
      .calls as Array<[{ where: { templateId: string } }]>;
    expect(deleteCalls[0][0].where.templateId).toBe('tmpl-1');
  });

  it('replaceClassSections clears all when empty', async () => {
    const tx = {
      reservationEventClassSection: {
        upsert: jest.fn(),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };
    await repository.replaceClassSections(tx as never, 'tmpl-1', []);
    expect(tx.reservationEventClassSection.upsert).not.toHaveBeenCalled();
    expect(tx.reservationEventClassSection.deleteMany).toHaveBeenCalledWith({
      where: { templateId: 'tmpl-1' },
    });
  });

  it('countLinkedVenueConfigs and deleteTemplate', async () => {
    prisma.upcomingVenueConfig.count.mockResolvedValue(2);
    await expect(repository.countLinkedVenueConfigs('tmpl-1')).resolves.toBe(2);
    prisma.reservationEventTemplate.delete.mockResolvedValue({});
    await repository.deleteTemplate('tmpl-1');
    expect(prisma.reservationEventTemplate.delete).toHaveBeenCalledWith({
      where: { id: 'tmpl-1' },
    });
  });
});
