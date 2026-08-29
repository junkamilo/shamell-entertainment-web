import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { logCaughtError } from '../../../common/http/utils/log-caught-error.util';
import {
  DEFAULT_APP_PUBLIC_NAME,
  ENV_APP_PUBLIC_NAME,
} from '../constants/mail.constants';
import {
  AdminPaymentFlowLabel,
  buildAdminPaymentOutcomeHtml,
  buildAdminPaymentOutcomeSubject,
  buildAdminPaymentOutcomeText,
  flowLabelFromCode,
  stageLabelFromCode,
} from '../templates/admin-payment.mail';
import type { NotifyAdminPaymentInput } from '../types/mail.types';
import { resolveAdminOpsEmail } from '../utils/admin-ops-email.util';
import { emailBrandingFromConfig } from '../utils/email-html-branding';
import { MailService } from './mail.service';

export type { NotifyAdminPaymentInput };

@Injectable()
export class AdminPaymentNotifyService {
  private readonly logger = new Logger(AdminPaymentNotifyService.name);

  constructor(
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  adminOpsEmail(): string {
    return resolveAdminOpsEmail(this.config);
  }

  private usd(amount: number, currency = 'usd'): string {
    const code = currency.toUpperCase();
    if (code === 'USD') return `$${amount.toFixed(2)}`;
    return `${amount.toFixed(2)} ${code}`;
  }

  async notifyPaymentOutcome(input: NotifyAdminPaymentInput): Promise<void> {
    const to = this.adminOpsEmail();
    if (!to) return;

    const appPublicName =
      this.config.get<string>(ENV_APP_PUBLIC_NAME)?.trim() ??
      DEFAULT_APP_PUBLIC_NAME;
    const branding = emailBrandingFromConfig(this.config);
    const frontendBaseUrl = branding.siteBaseUrl;
    const flowLabel: AdminPaymentFlowLabel = flowLabelFromCode(input.flow);
    const amountUsd = this.usd(input.amount, input.currency);
    const stageLabel = stageLabelFromCode(input.stage);

    const mailInput = {
      appPublicName,
      frontendBaseUrl,
      branding,
      outcome: input.outcome,
      flowLabel,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      amountUsd,
      contextLabel: input.contextLabel,
      reference: input.reference,
      detailsLines: input.detailsLines,
      stageLabel,
    };

    try {
      const { ok, errorText } = await this.mail.sendTransactional({
        to,
        toName: 'Shamell Admin',
        subject: buildAdminPaymentOutcomeSubject(
          appPublicName,
          input.outcome,
          input.customerName,
        ),
        html: buildAdminPaymentOutcomeHtml(mailInput),
        text: buildAdminPaymentOutcomeText(mailInput),
      });
      if (!ok) {
        this.logger.warn(
          `admin-payment-notify-failed outcome=${input.outcome} reason=${errorText ?? 'provider_error'}`,
        );
      }
    } catch (err) {
      logCaughtError(this.logger, err, {
        op: 'mail.admin_payment_notify',
        level: 'error',
        extra: { outcome: input.outcome },
      });
    }
  }
}
