export function createRecaptchaVerifierMock() {
  return {
    assertHuman: jest.fn().mockResolvedValue(undefined),
  };
}

export type RecaptchaVerifierMock = ReturnType<
  typeof createRecaptchaVerifierMock
>;
