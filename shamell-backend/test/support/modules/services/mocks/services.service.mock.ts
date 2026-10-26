export function createServicesServiceMock(
  overrides: Record<string, jest.Mock> = {},
) {
  return {
    createService: jest.fn(),
    getPublicServices: jest.fn(),
    getPublicCatalogById: jest.fn(),
    getPublicServiceByInquiryCode: jest.fn(),
    getAdminServices: jest.fn(),
    getAdminServiceById: jest.fn(),
    updateService: jest.fn(),
    deleteService: jest.fn(),
    createServiceType: jest.fn(),
    getPublicServiceTypes: jest.fn(),
    getAdminServiceTypes: jest.fn(),
    updateServiceType: jest.fn(),
    deleteServiceType: jest.fn(),
    ...overrides,
  };
}

export type ServicesServiceMock = ReturnType<typeof createServicesServiceMock>;
