import { Test } from '@nestjs/testing';
import { VenueTableSize } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { createPrismaMock } from '../../../testing';
import { makeVenueTableConfigRow } from '../__mocks__/venue-tables.fixtures';
import { VenueTablesRepository } from './venue-tables.repository';

describe('VenueTablesRepository', () => {
  let repository: VenueTablesRepository;
  const prisma = createPrismaMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        VenueTablesRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    repository = moduleRef.get(VenueTablesRepository);
  });

  it('asPrisma returns injected client', () => {
    expect(repository.asPrisma()).toBe(prisma);
  });

  it('findActiveTables filters isActive', async () => {
    const rows = [makeVenueTableConfigRow()];
    prisma.venueTableConfig.findMany.mockResolvedValue(rows);
    await expect(repository.findActiveTables()).resolves.toEqual(rows);
    expect(prisma.venueTableConfig.findMany).toHaveBeenCalledWith({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { tableName: 'asc' }],
    });
  });

  it('updateManyActiveBySize updates bundle price', async () => {
    prisma.venueTableConfig.updateMany.mockResolvedValue({ count: 3 });
    await expect(
      repository.updateManyActiveBySize(VenueTableSize.LARGE, 200),
    ).resolves.toEqual({ count: 3 });
    expect(prisma.venueTableConfig.updateMany).toHaveBeenCalledWith({
      where: { isActive: true, size: VenueTableSize.LARGE },
      data: { bundlePrice: 200 },
    });
  });
});
