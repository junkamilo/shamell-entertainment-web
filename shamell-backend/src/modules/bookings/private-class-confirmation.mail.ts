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

export function buildPrivateClassCashConfirmationSubject(
  classType: string,
): string {
  return `Private class confirmed — ${classType}`;
}

export function buildPrivateClassCashConfirmationText(input: {
  classType: string;
  customerName: string;
  sessionLabel: string;
  location: string;
  amount: string;
  confirmationReference: string;
  siteBaseUrl?: string;
}): string {
  return [
    plainTextBrandLead(input.siteBaseUrl),
    `Private class confirmed — ${input.classType}`,
    '',
    `Hello ${input.customerName},`,
    '',
    `Your private class is confirmed.`,
    `Class: ${input.classType}`,
    `When: ${input.sessionLabel}`,
    `Where: ${input.location}`,
    `Confirmation #${input.confirmationReference}`,
    `Amount paid (cash): ${input.amount}`,
    '',
    'Please present this email at check-in.',
    '',
    'Thank you,',
    'Shamell Entertainment',
    ...(input.siteBaseUrl ? ['', `Website: ${input.siteBaseUrl}`] : []),
  ].join('\n');
}

export function buildPrivateClassCashConfirmationHtml(input: {
  classType: string;
  customerName: string;
  sessionLabel: string;
  location: string;
  amount: string;
  confirmationReference: string;
  branding?: string | EmailBranding;
}): string {
  const name = escapeHtml(input.customerName);
  const classType = escapeHtml(input.classType);
  const session = escapeHtml(input.sessionLabel);
  const location = escapeHtml(input.location);
  const amount = escapeHtml(input.amount);
  const confirmation = escapeHtml(input.confirmationReference);
  const logoBlock = buildEmailLogoWordmarkHtml(input.branding);

  const header = `${logoBlock}
${buildEmailHeading('Private class confirmed', 1)}`;

  const body = `${buildEmailParagraph(`Hello <strong class="email-text-primary" style="color:${emailLightInlineStyle('textPrimary')};">${name}</strong>,`)}
${buildEmailParagraph(`Your private class is confirmed.`)}
${buildEmailParagraph(`<strong>Class:</strong> ${classType}<br/><strong>When:</strong> ${session}<br/><strong>Where:</strong> ${location}<br/><strong>Confirmation:</strong> <span class="email-text-accent" style="color:${emailLightInlineStyle('textAccent')};">#${confirmation}</span><br/><strong>Amount paid (cash):</strong> ${amount}`)}
${buildEmailParagraph('Please present this email at check-in.', 'muted')}
<p class="email-text-muted" style="margin:22px 0 0;font-size:14px;color:${emailLightInlineStyle('textMuted')};">Thank you,<br/><span class="email-text-accent" style="color:${emailLightInlineStyle('textAccent')};">Shamell Entertainment</span></p>`;

  return buildPremiumEmail({
    title: `Private class confirmed — ${input.classType}`,
    headerHtml: header,
    bodyHtml: body,
  });
}
