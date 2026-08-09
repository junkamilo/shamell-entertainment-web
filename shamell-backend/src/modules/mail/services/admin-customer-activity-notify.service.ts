import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DEFAULT_APP_PUBLIC_NAME,
  ENV_APP_PUBLIC_NAME,
} from '../constants/mail.constants';
import {
  buildAdminCustomerActivityHtml,
  buildAdminCustomerActivitySubject,
  buildAdminCustomerActivityText,
} from '../templates/admin-customer-activity.mail';
import type { NotifyAdminCustomerActivityInput } from '../types/mail.types';
import { resolveAdminOpsEmail } from '../utils/admin-ops-email.util';
import { emailBrandingFromConfig } from '../utils/email-html-branding';
import { MailService } from './mail.service';

export type { NotifyAdminCustomerActivityInput };

@Injectable()
export class AdminCustomerActivityNotifyService {
  private readonly logger = new Logger(AdminCustomerActivityNotifyService.name);

  constructor(
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  adminOpsEmail(): string {
    return resolveAdminOpsEmail(this.config);
  }

  async notifyCustomerActivity(
    input: NotifyAdminCustomerActivityInput,
  ): Promise<void> {
    const to = this.adminOpsEmail();
    if (!to) return;

    const appPublicName =
      this.config.get<string>(ENV_APP_PUBLIC_NAME)?.trim() ??
      DEFAULT_APP_PUBLIC_NAME;
    const branding = emailBrandingFromConfig(this.config);
    const frontendBaseUrl = branding.siteBaseUrl;

    const mailInput = {
      appPublicName,
      frontendBaseUrl,
      branding,
      kind: input.kind,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      reference: input.reference,
      contextLabel: input.contextLabel,
      amountUsd: input.amountUsd,
      detailsLines: input.detailsLines,
    };

    try {
      const { ok, errorText } = await this.mail.sendTransactional({
        to,
        toName: 'Shamell Admin',
        subject: buildAdminCustomerActivitySubject(
          appPublicName,
          input.kind,
          input.customerName,
        ),
        html: buildAdminCustomerActivityHtml(mailInput),
        text: buildAdminCustomerActivityText(mailInput),
      });
      if (!ok) {
        this.logger.warn(
          `admin-customer-activity-notify-failed kind=${input.kind} reason=${errorText ?? 'provider_error'}`,
        );
      }
    } catch (err) {
      this.logger.error(
        `admin-customer-activity-notify-failed kind=${input.kind} reason=${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
