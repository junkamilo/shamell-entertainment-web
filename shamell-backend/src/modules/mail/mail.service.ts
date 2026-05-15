import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailParams, MailerSend, Recipient, Sender } from 'mailersend';

export type TransactionalMailPayload = {
  to: string;
  toName: string;
  subject: string;
  html: string;
  text: string;
};

export type SendTransactionalResult = {
  ok: boolean;
  errorText?: string;
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {}

  /** True when MailerSend can send (API key + verified from address). */
  isConfigured(): boolean {
    const apiKey = this.config.get<string>('MAILERSEND_API_KEY')?.trim();
    const fromEmail = this.config.get<string>('MAILERSEND_FROM_EMAIL')?.trim();
    return Boolean(apiKey && fromEmail);
  }

  /** User-facing hint when `isConfigured()` is false. */
  getMissingConfigMessage(): string {
    return 'Email delivery is not configured. Set MAILERSEND_API_KEY and MAILERSEND_FROM_EMAIL.';
  }

  private resolveFromName(): string {
    return (
      this.config.get<string>('MAILERSEND_FROM_NAME')?.trim() ??
      this.config.get<string>('APP_PUBLIC_NAME')?.trim() ??
      'Shamell'
    );
  }

  /**
   * Sends via MailerSend. On missing config: logs once at warn and returns `{ ok: false }`.
   * On API failure: logs error and returns `{ ok: false, errorText }` (does not throw).
   */
  async sendTransactional(
    payload: TransactionalMailPayload,
  ): Promise<SendTransactionalResult> {
    const apiKey = this.config.get<string>('MAILERSEND_API_KEY')?.trim();
    const fromEmail = this.config.get<string>('MAILERSEND_FROM_EMAIL')?.trim();
    const fromName = this.resolveFromName();

    const email = payload.to.toLowerCase().trim();
    if (!email) {
      this.logger.warn('Transactional mail skipped: empty recipient.');
      return { ok: false, errorText: 'empty recipient' };
    }

    if (!apiKey || !fromEmail) {
      this.logger.warn(
        'Transactional mail skipped: set MAILERSEND_API_KEY and MAILERSEND_FROM_EMAIL.',
      );
      return { ok: false, errorText: 'mailersend not configured' };
    }

    try {
      const mailerSend = new MailerSend({ apiKey });
      const params = new EmailParams()
        .setFrom(new Sender(fromEmail, fromName))
        .setTo([new Recipient(email, payload.toName.trim() || email)])
        .setSubject(payload.subject)
        .setText(payload.text)
        .setHtml(payload.html);

      await mailerSend.email.send(params);
      return { ok: true };
    } catch (err) {
      const raw = MailService.extractProviderErrorMessage(err);
      this.logger.error(
        `MailerSend failed for ${email}: ${raw || 'unknown error'}`,
      );
      return { ok: false, errorText: raw };
    }
  }

  /** Normalizes MailerSend HTTP-style errors and generic Error messages. */
  static extractProviderErrorMessage(error: unknown): string {
    if (!error || typeof error !== 'object') {
      return '';
    }

    const maybeResponse = error as {
      response?: { data?: unknown; body?: unknown };
      body?: unknown;
    };
    const payload =
      maybeResponse.response?.data ??
      maybeResponse.response?.body ??
      maybeResponse.body;

    if (typeof payload === 'string') {
      return payload.trim();
    }

    if (payload && typeof payload === 'object') {
      try {
        return JSON.stringify(payload);
      } catch {
        return '';
      }
    }

    if (error instanceof Error && error.message.trim()) {
      return error.message.trim();
    }

    return '';
  }
}
