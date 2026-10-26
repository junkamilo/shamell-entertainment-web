export function createVenueTablesServiceMock() {
  return {
    getPublicVenueTables: jest.fn(),
    getAdminVenueTables: jest.fn(),
    getAdminVenueTableById: jest.fn(),
    createAdminVenueTable: jest.fn(),
    bulkCreateAdminVenueTables: jest.fn(),
    updateAdminVenueTable: jest.fn(),
    deleteAdminVenueTable: jest.fn(),
    bulkUpdateAdminVenueTablesBundlePrice: jest.fn(),
    bulkDeleteAdminVenueTables: jest.fn(),
  };
}

export type VenueTablesServiceMock = ReturnType<
  typeof createVenueTablesServiceMock
>;
