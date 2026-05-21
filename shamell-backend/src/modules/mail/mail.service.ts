import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
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
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const fromEmail = this.resolveFromEmail();
    if (!this.isConfigured()) {
      this.logger.warn(
        'MailerSend not configured: set MAILERSEND_API_KEY and MAILERSEND_FROM_EMAIL.',
      );
      return;
    }
    const trialDomain = MailService.isTrialMlsenderDomain(fromEmail);
    this.logger.log(
      `MailerSend ready: sending as ${fromEmail}` +
        (trialDomain
          ? ' (trial *.mlsender.net — max 2 unique recipients)'
          : ''),
    );
  }

  /**
   * Reads MAILERSEND_FROM_EMAIL (strips quotes/spaces — common in Render dashboards).
   * Any local part is fine (info@, noreply@, etc.) once the domain is verified in MailerSend.
   */
  resolveFromEmail(): string {
    let raw = this.config.get<string>('MAILERSEND_FROM_EMAIL') ?? '';
    raw = raw.trim();
    if (
      (raw.startsWith('"') && raw.endsWith('"')) ||
      (raw.startsWith("'") && raw.endsWith("'"))
    ) {
      raw = raw.slice(1, -1).trim();
    }
    return raw;
  }

  /** True when the from address is MailerSend's shared trial subdomain. */
  static isTrialMlsenderDomain(fromEmail: string): boolean {
    const domain = fromEmail.trim().toLowerCase().split('@')[1] ?? '';
    return domain.endsWith('.mlsender.net') || domain === 'mlsender.net';
  }

  /** True when MailerSend can send (API key + verified from address). */
  isConfigured(): boolean {
    const apiKey = this.config.get<string>('MAILERSEND_API_KEY')?.trim();
    return Boolean(apiKey && this.resolveFromEmail());
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
    const fromEmail = this.resolveFromEmail();
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
      const fromDomain = fromEmail.split('@')[1] ?? '?';
      this.logger.error(
        `MailerSend failed (from ***@${fromDomain} → ${email}): ${raw || 'unknown error'}`,
      );
      return { ok: false, errorText: raw };
    }
  }

  /**
   * Spanish hint for known MailerSend API errors (e.g. trial domain MS42225).
   * Returns null when the raw provider message should be shown as-is.
   */
  static userFacingErrorMessage(
    raw: string,
    configuredFromEmail?: string,
  ): string | null {
    const text = raw.trim();
    if (!text) return null;

    if (
      /MS42225|trial account unique recipients|trial domain unique recipients/i.test(
        text,
      )
    ) {
      const from = configuredFromEmail?.trim() ?? '';
      if (from && !MailService.isTrialMlsenderDomain(from)) {
        return (
          `MailerSend rechazó el envío (#MS42225). El backend usa ${from} (info@ o noreply@ vale igual). ` +
          'En app.mailersend.com: dominio shamellentertainment.com en Verified, plan Free activo (no Trial), ' +
          'token nuevo con permiso de envío, luego redeploy en Render.'
        );
      }
      return (
        'MAILERSEND_FROM_EMAIL usa el dominio de prueba (*.mlsender.net). ' +
        'Cámbialo a info@shamellentertainment.com (o cualquier buzón de tu dominio verificado) y reinicia el backend.'
      );
    }

    if (
      /domain|sender|from|verified|verification|unauthorized|forbidden/i.test(
        text,
      )
    ) {
      return (
        'MailerSend no pudo enviar el correo. Verifica que MAILERSEND_FROM_EMAIL pertenezca a un dominio ' +
        'verificado y que MAILERSEND_API_KEY tenga permisos para enviar emails.'
      );
    }

    return null;
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
