import type { ServiceTypeRow, ServiceWithType } from '../types/services.types';

const NOW = new Date('2026-01-15T12:00:00.000Z');

export function makeServiceType(
  overrides: Partial<ServiceTypeRow> = {},
): ServiceTypeRow {
  return {
    id: 'stype-1',
    name: 'VIP Event',
    contactInquiryCode: 'VIP_EVENT',
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

export function makeServiceWithType(
  overrides: Partial<ServiceWithType> = {},
): ServiceWithType {
  const serviceType = overrides.serviceType ?? makeServiceType();
  return {
    id: 'svc-1',
    serviceTypeId: serviceType.id,
    description: 'A premium experience for private events.',
    items: ['Host', 'DJ'],
    price: 1500 as unknown as ServiceWithType['price'],
    imageUrl:
      'https://res.cloudinary.com/demo/image/upload/v1/shamell/services/hero.jpg',
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
    serviceType,
    ...overrides,
  };
}

export function makeMulterFile(
  overrides: Partial<Express.Multer.File> = {},
): Express.Multer.File {
  const jpegMagic = Buffer.alloc(12, 0);
  jpegMagic[0] = 0xff;
  jpegMagic[1] = 0xd8;
  jpegMagic[2] = 0xff;
  return {
    fieldname: 'image',
    originalname: 'hero.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 128,
    buffer: jpegMagic,
    destination: '',
    filename: '',
    path: '',
    stream: null as never,
    ...overrides,
  };
}
