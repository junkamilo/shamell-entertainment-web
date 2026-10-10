export function createServicesRepositoryMock(
  overrides: Record<string, jest.Mock> = {},
) {
  return {
    findActiveServicesWithType: jest.fn(),
    findAllServicesWithTypeAndCounts: jest.fn(),
    findServiceByIdWithType: jest.fn(),
    findActiveServiceByIdWithType: jest.fn(),
    findActiveServiceByInquiryCode: jest.fn(),
    findServiceImageById: jest.fn(),
    createService: jest.fn(),
    updateService: jest.fn(),
    deleteService: jest.fn(),
    findServiceTypeIdActive: jest.fn(),
    findServiceTypeById: jest.fn(),
    findServiceTypeIdOnly: jest.fn(),
    findActiveServiceTypes: jest.fn(),
    findAllServiceTypesWithCounts: jest.fn(),
    createServiceType: jest.fn(),
    updateServiceType: jest.fn(),
    deleteServiceType: jest.fn(),
    countBookingsByServiceId: jest.fn(),
    countGalleryByServiceId: jest.fn(),
    countServicesByTypeId: jest.fn(),
    countGalleryByServiceTypeId: jest.fn(),
    ...overrides,
  };
}

export type ServicesRepositoryMock = ReturnType<
  typeof createServicesRepositoryMock
>;
