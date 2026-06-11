import {
  buildEmailHeading,
  buildEmailLabelLine,
  buildEmailParagraph,
  buildEmailSiteLink,
  buildPremiumEmail,
} from '../mail/email-html-layout';
import { emailLightInlineStyle } from '../mail/email-html-tokens';
import { escapeHtml } from '../mail/email-html.util';
import {
  buildEmailLogoWordmarkHtml,
  plainTextBrandLead,
  type EmailBranding,
} from '../mail/email-html-branding';

export type ConciergeInquiryAckTemplateInput = {
  recipientFirstName: string;
  appPublicName: string;
  siteUrl?: string;
  branding?: EmailBranding;
};

export function buildConciergeInquiryAckSubject(appPublicName: string): string {
  const app = appPublicName.trim() || 'Shamell';
  return `${app} — We received your concierge inquiry`;
}

export function buildConciergeInquiryAckHtml(
  input: ConciergeInquiryAckTemplateInput,
): string {
  const name = escapeHtml(input.recipientFirstName.trim() || 'Hello');
  const app = escapeHtml(input.appPublicName.trim() || 'Shamell');
  const siteUrl = input.siteUrl?.trim();
  const siteLink = siteUrl ? buildEmailSiteLink(siteUrl) : '';
  const logoBlock = buildEmailLogoWordmarkHtml(input.branding ?? siteUrl);

  const header = `${logoBlock}
${buildEmailLabelLine(app)}
${buildEmailHeading('We received your concierge inquiry', 1)}`;

  const body = `${buildEmailParagraph(`Hi <strong class="email-text-primary" style="color:${emailLightInlineStyle('textPrimary')};">${name}</strong>,`)}
${buildEmailParagraph('Thank you for your concierge guidance inquiry. We have received your message and appreciate the details you shared.')}
${buildEmailParagraph(`The <strong class="email-text-primary" style="color:${emailLightInlineStyle('textPrimary')};">${app}</strong> team will be in touch soon to answer your questions and help you choose the experience that best fits your event.`)}
${buildEmailParagraph('If you need to add anything in the meantime, reply to this email or reach out again through the website.')}
<p class="email-text-muted" style="margin:22px 0 0;font-size:14px;line-height:1.65;color:${emailLightInlineStyle('textMuted')};">Warm regards,<br /><span class="email-text-accent" style="color:${emailLightInlineStyle('textAccent')};">${app} Team</span></p>
${siteLink}`;

  return buildPremiumEmail({
    title: `${input.appPublicName} — Concierge inquiry`,
    headerHtml: header,
    bodyHtml: body,
  });
}

export function buildConciergeInquiryAckText(
  input: ConciergeInquiryAckTemplateInput,
): string {
  const name = input.recipientFirstName.trim() || 'Hello';
  const app = input.appPublicName.trim() || 'Shamell';
  const site = input.siteUrl?.trim();
  const lines = [
    plainTextBrandLead(site),
    `${app} — We received your concierge inquiry`,
    '',
    `Hi ${name},`,
    '',
    'Thank you for your concierge guidance inquiry. We have received your message and appreciate the details you shared.',
    '',
    `The ${app} team will be in touch soon to answer your questions and help you choose the experience that best fits your event.`,
    '',
    'If you need to add anything in the meantime, reply to this email or reach out again through the website.',
    '',
    'Warm regards,',
    `${app} Team`,
  ];
  if (site) {
    lines.push('', `Website: ${site}`);
  }
  return lines.join('\n');
}
