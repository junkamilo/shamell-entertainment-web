export function createContactInboxServiceMock() {
  return {
    countPeticionesBadge: jest.fn().mockResolvedValue({ count: 0 }),
    findAllPeticiones: jest.fn(),
  };
}

export type ContactInboxServiceMock = ReturnType<
  typeof createContactInboxServiceMock
>;
