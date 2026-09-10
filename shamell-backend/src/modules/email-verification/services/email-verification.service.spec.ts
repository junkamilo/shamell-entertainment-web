import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  generateInviteCode,
  generateResetToken,
  sha256Hex,
} from '../../auth/utils/auth-crypto.util';
import { RecaptchaVerifier } from '../../contact/services/recaptcha.verifier';
import { MailService } from '../../mail/services/mail.service';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  EMAIL_VERIFICATION_EXPIRED_MESSAGE,
  EMAIL_VERIFICATION_FAILED_MESSAGE,
  EMAIL_VERIFICATION_LOCKED_MESSAGE,
  EMAIL_VERIFICATION_PURPOSE,
  EMAIL_VERIFICATION_REQUIRED_MESSAGE,
  EMAIL_VERIFICATION_RESEND_WAIT_MESSAGE,
  OTP_MAX_ATTEMPTS,
} from '../constants/email-verification.constants';
import { EmailVerificationService } from './email-verification.service';

jest.mock('../../auth/utils/auth-crypto.util', () => {
  const actual: { sha256Hex: (value: string) => string } = jest.requireActual(
    '../../auth/utils/auth-crypto.util',
  );
  return {
    sha256Hex: actual.sha256Hex,
    generateInviteCode: jest.fn(() => '482193'),
    generateResetToken: jest.fn(() => ({
      rawToken: 'verified-token-plain-xx-xxxxxxxx',
      tokenHash: actual.sha256Hex('verified-token-plain-xx-xxxxxxxx'),
    })),
  };
});

