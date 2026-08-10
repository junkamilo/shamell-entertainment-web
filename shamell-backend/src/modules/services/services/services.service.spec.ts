import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
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

  it('getPublicServices maps active services', async () => {
    repository.findActiveServicesWithType.mockResolvedValue([
      makeServiceWithType(),
    ]);
    const result = await service.getPublicServices();
    expect(result).toHaveLength(1);
    expect(result[0].serviceTypeName).toBe('VIP Event');
  });

  it('getAdminServices includes booking and gallery counts', async () => {
    const svc = makeServiceWithType();
    repository.findAllServicesWithTypeAndCounts.mockResolvedValue([
      { ...svc, _count: { bookings: 2, galleryPhotos: 1 } },
    ]);
    const result = await service.getAdminServices();
    expect(result[0].bookingCount).toBe(2);
    expect(result[0].galleryPhotoCount).toBe(1);
  });

  it('getPublicCatalogById rejects inactive service type', async () => {
    repository.findActiveServiceByIdWithType.mockResolvedValue(
      makeServiceWithType({
        serviceType: makeServiceType({ isActive: false }),
      }),
    );
    await expect(service.getPublicCatalogById('svc-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('getPublicServiceByInquiryCode rejects empty code', async () => {
    await expect(service.getPublicServiceByInquiryCode('   ')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('getPublicServiceTypes maps active types', async () => {
    repository.findActiveServiceTypes.mockResolvedValue([makeServiceType()]);
    const result = await service.getPublicServiceTypes();
    expect(result[0].name).toBe('VIP Event');
  });

  it('createServiceType returns mapped type', async () => {
    repository.createServiceType.mockResolvedValue(makeServiceType());
    const result = await service.createServiceType({ name: 'VIP Event' });
    expect(result.message).toContain('created');
    expect(result.serviceType.name).toBe('VIP Event');
  });

  it('deleteService conflicts when gallery photos linked', async () => {
    repository.findServiceImageById.mockResolvedValue({
      id: 'svc-1',
      imageUrl: null,
    });
    repository.countBookingsByServiceId.mockResolvedValue(0);
    repository.countGalleryByServiceId.mockResolvedValue(1);
    await expect(service.deleteService('svc-1')).rejects.toThrow(
      ConflictException,
    );
  });

  it('updateServiceType throws NotFound when missing', async () => {
    repository.findServiceTypeIdOnly.mockResolvedValue(null);
    await expect(
      service.updateServiceType('missing', { name: 'X' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('updateServiceType maps name conflict', async () => {
    repository.findServiceTypeIdOnly.mockResolvedValue({ id: 'stype-1' });
    repository.updateServiceType.mockRejectedValue({ code: 'P2002' });
    await expect(
      service.updateServiceType('stype-1', { name: 'Duplicate' }),
    ).rejects.toThrow(ConflictException);
  });

  it('updateService throws when new service type missing', async () => {
    repository.findServiceImageById.mockResolvedValue({
      id: 'svc-1',
      imageUrl: null,
    });
    repository.findServiceTypeIdActive.mockResolvedValue(null);
    await expect(
      service.updateService('svc-1', { serviceTypeId: 'missing' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('getAdminServiceById returns mapped service', async () => {
    repository.findServiceByIdWithType.mockResolvedValue(makeServiceWithType());
    const result = await service.getAdminServiceById('svc-1');
    expect(result.id).toBe('svc-1');
  });

  it('getAdminServiceById throws NotFound', async () => {
    repository.findServiceByIdWithType.mockResolvedValue(null);
    await expect(service.getAdminServiceById('missing')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('updateService updates text fields without media', async () => {
    const updated = makeServiceWithType({ description: 'Updated copy' });
    repository.findServiceImageById.mockResolvedValue({
      id: 'svc-1',
      imageUrl: 'https://cdn.example/old.jpg',
    });
    repository.updateService.mockResolvedValue(updated);

    const result = await service.updateService('svc-1', {
      description: 'Updated copy',
    });
    expect(result.message).toContain('updated');
    expect(result.service.description).toBe('Updated copy');
    expect(media.uploadServiceMediaToCloudinary).not.toHaveBeenCalled();
  });

  it('updateService replaces image and deletes previous media', async () => {
    const updated = makeServiceWithType({
      imageUrl: 'https://cdn.example/new.jpg',
    });
    repository.findServiceImageById.mockResolvedValue({
      id: 'svc-1',
      imageUrl: 'https://cdn.example/old.jpg',
    });
    media.uploadServiceMediaToCloudinary.mockResolvedValue(
      'https://cdn.example/new.jpg',
    );
    media.deleteImageFromCloudinaryByUrl.mockResolvedValue(undefined);
    repository.updateService.mockResolvedValue(updated);

    const result = await service.updateService('svc-1', {}, makeMulterFile());
    expect(result.service.imageUrl).toContain('new.jpg');
    expect(media.deleteImageFromCloudinaryByUrl).toHaveBeenCalledWith(
      'https://cdn.example/old.jpg',
    );
  });

  it('updateService clearImage removes stored media', async () => {
    const updated = makeServiceWithType({ imageUrl: null });
    repository.findServiceImageById.mockResolvedValue({
      id: 'svc-1',
      imageUrl: 'https://cdn.example/old.jpg',
    });
    media.deleteImageFromCloudinaryByUrl.mockResolvedValue(undefined);
    repository.updateService.mockResolvedValue(updated);

    await service.updateService('svc-1', { clearImage: true });
    expect(repository.updateService).toHaveBeenCalledWith(
      'svc-1',
      expect.objectContaining({ imageUrl: null }),
    );
  });

  it('updateService rejects disable when bookings exist', async () => {
    repository.findServiceImageById.mockResolvedValue({
      id: 'svc-1',
      imageUrl: null,
    });
    repository.countBookingsByServiceId.mockResolvedValue(2);
    await expect(
      service.updateService('svc-1', { isActive: false }),
    ).rejects.toThrow(ConflictException);
  });

  it('updateService maps P2002 when changing service type', async () => {
    repository.findServiceImageById.mockResolvedValue({
      id: 'svc-1',
      imageUrl: null,
    });
    repository.findServiceTypeIdActive.mockResolvedValue({
      id: 'stype-2',
      isActive: true,
    });
    repository.updateService.mockRejectedValue({ code: 'P2002' });
    await expect(
      service.updateService('svc-1', { serviceTypeId: 'stype-2' }),
    ).rejects.toThrow(ConflictException);
  });

  it('updateService throws when service missing', async () => {
    repository.findServiceImageById.mockResolvedValue(null);
    await expect(
      service.updateService('missing', { description: 'x' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('updateService throws when replacing media and old delete fails', async () => {
    repository.findServiceImageById.mockResolvedValue({
      id: 'svc-1',
      imageUrl: 'https://cdn.example/old.jpg',
    });
    media.uploadServiceMediaToCloudinary.mockResolvedValue(
      'https://cdn.example/new.jpg',
    );
    media.deleteImageFromCloudinaryByUrl.mockRejectedValue(
      new Error('cdn down'),
    );
    await expect(
      service.updateService('svc-1', {}, makeMulterFile()),
    ).rejects.toThrow(InternalServerErrorException);
    expect(media.deleteImageFromCloudinaryByUrl).toHaveBeenCalledWith(
      'https://cdn.example/new.jpg',
    );
  });

  it('updateServiceType happy path updates name', async () => {
    const updated = makeServiceType({ name: 'Private Gala' });
    repository.findServiceTypeIdOnly.mockResolvedValue({ id: 'stype-1' });
    repository.updateServiceType.mockResolvedValue(updated);

    const result = await service.updateServiceType('stype-1', {
      name: 'Private Gala',
    });
    expect(result.message).toContain('updated');
    expect(result.serviceType.name).toBe('Private Gala');
  });

  it('deleteServiceType succeeds when unlinked', async () => {
    repository.findServiceTypeIdOnly.mockResolvedValue({ id: 'stype-1' });
    repository.countServicesByTypeId.mockResolvedValue(0);
    repository.countGalleryByServiceTypeId.mockResolvedValue(0);
    repository.deleteServiceType.mockResolvedValue(undefined);

    await expect(service.deleteServiceType('stype-1')).resolves.toEqual({
      message: 'Service type deleted successfully.',
    });
  });

  it('deleteServiceType conflicts when services linked', async () => {
    repository.findServiceTypeIdOnly.mockResolvedValue({ id: 'stype-1' });
    repository.countServicesByTypeId.mockResolvedValue(1);
    repository.countGalleryByServiceTypeId.mockResolvedValue(0);
    await expect(service.deleteServiceType('stype-1')).rejects.toThrow(
      ConflictException,
    );
  });

  it('deleteServiceType conflicts when gallery linked', async () => {
    repository.findServiceTypeIdOnly.mockResolvedValue({ id: 'stype-1' });
    repository.countServicesByTypeId.mockResolvedValue(0);
    repository.countGalleryByServiceTypeId.mockResolvedValue(3);
    await expect(service.deleteServiceType('stype-1')).rejects.toThrow(
      ConflictException,
    );
  });

  it('deleteServiceType throws NotFound when missing', async () => {
    repository.findServiceTypeIdOnly.mockResolvedValue(null);
    await expect(service.deleteServiceType('missing')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('updateService rejects inactive service type', async () => {
    repository.findServiceImageById.mockResolvedValue({
      id: 'svc-1',
      imageUrl: null,
    });
    repository.findServiceTypeIdActive.mockResolvedValue({
      id: 'stype-2',
      isActive: false,
    });
    await expect(
      service.updateService('svc-1', { serviceTypeId: 'stype-2' }),
    ).rejects.toThrow(BadRequestException);
  });
});
