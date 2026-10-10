export function createUsersRepositoryMock() {
  return {
    findIdByEmail: jest.fn().mockResolvedValue(null),
    createRegisteredUser: jest.fn(),
  };
}

export type UsersRepositoryMock = ReturnType<typeof createUsersRepositoryMock>;
