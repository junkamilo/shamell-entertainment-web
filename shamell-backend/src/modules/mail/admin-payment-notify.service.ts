import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AdminPaymentFlowLabel,
  AdminPaymentOutcome,
  buildAdminPaymentOutcomeHtml,
  buildAdminPaymentOutcomeSubject,
  buildAdminPaymentOutcomeText,
  flowLabelFromCode,
  stageLabelFromCode,
} from './admin-payment.mail';
import { emailBrandingFromConfig } from './email-html-branding';
import { MailService } from './mail.service';

export type NotifyAdminPaymentInput = {
  outcome: AdminPaymentOutcome;
  flow:
    | 'BOOKING_QUOTE'
    | 'VENUE_SEAT'
    | 'CLASS_SESSION'
    | 'FIXED_TICKET';
  customerName: string;
  customerEmail: string;
  amount: number;
  currency?: string;
  contextLabel: string;
  reference?: string;
  stage?: 'FULL' | 'DEPOSIT' | 'BALANCE' | null;
};

@Injectable()
export class AdminPaymentNotifyService {
  private readonly logger = new Logger(AdminPaymentNotifyService.name);

  constructor(
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  adminOpsEmail(): string {
    return (
      this.config.get<string>('ADMIN_OPS_EMAIL')?.trim() ||
      'shamellgolden@gmail.com'
    );
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
      this.config.get<string>('APP_PUBLIC_NAME')?.trim() ??
      'Shamell Entertainment';
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
      amountUsd,
      contextLabel: input.contextLabel,
      reference: input.reference,
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
      this.logger.error(
        `admin-payment-notify-failed outcome=${input.outcome} reason=${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
