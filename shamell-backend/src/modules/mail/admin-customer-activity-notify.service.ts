import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AdminCustomerActivityKind,
  buildAdminCustomerActivityHtml,
  buildAdminCustomerActivitySubject,
  buildAdminCustomerActivityText,
} from './admin-customer-activity.mail';
import { resolveAdminOpsEmail } from './admin-ops-email.util';
import { emailBrandingFromConfig } from './email-html-branding';
import { MailService } from './mail.service';

export type NotifyAdminCustomerActivityInput = {
  kind: AdminCustomerActivityKind;
  customerName: string;
  customerEmail: string;
  reference?: string;
  contextLabel?: string;
  amountUsd?: string;
  detailsLines?: string[];
};

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
      this.config.get<string>('APP_PUBLIC_NAME')?.trim() ??
      'Shamell Entertainment';
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
