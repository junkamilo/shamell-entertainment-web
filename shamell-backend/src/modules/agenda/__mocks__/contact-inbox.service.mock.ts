export function createContactInboxServiceMock() {
  return {
    countPeticionesBadge: jest.fn().mockResolvedValue({ count: 0 }),
  };
}

export type ContactInboxServiceMock = ReturnType<
  typeof createContactInboxServiceMock
>;
