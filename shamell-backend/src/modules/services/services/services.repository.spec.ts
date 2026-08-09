import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service';
import { createPrismaMock } from '../../../testing';
import {
  makeServiceType,
  makeServiceWithType,
} from '../__mocks__/services.fixtures';
import { ServicesRepository } from './services.repository';

describe('ServicesRepository', () => {
  let repository: ServicesRepository;
  const prisma = createPrismaMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        ServicesRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    repository = moduleRef.get(ServicesRepository);
  });

  it('findActiveServicesWithType queries active services', async () => {
    const row = makeServiceWithType();
    prisma.service.findMany.mockResolvedValue([row]);
    await expect(repository.findActiveServicesWithType()).resolves.toEqual([
      row,
    ]);
    expect(prisma.service.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isActive: true } }),
    );
  });

  it('createService and updateService', async () => {
    const row = makeServiceWithType();
    prisma.service.create.mockResolvedValue(row);
    await expect(
      repository.createService({
        serviceTypeId: 'stype-1',
        description: 'Desc',
        items: ['A'],
        imageUrl: 'https://cdn.example/x.jpg',
      }),
    ).resolves.toEqual(row);

    prisma.service.update.mockResolvedValue(row);
    await expect(
      repository.updateService('svc-1', { description: 'Updated' }),
    ).resolves.toEqual(row);
  });

  it('service type CRUD helpers', async () => {
    const type = makeServiceType();
    prisma.serviceType.create.mockResolvedValue(type);
    await expect(repository.createServiceType('VIP Event')).resolves.toEqual(
      type,
    );

    prisma.serviceType.findUnique.mockResolvedValue({
      id: 'stype-1',
      isActive: true,
    });
    await expect(
      repository.findServiceTypeIdActive('stype-1'),
    ).resolves.toEqual({ id: 'stype-1', isActive: true });
  });

  it('count guards', async () => {
    prisma.booking.count.mockResolvedValue(2);
    prisma.galleryPhoto.count.mockResolvedValue(1);
    prisma.service.count.mockResolvedValue(3);
    await expect(repository.countBookingsByServiceId('svc-1')).resolves.toBe(2);
    await expect(repository.countGalleryByServiceId('svc-1')).resolves.toBe(1);
    await expect(repository.countServicesByTypeId('stype-1')).resolves.toBe(3);
  });
});
