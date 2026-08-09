export function createReservationEventTemplatesServiceMock(
  overrides: Record<string, jest.Mock> = {},
) {
  return {
    listAdmin: jest.fn(),
    getAdminById: jest.fn(),
    createAdmin: jest.fn(),
    updateAdmin: jest.fn(),
    deleteAdmin: jest.fn(),
    findByIdOrThrow: jest.fn(),
    ...overrides,
  };
}

export type ReservationEventTemplatesServiceMock = ReturnType<
  typeof createReservationEventTemplatesServiceMock
>;
