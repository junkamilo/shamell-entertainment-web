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

  /**
   * Sends via MailerSend. On missing config: logs once at warn and returns false.
   * On API failure: logs error and returns false (does not throw).
   */
  async sendTransactional(payload: TransactionalMailPayload): Promise<boolean> {
    const apiKey = this.config.get<string>('MAILERSEND_API_KEY')?.trim();
    const fromEmail = this.config.get<string>('MAILERSEND_FROM_EMAIL')?.trim();
    const fromName =
      this.config.get<string>('MAILERSEND_FROM_NAME')?.trim() ??
      this.config.get<string>('APP_PUBLIC_NAME')?.trim() ??
      'Shamell';

    if (!apiKey || !fromEmail) {
      this.logger.warn(
        'Transactional mail skipped: set MAILERSEND_API_KEY and MAILERSEND_FROM_EMAIL.',
      );
      return false;
    }

    const email = payload.to.toLowerCase().trim();
    if (!email) {
      this.logger.warn('Transactional mail skipped: empty recipient.');
      return false;
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
      return true;
    } catch (err) {
      const raw = this.mailerSendErrorMessage(err);
      this.logger.error(
        `MailerSend failed for ${email}: ${raw || 'unknown error'}`,
      );
      return false;
    }
  }

  private mailerSendErrorMessage(error: unknown): string {
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
