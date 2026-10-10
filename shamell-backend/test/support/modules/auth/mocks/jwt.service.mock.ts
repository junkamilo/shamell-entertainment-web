export function createJwtServiceMock() {
  return {
    signAsync: jest.fn().mockResolvedValue('jwt-token'),
  };
}

export type JwtServiceMock = ReturnType<typeof createJwtServiceMock>;
