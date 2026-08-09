import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  makeMulterFile,
  makeServiceType,
  makeServiceWithType,
} from '../__mocks__/services.fixtures';
import { createServicesMediaServiceMock } from '../__mocks__/services-media.service.mock';
import { createServicesRepositoryMock } from '../__mocks__/services.repository.mock';
import { ServicesMediaService } from './services-media.service';
import { ServicesRepository } from './services.repository';
import { ServicesService } from './services.service';

describe('ServicesService', () => {
  let service: ServicesService;
  const repository = createServicesRepositoryMock();
  const media = createServicesMediaServiceMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        ServicesService,
        { provide: ServicesRepository, useValue: repository },
        { provide: ServicesMediaService, useValue: media },
      ],
    }).compile();
    service = moduleRef.get(ServicesService);
  });

  it('createService uploads media and creates', async () => {
    const created = makeServiceWithType();
    media.uploadServiceMediaToCloudinary.mockResolvedValue(
      'https://cdn.example/new.jpg',
    );
    repository.findServiceTypeIdActive.mockResolvedValue({
      id: 'stype-1',
      isActive: true,
    });
    repository.createService.mockResolvedValue(created);

    const result = await service.createService(
      {
        serviceTypeId: 'stype-1',
        description: 'Desc',
        items: ['A'],
      },
      makeMulterFile(),
    );
    expect(result.message).toContain('created');
    expect(result.service.id).toBe('svc-1');
    expect(media.ensureCloudinaryEnv).toHaveBeenCalled();
  });

  it('getPublicCatalogById throws NotFound', async () => {
    repository.findActiveServiceByIdWithType.mockResolvedValue(null);
    await expect(service.getPublicCatalogById('missing')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('getPublicServiceByInquiryCode returns snippet', async () => {
    repository.findActiveServiceByInquiryCode.mockResolvedValue(
      makeServiceWithType(),
    );
    const result = await service.getPublicServiceByInquiryCode('vip_event');
    expect(result.contactInquiryCode).toBe('VIP_EVENT');
    expect(repository.findActiveServiceByInquiryCode).toHaveBeenCalledWith(
      'VIP_EVENT',
    );
  });

  it('deleteService conflicts when bookings exist', async () => {
    repository.findServiceImageById.mockResolvedValue({
      id: 'svc-1',
      imageUrl: null,
    });
    repository.countBookingsByServiceId.mockResolvedValue(1);
    repository.countGalleryByServiceId.mockResolvedValue(0);
    await expect(service.deleteService('svc-1')).rejects.toThrow(
      ConflictException,
    );
  });

  it('deleteService succeeds when unlinked', async () => {
    repository.findServiceImageById.mockResolvedValue({
      id: 'svc-1',
      imageUrl: 'https://cdn.example/x.jpg',
    });
    repository.countBookingsByServiceId.mockResolvedValue(0);
    repository.countGalleryByServiceId.mockResolvedValue(0);
    repository.deleteService.mockResolvedValue(undefined);
    media.deleteImageFromCloudinaryByUrl.mockResolvedValue(undefined);

    await expect(service.deleteService('svc-1')).resolves.toEqual({
      message: 'Service deleted successfully.',
    });
  });

  it('createServiceType maps conflict', async () => {
    repository.createServiceType.mockRejectedValue({ code: 'P2002' });
    await expect(
      service.createServiceType({ name: 'VIP Event' }),
    ).rejects.toThrow(ConflictException);
  });

  it('updateServiceType disable conflicts when services linked', async () => {
    repository.findServiceTypeIdOnly.mockResolvedValue({ id: 'stype-1' });
    repository.countServicesByTypeId.mockResolvedValue(2);
    await expect(
      service.updateServiceType('stype-1', { isActive: false }),
    ).rejects.toThrow(ConflictException);
  });

  it('getAdminServiceTypes includes counts', async () => {
    const type = makeServiceType();
    repository.findAllServiceTypesWithCounts.mockResolvedValue([
      { ...type, _count: { services: 1, galleryPhotos: 0 } },
    ]);
    const result = await service.getAdminServiceTypes();
    expect(result[0].serviceCount).toBe(1);
  });
});
