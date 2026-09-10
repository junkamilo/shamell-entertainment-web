import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EmailVerificationChallenge } from '@prisma/client';
import {
  generateInviteCode,
  generateResetToken,
  sha256Hex,
} from '../../auth/utils/auth-crypto.util';
import { ENV_APP_PUBLIC_NAME } from '../../mail/constants/mail.constants';
import { MailService } from '../../mail/services/mail.service';
import { emailBrandingFromConfig } from '../../mail/utils/email-html-branding';
import { RecaptchaVerifier } from '../../contact/services/recaptcha.verifier';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  EMAIL_VERIFICATION_EXPIRED_MESSAGE,
  EMAIL_VERIFICATION_FAILED_MESSAGE,
  EMAIL_VERIFICATION_LOCKED_MESSAGE,
  EMAIL_VERIFICATION_REQUIRED_MESSAGE,
  EMAIL_VERIFICATION_RESEND_LIMIT_MESSAGE,
  EMAIL_VERIFICATION_RESEND_WAIT_MESSAGE,
  EMAIL_VERIFICATION_SEND_FAILED_MESSAGE,
  OTP_MAX_ATTEMPTS,
  OTP_MAX_RESENDS,
  OTP_RESEND_COOLDOWN_MS,
  OTP_TTL_MS,
  VERIFIED_TOKEN_TTL_MS,
  type EmailVerificationPurpose,
} from '../constants/email-verification.constants';
import {
  buildEmailVerificationCodeHtml,
  buildEmailVerificationCodeSubject,
  buildEmailVerificationCodeText,
} from '../mail/email-verification-code.mail';
import { hashesMatch, maskEmail } from '../utils/email-verification.util';