describe('EmailVerificationService', () => {
  const now = new Date('2026-09-10T18:00:00.000Z');
  let service: EmailVerificationService;
  let prisma: {
    emailVerificationChallenge: {
      create: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
  };
  let recaptcha: { assertHuman: jest.Mock };
  let mail: { sendTransactional: jest.Mock };

  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
    prisma = {
      emailVerificationChallenge: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };
    recaptcha = { assertHuman: jest.fn().mockResolvedValue(undefined) };
    mail = { sendTransactional: jest.fn().mockResolvedValue({ ok: true }) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        EmailVerificationService,
        { provide: PrismaService, useValue: prisma },
        { provide: RecaptchaVerifier, useValue: recaptcha },
        { provide: MailService, useValue: mail },
        {
          provide: ConfigService,
          useValue: { get: () => 'Shamell Entertainment' },
        },
      ],
    }).compile();

    service = moduleRef.get(EmailVerificationService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('start verifies recaptcha, stores a hash, and emails the code', async () => {
    prisma.emailVerificationChallenge.create.mockResolvedValue({
      id: 'challenge-1',
      expiresAt: new Date(now.getTime() + 10 * 60 * 1000),
    });

    const result = await service.start({
      purpose: EMAIL_VERIFICATION_PURPOSE.CONCIERGE_INQUIRY,
      email: 'Ada@Example.com',
      recaptchaToken: 'test-recaptcha-token-ok-xx',
    });

    expect(recaptcha.assertHuman).toHaveBeenCalled();
    const createArg = (
      prisma.emailVerificationChallenge.create.mock.calls as Array<
        [{ data: { email: string; purpose: string; codeHash: string } }]
      >
    )[0]?.[0];
    expect(createArg?.data.email).toBe('ada@example.com');
    expect(createArg?.data.purpose).toBe('CONCIERGE_INQUIRY');
    expect(createArg?.data.codeHash).toBe(sha256Hex('482193'));
    const mailArg = (
      mail.sendTransactional.mock.calls as Array<[{ to: string; html: string }]>
    )[0]?.[0];
    expect(mailArg?.to).toBe('ada@example.com');
    expect(mailArg?.html).toContain('4 8 2 1 9 3');
    expect(result.challengeId).toBe('challenge-1');
    expect(result.emailMasked).toBe('a***@example.com');
    expect(generateInviteCode).toHaveBeenCalled();
  });

  it('verify returns a one-time token when the code matches', async () => {
    prisma.emailVerificationChallenge.findUnique.mockResolvedValue({
      id: 'challenge-1',
      email: 'ada@example.com',
      purpose: 'CONCIERGE_INQUIRY',
      codeHash: sha256Hex('482193'),
      expiresAt: new Date(now.getTime() + 60_000),
      attemptCount: 0,
      consumedAt: null,
      verifiedTokenHash: null,
    });
    prisma.emailVerificationChallenge.update.mockResolvedValue({});

    const result = await service.verify({
      challengeId: 'challenge-1',
      code: '482193',
    });

    expect(result.verifiedToken).toBe('verified-token-plain-xx-xxxxxxxx');
    expect(generateResetToken).toHaveBeenCalled();
  });

  it('verify rejects a wrong code and locks after too many attempts', async () => {
    prisma.emailVerificationChallenge.findUnique.mockResolvedValue({
      id: 'challenge-1',
      email: 'ada@example.com',
      purpose: 'CONCIERGE_INQUIRY',
      codeHash: sha256Hex('482193'),
      expiresAt: new Date(now.getTime() + 60_000),
      attemptCount: OTP_MAX_ATTEMPTS - 1,
      consumedAt: null,
      verifiedTokenHash: null,
    });
    prisma.emailVerificationChallenge.update.mockResolvedValue({});

    await expect(
      service.verify({ challengeId: 'challenge-1', code: '000000' }),
    ).rejects.toMatchObject({
      message: EMAIL_VERIFICATION_LOCKED_MESSAGE,
    });
    expect(prisma.emailVerificationChallenge.update).toHaveBeenCalled();
    const lockArg = (
      prisma.emailVerificationChallenge.update.mock.calls as Array<
        [{ data: { attemptCount: number } }]
      >
    )[0]?.[0];
    expect(lockArg?.data.attemptCount).toBe(OTP_MAX_ATTEMPTS);
  });

  it('verify rejects a wrong code before the lock', async () => {
    prisma.emailVerificationChallenge.findUnique.mockResolvedValue({
      id: 'challenge-1',
      email: 'ada@example.com',
      purpose: 'CONCIERGE_INQUIRY',
      codeHash: sha256Hex('482193'),
      expiresAt: new Date(now.getTime() + 60_000),
      attemptCount: 0,
      consumedAt: null,
      verifiedTokenHash: null,
    });
    prisma.emailVerificationChallenge.update.mockResolvedValue({});

    await expect(
      service.verify({ challengeId: 'challenge-1', code: '111111' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.verify({ challengeId: 'challenge-1', code: '111111' }),
    ).rejects.toMatchObject({ message: EMAIL_VERIFICATION_FAILED_MESSAGE });
  });

  it('verify rejects an expired challenge', async () => {
    prisma.emailVerificationChallenge.findUnique.mockResolvedValue({
      id: 'challenge-1',
      email: 'ada@example.com',
      purpose: 'CONCIERGE_INQUIRY',
      codeHash: sha256Hex('482193'),
      expiresAt: new Date(now.getTime() - 1000),
      attemptCount: 0,
      consumedAt: null,
      verifiedTokenHash: null,
    });

    await expect(
      service.verify({ challengeId: 'challenge-1', code: '482193' }),
    ).rejects.toMatchObject({
      message: EMAIL_VERIFICATION_EXPIRED_MESSAGE,
    });
  });

  it('resend waits for the cooldown', async () => {
    prisma.emailVerificationChallenge.findUnique.mockResolvedValue({
      id: 'challenge-1',
      email: 'ada@example.com',
      purpose: 'CONCIERGE_INQUIRY',
      codeHash: sha256Hex('482193'),
      expiresAt: new Date(now.getTime() + 60_000),
      attemptCount: 0,
      resendCount: 0,
      lastSentAt: now,
      consumedAt: null,
      verifiedTokenHash: null,
    });

    await expect(service.resend('challenge-1')).rejects.toMatchObject({
      message: EMAIL_VERIFICATION_RESEND_WAIT_MESSAGE,
    });
  });

  it('resend issues a new code after the cooldown', async () => {
    prisma.emailVerificationChallenge.findUnique.mockResolvedValue({
      id: 'challenge-1',
      email: 'ada@example.com',
      purpose: 'CONCIERGE_INQUIRY',
      codeHash: sha256Hex('482193'),
      expiresAt: new Date(now.getTime() + 60_000),
      attemptCount: 2,
      resendCount: 0,
      lastSentAt: new Date(now.getTime() - 61_000),
      consumedAt: null,
      verifiedTokenHash: null,
    });
    prisma.emailVerificationChallenge.update.mockResolvedValue({
      id: 'challenge-1',
      expiresAt: new Date(now.getTime() + 10 * 60 * 1000),
    });

    const result = await service.resend('challenge-1');

    expect(result.challengeId).toBe('challenge-1');
    expect(mail.sendTransactional).toHaveBeenCalled();
    const resendArg = (
      prisma.emailVerificationChallenge.update.mock.calls as Array<
        [{ data: { resendCount: number; attemptCount: number } }]
      >
    )[0]?.[0];
    expect(resendArg?.data.resendCount).toBe(1);
    expect(resendArg?.data.attemptCount).toBe(0);
  });

  it('consumeVerifiedToken rejects a missing or mismatched token', async () => {
    await expect(
      service.consumeVerifiedToken({
        token: undefined,
        email: 'ada@example.com',
        purpose: EMAIL_VERIFICATION_PURPOSE.CONCIERGE_INQUIRY,
      }),
    ).rejects.toMatchObject({ message: EMAIL_VERIFICATION_REQUIRED_MESSAGE });

    prisma.emailVerificationChallenge.findUnique.mockResolvedValue(null);
    await expect(
      service.consumeVerifiedToken({
        token: 'verified-token-plain-xx-xxxxxxxx',
        email: 'ada@example.com',
        purpose: EMAIL_VERIFICATION_PURPOSE.CONCIERGE_INQUIRY,
      }),
    ).rejects.toMatchObject({ message: EMAIL_VERIFICATION_REQUIRED_MESSAGE });

    prisma.emailVerificationChallenge.findUnique.mockResolvedValue({
      id: 'challenge-1',
      email: 'other@example.com',
      purpose: 'CONCIERGE_INQUIRY',
      consumedAt: null,
      verifiedExpiresAt: new Date(now.getTime() + 60_000),
    });
    await expect(
      service.consumeVerifiedToken({
        token: 'verified-token-plain-xx-xxxxxxxx',
        email: 'ada@example.com',
        purpose: EMAIL_VERIFICATION_PURPOSE.CONCIERGE_INQUIRY,
      }),
    ).rejects.toMatchObject({ message: EMAIL_VERIFICATION_REQUIRED_MESSAGE });
  });

  it('consumeVerifiedToken marks a matching token as consumed', async () => {
    const token = 'verified-token-plain-xx-xxxxxxxx';
    prisma.emailVerificationChallenge.findUnique.mockResolvedValue({
      id: 'challenge-1',
      email: 'ada@example.com',
      purpose: 'CONCIERGE_INQUIRY',
      consumedAt: null,
      verifiedExpiresAt: new Date(now.getTime() + 60_000),
    });
    prisma.emailVerificationChallenge.update.mockResolvedValue({});

    await service.consumeVerifiedToken({
      token,
      email: 'ADA@example.com',
      purpose: EMAIL_VERIFICATION_PURPOSE.CONCIERGE_INQUIRY,
    });

    const consumeArg = (
      prisma.emailVerificationChallenge.update.mock.calls as Array<
        [{ data: { consumedAt: Date } }]
      >
    )[0]?.[0];
    expect(consumeArg?.data.consumedAt).toEqual(now);
  });
});
