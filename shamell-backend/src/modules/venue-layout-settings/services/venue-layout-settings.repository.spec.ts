import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service';
import { createPrismaMock } from '../../../testing';
import { makeVenueLayoutSettingsRow } from '../__mocks__/venue-layout-settings.fixtures';
import { VenueLayoutSettingsRepository } from './venue-layout-settings.repository';

describe('VenueLayoutSettingsRepository', () => {
  let repository: VenueLayoutSettingsRepository;
  const prisma = createPrismaMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        VenueLayoutSettingsRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    repository = moduleRef.get(VenueLayoutSettingsRepository);
  });

  it('findLatest orders by updatedAt desc', async () => {
    const row = makeVenueLayoutSettingsRow();
    prisma.venueLayoutClientSettings.findFirst.mockResolvedValue(row);
    await expect(repository.findLatest()).resolves.toEqual(row);
    expect(prisma.venueLayoutClientSettings.findFirst).toHaveBeenCalledWith({
      orderBy: { updatedAt: 'desc' },
    });
  });

  it('update writes by id', async () => {
    const row = makeVenueLayoutSettingsRow({ clientEnabled: false });
    prisma.venueLayoutClientSettings.update.mockResolvedValue(row);
    await expect(
      repository.update('settings-1', { clientEnabled: false }),
    ).resolves.toEqual(row);
    expect(prisma.venueLayoutClientSettings.update).toHaveBeenCalledWith({
      where: { id: 'settings-1' },
      data: { clientEnabled: false },
    });
  });
});