@Injectable()
export class EmailVerificationService {
  private readonly logger = new Logger(EmailVerificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly recaptcha: RecaptchaVerifier,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  async start(input: {
    purpose: EmailVerificationPurpose;
    email: string;
    recaptchaToken: string;
  }): Promise<{
    challengeId: string;
    emailMasked: string;
    expiresAt: string;
  }> {
    await this.recaptcha.assertHuman(input.recaptchaToken);
    const email = input.email.trim().toLowerCase();
    const now = new Date();

    await this.prisma.emailVerificationChallenge.updateMany({
      where: {
        email,
        purpose: input.purpose,
        consumedAt: null,
        expiresAt: { gt: now },
      },
      data: { expiresAt: now },
    });

    const code = generateInviteCode();
    const created = await this.prisma.emailVerificationChallenge.create({
      data: {
        purpose: input.purpose,
        email,
        codeHash: sha256Hex(code),
        expiresAt: new Date(now.getTime() + OTP_TTL_MS),
        lastSentAt: now,
      },
    });

    await this.sendCodeEmail(email, code);
    this.logger.log(`email_verification.sent purpose=${input.purpose}`);

    return {
      challengeId: created.id,
      emailMasked: maskEmail(email),
      expiresAt: created.expiresAt.toISOString(),
    };
  }

  async verify(input: {
    challengeId: string;
    code: string;
  }): Promise<{ verifiedToken: string }> {
    const row = await this.requireOpenChallenge(input.challengeId);
    const digest = sha256Hex(input.code.trim());
    if (!hashesMatch(digest, row.codeHash)) {
      const attempts = row.attemptCount + 1;
      await this.prisma.emailVerificationChallenge.update({
        where: { id: row.id },
        data: {
          attemptCount: attempts,
          ...(attempts >= OTP_MAX_ATTEMPTS ? { expiresAt: new Date() } : {}),
        },
      });
      this.logger.warn('email_verification.rejected reason=bad_code');
      if (attempts >= OTP_MAX_ATTEMPTS) {
        throw new BadRequestException(EMAIL_VERIFICATION_LOCKED_MESSAGE);
      }
      throw new BadRequestException(EMAIL_VERIFICATION_FAILED_MESSAGE);
    }

    const { rawToken, tokenHash } = generateResetToken();
    const verifiedExpiresAt = new Date(Date.now() + VERIFIED_TOKEN_TTL_MS);
    await this.prisma.emailVerificationChallenge.update({
      where: { id: row.id },
      data: {
        verifiedTokenHash: tokenHash,
        verifiedExpiresAt,
        codeHash: sha256Hex(`used:${row.id}`),
      },
    });
    this.logger.log('email_verification.ok');
    return { verifiedToken: rawToken };
  }

  async resend(challengeId: string): Promise<{
    challengeId: string;
    emailMasked: string;
    expiresAt: string;
  }> {
    const row = await this.requireOpenChallenge(challengeId, {
      allowVerified: false,
    });
    const now = new Date();
    if (row.resendCount >= OTP_MAX_RESENDS) {
      this.logger.warn('email_verification.rejected reason=resend_limit');
      throw new BadRequestException(EMAIL_VERIFICATION_RESEND_LIMIT_MESSAGE);
    }
    if (now.getTime() - row.lastSentAt.getTime() < OTP_RESEND_COOLDOWN_MS) {
      this.logger.warn('email_verification.rejected reason=resend_wait');
      throw new BadRequestException(EMAIL_VERIFICATION_RESEND_WAIT_MESSAGE);
    }

    const code = generateInviteCode();
    const updated = await this.prisma.emailVerificationChallenge.update({
      where: { id: row.id },
      data: {
        codeHash: sha256Hex(code),
        expiresAt: new Date(now.getTime() + OTP_TTL_MS),
        lastSentAt: now,
        resendCount: row.resendCount + 1,
        attemptCount: 0,
        verifiedTokenHash: null,
        verifiedExpiresAt: null,
      },
    });

    await this.sendCodeEmail(row.email, code);
    this.logger.log('email_verification.sent purpose=resend');

    return {
      challengeId: updated.id,
      emailMasked: maskEmail(row.email),
      expiresAt: updated.expiresAt.toISOString(),
    };
  }

  async consumeVerifiedToken(input: {
    token: string | undefined;
    email: string;
    purpose: EmailVerificationPurpose;
  }): Promise<void> {
    const raw = input.token?.trim() ?? '';
    if (!raw) {
      this.logger.warn('email_verification.rejected reason=missing_token');
      throw new BadRequestException(EMAIL_VERIFICATION_REQUIRED_MESSAGE);
    }

    const tokenHash = sha256Hex(raw);
    const row = await this.prisma.emailVerificationChallenge.findUnique({
      where: { verifiedTokenHash: tokenHash },
    });
    const now = new Date();
    const email = input.email.trim().toLowerCase();
    const usable =
      row &&
      !row.consumedAt &&
      row.purpose === input.purpose &&
      row.email === email &&
      row.verifiedExpiresAt &&
      row.verifiedExpiresAt > now;

    if (!usable || !row) {
      this.logger.warn('email_verification.rejected reason=token_invalid');
      throw new BadRequestException(EMAIL_VERIFICATION_REQUIRED_MESSAGE);
    }

    await this.prisma.emailVerificationChallenge.update({
      where: { id: row.id },
      data: { consumedAt: now },
    });
  }

  private async requireOpenChallenge(
    challengeId: string,
    opts: { allowVerified?: boolean } = {},
  ): Promise<EmailVerificationChallenge> {
    const row = await this.prisma.emailVerificationChallenge.findUnique({
      where: { id: challengeId },
    });
    if (!row || row.consumedAt) {
      this.logger.warn('email_verification.rejected reason=missing_challenge');
      throw new BadRequestException(EMAIL_VERIFICATION_FAILED_MESSAGE);
    }
    if (row.expiresAt <= new Date()) {
      this.logger.warn('email_verification.rejected reason=expired');
      throw new BadRequestException(EMAIL_VERIFICATION_EXPIRED_MESSAGE);
    }
    if (!opts.allowVerified && row.verifiedTokenHash) {
      this.logger.warn('email_verification.rejected reason=already_verified');
      throw new BadRequestException(EMAIL_VERIFICATION_FAILED_MESSAGE);
    }
    return row;
  }

  private async sendCodeEmail(email: string, code: string): Promise<void> {
    const appName =
      this.config.get<string>(ENV_APP_PUBLIC_NAME)?.trim() || 'Shamell';
    const branding = emailBrandingFromConfig(this.config);
    const sent = await this.mail.sendTransactional({
      to: email,
      toName: email.split('@')[0] || 'Guest',
      subject: buildEmailVerificationCodeSubject(appName),
      html: buildEmailVerificationCodeHtml({ appName, code, branding }),
      text: buildEmailVerificationCodeText({ appName, code }),
    });
    if (!sent.ok) {
      this.logger.warn('email_verification.rejected reason=mail_failed');
      throw new BadRequestException(EMAIL_VERIFICATION_SEND_FAILED_MESSAGE);
    }
  }
}
