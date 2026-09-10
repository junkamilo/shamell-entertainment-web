import { BadRequestException } from '@nestjs/common';
import { RecaptchaVerifier } from './recaptcha.verifier';
import {
  ENV_GOOGLE_RECAPTCHA_SECRET_KEY,
  GOOGLE_RECAPTCHA_SITEVERIFY_URL,
  RECAPTCHA_HUMAN_FAILED_MESSAGE,
} from '../constants/recaptcha.constants';

describe('RecaptchaVerifier', () => {
  const token = 'test-recaptcha-token-ok-xx';
  let fetchMock: jest.Mock;

  function makeVerifier(secret: string | undefined) {
    const config = {
      get: jest.fn((key: string) => {
        if (key === ENV_GOOGLE_RECAPTCHA_SECRET_KEY) return secret;
        return undefined;
      }),
    };
    return new RecaptchaVerifier(config as never);
  }

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('rejects a missing token without calling Google', async () => {
    const verifier = makeVerifier('secret-1');
    await expect(verifier.assertHuman(undefined)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(verifier.assertHuman('   ')).rejects.toMatchObject({
      message: RECAPTCHA_HUMAN_FAILED_MESSAGE,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects when the secret is not configured', async () => {
    const verifier = makeVerifier(undefined);
    await expect(verifier.assertHuman(token)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('accepts a successful siteverify response', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
    const verifier = makeVerifier('secret-1');
    await expect(verifier.assertHuman(token)).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith(
      GOOGLE_RECAPTCHA_SITEVERIFY_URL,
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('rejects when Google returns success false', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: false }),
    });
    const verifier = makeVerifier('secret-1');
    await expect(verifier.assertHuman(token)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects when siteverify HTTP is not ok', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ success: true }),
    });
    const verifier = makeVerifier('secret-1');
    await expect(verifier.assertHuman(token)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects when siteverify throws', async () => {
    fetchMock.mockRejectedValue(new Error('network'));
    const verifier = makeVerifier('secret-1');
    await expect(verifier.assertHuman(token)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
