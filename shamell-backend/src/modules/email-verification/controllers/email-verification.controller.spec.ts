import { Test } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { EMAIL_VERIFICATION_PURPOSE } from '../constants/email-verification.constants';
import { EmailVerificationService } from '../services/email-verification.service';
import { EmailVerificationController } from './email-verification.controller';

describe('EmailVerificationController', () => {
  let controller: EmailVerificationController;
  const emailVerification = {
    start: jest.fn(),
    verify: jest.fn(),
    resend: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [EmailVerificationController],
      providers: [
        { provide: EmailVerificationService, useValue: emailVerification },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = moduleRef.get(EmailVerificationController);
  });

  it('start / verify / resend delegate to the service', async () => {
    emailVerification.start.mockResolvedValue({
      challengeId: 'challenge-1',
      emailMasked: 'a***@example.com',
      expiresAt: '2026-09-10T18:10:00.000Z',
    });
    emailVerification.verify.mockResolvedValue({
      verifiedToken: 'verified-token-plain-xx-xxxxxxxx',
    });
    emailVerification.resend.mockResolvedValue({
      challengeId: 'challenge-1',
      emailMasked: 'a***@example.com',
      expiresAt: '2026-09-10T18:10:00.000Z',
    });

    await expect(
      controller.start({
        purpose: EMAIL_VERIFICATION_PURPOSE.CONCIERGE_INQUIRY,
        email: 'ada@example.com',
        recaptchaToken: 'test-recaptcha-token-ok-xx',
      }),
    ).resolves.toMatchObject({ challengeId: 'challenge-1' });
    await expect(
      controller.verify({ challengeId: 'challenge-1', code: '482193' }),
    ).resolves.toEqual({
      verifiedToken: 'verified-token-plain-xx-xxxxxxxx',
    });
    await expect(
      controller.resend({ challengeId: 'challenge-1' }),
    ).resolves.toMatchObject({ challengeId: 'challenge-1' });

    expect(emailVerification.start).toHaveBeenCalled();
    expect(emailVerification.verify).toHaveBeenCalledWith({
      challengeId: 'challenge-1',
      code: '482193',
    });
    expect(emailVerification.resend).toHaveBeenCalledWith('challenge-1');
  });
});
