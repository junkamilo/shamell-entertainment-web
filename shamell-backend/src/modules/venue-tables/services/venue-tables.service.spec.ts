import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { VenueTableSize } from '@prisma/client';
import { FloorLayoutService } from '../../floor-layout/services/floor-layout.service';
import { createVenueTablesRepositoryMock } from '../__mocks__/venue-tables.repository.mock';
import { makeVenueTableConfigRow } from '../__mocks__/venue-tables.fixtures';
import { VenueTablesRepository } from './venue-tables.repository';
import { VenueTablesService } from './venue-tables.service';

describe('VenueTablesService', () => {
  let service: VenueTablesService;
  const repository = createVenueTablesRepositoryMock();
  const floorLayout = {
    isTablePlacedOnLayout: jest.fn().mockResolvedValue(false),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    floorLayout.isTablePlacedOnLayout.mockResolvedValue(false);
    const moduleRef = await Test.createTestingModule({
      providers: [
        VenueTablesService,
        { provide: VenueTablesRepository, useValue: repository },
        { provide: FloorLayoutService, useValue: floorLayout },
      ],
    }).compile();
    service = moduleRef.get(VenueTablesService);
  });

  it('createAdminVenueTable rejects invalid includedChairs', async () => {
    await expect(
      service.createAdminVenueTable({
        size: VenueTableSize.LARGE,
        includedChairs: 99,
        bundlePrice: 100,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('deleteAdminVenueTable blocks when table is on floor plan', async () => {
    repository.findById.mockResolvedValue(makeVenueTableConfigRow());
    floorLayout.isTablePlacedOnLayout.mockResolvedValue(true);
    await expect(
      service.deleteAdminVenueTable('table-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.update).not.toHaveBeenCalled();
  });
});
