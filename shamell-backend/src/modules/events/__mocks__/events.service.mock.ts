export function createEventsServiceMock(
  overrides: Record<string, jest.Mock> = {},
) {
  return {
    getPublicEvents: jest.fn(),
    getPublicUpcomingHubEvents: jest.fn(),
    getContactLines: jest.fn(),
    getPublicCatalogById: jest.fn(),
    getPublicEventTypes: jest.fn(),
    getAdminEvents: jest.fn(),
    getAdminEventById: jest.fn(),
    getAdminEventTypes: jest.fn(),
    getAdminOccasionTypes: jest.fn(),
    createEvent: jest.fn(),
    updateEvent: jest.fn(),
    deleteEvent: jest.fn(),
    createEventType: jest.fn(),
    updateEventType: jest.fn(),
    deleteEventType: jest.fn(),
    createOccasionType: jest.fn(),
    updateOccasionType: jest.fn(),
    deleteOccasionType: jest.fn(),
    ...overrides,
  };
}
