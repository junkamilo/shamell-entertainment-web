import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailParams, MailerSend, Recipient, Sender } from 'mailersend';
import nodemailer from 'nodemailer';

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

export type MailTransport = 'mailersend' | 'smtp';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {}

  /** Active transport from `MAIL_TRANSPORT` (default `mailersend`). */
  getTransport(): MailTransport {
    const raw = this.config.get<string>('MAIL_TRANSPORT')?.trim().toLowerCase();
    return raw === 'smtp' ? 'smtp' : 'mailersend';
  }

  /**
   * True when the active transport has the minimum env to attempt a send.
   * mailersend: API key + from email.
   * smtp: host (defaults to smtp.gmail.com), user, password, from address (SMTP_FROM_EMAIL or SMTP_USER).
   */
  isConfigured(): boolean {
    if (this.getTransport() === 'smtp') {
      const user = this.config.get<string>('SMTP_USER')?.trim();
      const pass = this.config.get<string>('SMTP_PASS')?.trim();
      const from = this.getSmtpFromAddress();
      const host = this.getSmtpHost();
      return Boolean(host && user && pass && from);
    }
    const apiKey = this.config.get<string>('MAILERSEND_API_KEY')?.trim();
    const fromEmail = this.config.get<string>('MAILERSEND_FROM_EMAIL')?.trim();
    return Boolean(apiKey && fromEmail);
  }

  /** User-facing hint when `isConfigured()` is false. */
  getMissingConfigMessage(): string {
    if (this.getTransport() === 'smtp') {
      return (
        'Email delivery (SMTP) is not configured. Set SMTP_USER, SMTP_PASS, and optionally SMTP_HOST, ' +
        'SMTP_PORT, SMTP_SECURE, SMTP_FROM_EMAIL (defaults to SMTP_USER).'
      );
    }
    return 'Email delivery is not configured. Set MAILERSEND_API_KEY and MAILERSEND_FROM_EMAIL.';
  }

  private getSmtpHost(): string {
    return (
      this.config.get<string>('SMTP_HOST')?.trim() ||
      (this.getTransport() === 'smtp' ? 'smtp.gmail.com' : '')
    );
  }

  private getSmtpFromAddress(): string {
    return (
      this.config.get<string>('SMTP_FROM_EMAIL')?.trim() ||
      this.config.get<string>('SMTP_USER')?.trim() ||
      ''
    );
  }

  private resolveFromName(): string {
    return (
      this.config.get<string>('MAILERSEND_FROM_NAME')?.trim() ??
      this.config.get<string>('APP_PUBLIC_NAME')?.trim() ??
      'Shamell'
    );
  }

  /**
   * Sends transactional email via MailerSend or SMTP (see MAIL_TRANSPORT).
   * On missing config or failure: logs and returns `{ ok: false, errorText }` (does not throw).
   */
  async sendTransactional(
    payload: TransactionalMailPayload,
  ): Promise<SendTransactionalResult> {
    const email = payload.to.toLowerCase().trim();
    if (!email) {
      this.logger.warn('Transactional mail skipped: empty recipient.');
      return { ok: false, errorText: 'empty recipient' };
    }

    const transport = this.getTransport();

    if (transport === 'smtp') {
      return this.sendViaSmtp(payload, email);
    }
    return this.sendViaMailerSend(payload, email);
  }

  private async sendViaMailerSend(
    payload: TransactionalMailPayload,
    email: string,
  ): Promise<SendTransactionalResult> {
    const apiKey = this.config.get<string>('MAILERSEND_API_KEY')?.trim();
    const fromEmail = this.config.get<string>('MAILERSEND_FROM_EMAIL')?.trim();
    const fromName = this.resolveFromName();

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
        `Transactional mail failed (mailersend) for ${email}: ${raw || 'unknown error'}`,
      );
      return { ok: false, errorText: raw };
    }
  }

  private async sendViaSmtp(
    payload: TransactionalMailPayload,
    email: string,
  ): Promise<SendTransactionalResult> {
    const host = this.getSmtpHost();
    const user = this.config.get<string>('SMTP_USER')?.trim();
    const pass = this.config.get<string>('SMTP_PASS')?.trim();
    const fromAddress = this.getSmtpFromAddress();
    const fromName = this.resolveFromName();

    const portRaw = this.config.get<string>('SMTP_PORT')?.trim();
    const port = portRaw ? Number.parseInt(portRaw, 10) : 587;
    const secureEnv = this.config.get<string>('SMTP_SECURE')?.trim().toLowerCase();
    const secure =
      secureEnv === 'true' || secureEnv === '1' || (!Number.isNaN(port) && port === 465);

    if (!host || !user || !pass || !fromAddress || Number.isNaN(port)) {
      this.logger.warn('Transactional mail skipped: incomplete SMTP configuration.');
      return { ok: false, errorText: 'smtp not configured' };
    }

    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      });

      await transporter.sendMail({
        from: `"${fromName.replace(/"/g, '')}" <${fromAddress}>`,
        to: `"${(payload.toName.trim() || email).replace(/"/g, '')}" <${email}>`,
        subject: payload.subject,
        text: payload.text,
        html: payload.html,
      });
      return { ok: true };
    } catch (err) {
      const raw = MailService.extractProviderErrorMessage(err);
      this.logger.error(
        `Transactional mail failed (smtp) for ${email}: ${raw || 'unknown error'}`,
      );
      return { ok: false, errorText: raw };
    }
  }

  /** Normalizes MailerSend HTTP-style errors and generic Error messages (incl. Nodemailer). */
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
