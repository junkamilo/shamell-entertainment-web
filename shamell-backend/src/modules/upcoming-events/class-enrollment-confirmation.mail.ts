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

export function buildClassEnrollmentConfirmationSubject(
  eventName: string,
): string {
  return `Class confirmed — ${eventName}`;
}

export function buildClassEnrollmentConfirmationText(input: {
  eventName: string;
  customerName: string;
  sessionLabel: string;
  amount: string;
  confirmationReference: string;
  siteBaseUrl?: string;
}): string {
  return [
    plainTextBrandLead(input.siteBaseUrl),
    `Class confirmed — ${input.eventName}`,
    '',
    `Hello ${input.customerName},`,
    '',
    `Your class spot is confirmed for ${input.eventName}.`,
    `Session: ${input.sessionLabel}`,
    `Confirmation #${input.confirmationReference}`,
    `Amount paid: ${input.amount}`,
    '',
    'Please present this email at check-in.',
    '',
    'Thank you,',
    'Shamell Entertainment',
    ...(input.siteBaseUrl ? ['', `Website: ${input.siteBaseUrl}`] : []),
  ].join('\n');
}

export function buildClassEnrollmentConfirmationHtml(input: {
  eventName: string;
  customerName: string;
  sessionLabel: string;
  amount: string;
  confirmationReference: string;
  branding?: string | EmailBranding;
}): string {
  const name = escapeHtml(input.customerName);
  const event = escapeHtml(input.eventName);
  const session = escapeHtml(input.sessionLabel);
  const amount = escapeHtml(input.amount);
  const confirmation = escapeHtml(input.confirmationReference);
  const logoBlock = buildEmailLogoWordmarkHtml(input.branding);

  const header = `${logoBlock}
${buildEmailHeading('Class confirmed', 1)}`;

  const body = `${buildEmailParagraph(`Hello <strong class="email-text-primary" style="color:${emailLightInlineStyle('textPrimary')};">${name}</strong>,`)}
${buildEmailParagraph(`Your class spot is confirmed for <strong class="email-text-primary" style="color:${emailLightInlineStyle('textPrimary')};">${event}</strong>.`)}
${buildEmailParagraph(`<strong>Session:</strong> ${session}<br/><strong>Confirmation:</strong> <span class="email-text-accent" style="color:${emailLightInlineStyle('textAccent')};">#${confirmation}</span><br/><strong>Amount paid:</strong> ${amount}`)}
${buildEmailParagraph('Please present this email at check-in.', 'muted')}
<p class="email-text-muted" style="margin:22px 0 0;font-size:14px;color:${emailLightInlineStyle('textMuted')};">Thank you,<br/><span class="email-text-accent" style="color:${emailLightInlineStyle('textAccent')};">Shamell Entertainment</span></p>`;

  return buildPremiumEmail({
    title: `Class confirmed — ${input.eventName}`,
    headerHtml: header,
    bodyHtml: body,
  });
}
