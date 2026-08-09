export function createUsersServiceMock() {
  return {
    register: jest.fn(),
  };
}

export type UsersServiceMock = ReturnType<typeof createUsersServiceMock>;
