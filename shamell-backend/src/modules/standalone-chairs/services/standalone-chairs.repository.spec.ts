import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service';
import { createPrismaMock } from '../../../testing';
import {
  makeChairConfig,
  makeChairRow,
  makeLayoutChairItem,
} from '../__mocks__/standalone-chairs.fixtures';
import { StandaloneChairsRepository } from './standalone-chairs.repository';

describe('StandaloneChairsRepository', () => {
  let repository: StandaloneChairsRepository;
  const prisma = createPrismaMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        StandaloneChairsRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    repository = moduleRef.get(StandaloneChairsRepository);
  });

  it('findActiveConfig and countActiveChairs', async () => {
    const config = makeChairConfig();
    prisma.venueStandaloneChairConfig.findFirst.mockResolvedValue(config);
    prisma.venueStandaloneChair.count.mockResolvedValue(2);
    await expect(repository.findActiveConfig()).resolves.toEqual(config);
    await expect(repository.countActiveChairs()).resolves.toBe(2);
  });

  it('updateChairUnitPrice and deleteChair', async () => {
    prisma.venueStandaloneChair.update.mockResolvedValue({});
    prisma.venueStandaloneChair.delete.mockResolvedValue({});
    await repository.updateChairUnitPrice('chair-1', 30);
    await repository.deleteChair('chair-1');
    expect(prisma.venueStandaloneChair.update).toHaveBeenCalled();
    expect(prisma.venueStandaloneChair.delete).toHaveBeenCalledWith({
      where: { id: 'chair-1' },
    });
  });

  it('maxSortOrder uses aggregate', async () => {
    prisma.venueStandaloneChair.aggregate.mockResolvedValue({
      _max: { sortOrder: 4 },
    });
    await expect(repository.maxSortOrder()).resolves.toBe(4);
  });

  it('cleanupDeletedChairReferencesFromLayout updates layout', async () => {
    prisma.venueFloorLayout.findFirst.mockResolvedValue({
      id: 'layout-1',
      items: [makeLayoutChairItem()],
    });
    prisma.venueFloorLayout.update.mockResolvedValue({});
    await repository.cleanupDeletedChairReferencesFromLayout(['chair-1']);
    expect(prisma.venueFloorLayout.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'layout-1' },
        data: { items: [] },
      }),
    );
  });

  it('createConfig and findActiveChairs', async () => {
    prisma.venueStandaloneChairConfig.create.mockResolvedValue({});
    prisma.venueStandaloneChair.findMany.mockResolvedValue([makeChairRow()]);
    await repository.createConfig(2, 25);
    await expect(repository.findActiveChairs()).resolves.toHaveLength(1);
  });
});
