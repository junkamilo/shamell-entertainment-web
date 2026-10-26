export function createContactServiceMock() {
  return {
    create: jest.fn(),
    findAll: jest.fn(),
    findAllPeticiones: jest.fn(),
    countPeticionesBadge: jest.fn(),
    findOne: jest.fn(),
    markAsRead: jest.fn(),
    updateStatus: jest.fn(),
    remove: jest.fn(),
  };
}

export type ContactServiceMock = ReturnType<typeof createContactServiceMock>;
