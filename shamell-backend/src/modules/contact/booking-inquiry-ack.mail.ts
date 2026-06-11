import type { GuideInvestmentCompute } from './booking-guide-investment';
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

export type BookingInquiryAckTemplateInput = {
  recipientFirstName: string;
  appPublicName: string;
  siteUrl?: string;
  branding?: EmailBranding;
  guideInvestment?: GuideInvestmentCompute;
};

function formatUsdEmailAmount(n: number): string {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
  return `${formatted} USD`;
}

function buildGuideInvestmentHtmlBlock(
  guide: GuideInvestmentCompute | undefined,
): string {
  if (!guide || (guide.totalUsd == null && !guide.isPartial)) return '';
  const disclaimer =
    'This is a non-binding guide based on current catalog selections — travel, production scope, and date can change the final proposal.';
  if (guide.totalUsd != null) {
    const amt = escapeHtml(formatUsdEmailAmount(guide.totalUsd));
    const partial = guide.isPartial
      ? buildEmailParagraph(
          'Some selections are priced on request; the figure above includes only items with a published guide price.',
          'muted',
        )
      : '';
    return `<div class="email-callout" style="margin:20px 0 0;padding:16px 18px;border:1px solid ${emailLightInlineStyle('calloutBorder')};border-radius:12px;background-color:${emailLightInlineStyle('calloutBg')};">
<p class="email-label" style="margin:0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:${emailLightInlineStyle('labelGold')};">Estimated guide investment</p>
<p class="email-text-accent" style="margin:10px 0 0;font-size:20px;line-height:1.3;color:${emailLightInlineStyle('textAccent')};font-weight:600;">${amt}</p>
${partial}
<p class="email-text-muted" style="margin:14px 0 0;font-size:13px;line-height:1.65;color:${emailLightInlineStyle('textMuted')};">${escapeHtml(disclaimer)}</p>
</div>`;
  }
  return `<div class="email-callout" style="margin:20px 0 0;padding:16px 18px;border:1px solid ${emailLightInlineStyle('calloutBorder')};border-radius:12px;background-color:${emailLightInlineStyle('calloutBg')};">
<p class="email-label" style="margin:0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:${emailLightInlineStyle('labelGold')};">Estimated guide investment</p>
<p class="email-text-body" style="margin:10px 0 0;font-size:15px;line-height:1.65;color:${emailLightInlineStyle('textBody')};">Your selections include items priced on request. We will confirm a tailored investment range when we follow up.</p>
<p class="email-text-muted" style="margin:14px 0 0;font-size:13px;line-height:1.65;color:${emailLightInlineStyle('textMuted')};">${escapeHtml(disclaimer)}</p>
</div>`;
}

function buildGuideInvestmentTextBlock(
  guide: GuideInvestmentCompute | undefined,
): string[] {
  if (!guide || (guide.totalUsd == null && !guide.isPartial)) return [];
  const disclaimer =
    'This is a non-binding guide based on current catalog selections — travel, production scope, and date can change the final proposal.';
  if (guide.totalUsd != null) {
    const lines = [
      '',
      'Estimated guide investment',
      formatUsdEmailAmount(guide.totalUsd),
    ];
    if (guide.isPartial) {
      lines.push(
        'Some selections are priced on request; the figure above includes only items with a published guide price.',
      );
    }
    lines.push('', disclaimer);
    return lines;
  }
  return [
    '',
    'Estimated guide investment',
    'Your selections include items priced on request. We will confirm a tailored investment range when we follow up.',
    '',
    disclaimer,
  ];
}

export function buildBookingInquiryAckSubject(appPublicName: string): string {
  const app = appPublicName.trim() || 'Shamell';
  return `${app} — We received your booking inquiry`;
}

export function buildBookingInquiryAckHtml(
  input: BookingInquiryAckTemplateInput,
): string {
  const name = escapeHtml(input.recipientFirstName.trim() || 'Hello');
  const app = escapeHtml(input.appPublicName.trim() || 'Shamell');
  const siteUrl = input.siteUrl?.trim();
  const siteLink = siteUrl ? buildEmailSiteLink(siteUrl) : '';
  const logoBlock = buildEmailLogoWordmarkHtml(input.branding ?? siteUrl);

  const header = `${logoBlock}
${buildEmailLabelLine(app)}
${buildEmailHeading('Your booking inquiry was received', 1)}`;

  const body = `${buildEmailParagraph(`Hi <strong class="email-text-primary" style="color:${emailLightInlineStyle('textPrimary')};">${name}</strong>,`)}
${buildEmailParagraph('Thank you for completing the <strong class="email-text-primary" style="color:' + emailLightInlineStyle('textPrimary') + ';">booking inquiry</strong> form. Your request will be handled with care.')}
${buildEmailParagraph(`The <strong class="email-text-primary" style="color:${emailLightInlineStyle('textPrimary')};">${app}</strong> team will reach out shortly to go over the details and finalize your reservation.`)}
${buildGuideInvestmentHtmlBlock(input.guideInvestment)}
${buildEmailParagraph('If you would like to add anything in the meantime, reply to this email or contact us again through the website.')}
<p class="email-text-muted" style="margin:22px 0 0;font-size:14px;line-height:1.65;color:${emailLightInlineStyle('textMuted')};">Warm regards,<br /><span class="email-text-accent" style="color:${emailLightInlineStyle('textAccent')};">${app} Team</span></p>
${siteLink}`;

  return buildPremiumEmail({
    title: `${input.appPublicName} — Booking inquiry`,
    headerHtml: header,
    bodyHtml: body,
  });
}

export function buildBookingInquiryAckText(
  input: BookingInquiryAckTemplateInput,
): string {
  const name = input.recipientFirstName.trim() || 'Hello';
  const app = input.appPublicName.trim() || 'Shamell';
  const site = input.siteUrl?.trim();
  const lines = [
    plainTextBrandLead(site),
    `${app} — We received your booking inquiry`,
    '',
    `Hi ${name},`,
    '',
    'Thank you for completing the booking inquiry form. Your request will be handled with care.',
    '',
    `The ${app} team will reach out shortly to go over the details and finalize your reservation.`,
    ...buildGuideInvestmentTextBlock(input.guideInvestment),
    '',
    'If you would like to add anything in the meantime, reply to this email or contact us again through the website.',
    '',
    'Warm regards,',
    `${app} Team`,
  ];
  if (site) {
    lines.push('', `Website: ${site}`);
  }
  return lines.join('\n');
}
