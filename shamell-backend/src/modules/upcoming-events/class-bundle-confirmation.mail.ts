import {
  buildEmailHeading,
  buildEmailParagraph,
  buildPremiumEmail,
} from '../mail/email-html-layout';
import { emailLightInlineStyle } from '../mail/email-html-tokens';
import { escapeHtml } from '../mail/email-html.util';
import {
  buildEmailLogoWordmarkHtml,
  plainTextBrandLead,
  type EmailBranding,
} from '../mail/email-html-branding';

export type ClassBundleLineItem = {
  sessionLabel: string;
  amount: string;
  confirmationReference: string;
};

export function buildClassBundleConfirmationSubject(
  eventName: string,
  sectionCount: number,
): string {
  const noun = sectionCount === 1 ? 'class' : 'classes';
  return `Classes confirmed — ${eventName} (${sectionCount} ${noun})`;
}

export function buildClassBundleConfirmationText(input: {
  eventName: string;
  customerName: string;
  dateLabel: string;
  totalAmount: string;
  lines: ClassBundleLineItem[];
  siteBaseUrl?: string;
}): string {
  const lineBlocks = input.lines.map(
    (line) =>
      `• ${line.sessionLabel}\n  Amount: ${line.amount}\n  Confirmation #${line.confirmationReference}`,
  );
  return [
    plainTextBrandLead(input.siteBaseUrl),
    `Classes confirmed — ${input.eventName}`,
    '',
    `Hello ${input.customerName},`,
    '',
    `Your purchase for ${input.eventName} on ${input.dateLabel} is confirmed.`,
    `Total paid: ${input.totalAmount}`,
    '',
    'Your classes:',
    ...lineBlocks,
    '',
    'Please present this email at check-in for each class.',
    '',
    'Thank you,',
    'Shamell Entertainment',
    ...(input.siteBaseUrl ? ['', `Website: ${input.siteBaseUrl}`] : []),
  ].join('\n');
}

export function buildClassBundleConfirmationHtml(input: {
  eventName: string;
  customerName: string;
  dateLabel: string;
  totalAmount: string;
  lines: ClassBundleLineItem[];
  branding?: string | EmailBranding;
}): string {
  const name = escapeHtml(input.customerName);
  const event = escapeHtml(input.eventName);
  const dateLabel = escapeHtml(input.dateLabel);
  const total = escapeHtml(input.totalAmount);
  const logoBlock = buildEmailLogoWordmarkHtml(input.branding);
  const rows = input.lines
    .map((line) => {
      const session = escapeHtml(line.sessionLabel);
      const amount = escapeHtml(line.amount);
      const ref = escapeHtml(line.confirmationReference);
      return `<tr>
<td class="email-divider" style="padding:12px 0;border-bottom:1px solid ${emailLightInlineStyle('divider')};">
<p class="email-text-body" style="margin:0;font-size:14px;line-height:1.6;color:${emailLightInlineStyle('textBody')};"><strong class="email-text-primary" style="color:${emailLightInlineStyle('textPrimary')};">${session}</strong><br/>
<span class="email-text-muted" style="color:${emailLightInlineStyle('textMuted')};">Amount:</span> ${amount}<br/>
<span class="email-text-muted" style="color:${emailLightInlineStyle('textMuted')};">Confirmation:</span> <span class="email-text-accent" style="color:${emailLightInlineStyle('textAccent')};font-weight:600;">#${ref}</span></p>
</td>
</tr>`;
    })
    .join('');

  const header = `${logoBlock}
${buildEmailHeading('Classes confirmed', 1)}`;

  const body = `${buildEmailParagraph(`Hello <strong class="email-text-primary" style="color:${emailLightInlineStyle('textPrimary')};">${name}</strong>,`)}
${buildEmailParagraph(`Your purchase for <strong class="email-text-primary" style="color:${emailLightInlineStyle('textPrimary')};">${event}</strong> on <strong class="email-text-primary" style="color:${emailLightInlineStyle('textPrimary')};">${dateLabel}</strong> is confirmed.`)}
${buildEmailParagraph(`<strong>Total paid:</strong> ${total}`)}
<table role="presentation" class="email-divider" width="100%" cellspacing="0" cellpadding="0" style="margin-top:18px;">${rows}</table>
${buildEmailParagraph('Please present this email at check-in for each class.', 'muted')}
<p class="email-text-muted" style="margin:22px 0 0;font-size:14px;color:${emailLightInlineStyle('textMuted')};">Thank you,<br/><span class="email-text-accent" style="color:${emailLightInlineStyle('textAccent')};">Shamell Entertainment</span></p>`;

  return buildPremiumEmail({
    title: `Classes confirmed — ${input.eventName}`,
    headerHtml: header,
    bodyHtml: body,
  });
}
