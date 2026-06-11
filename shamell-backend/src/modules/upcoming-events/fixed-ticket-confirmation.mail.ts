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

export function buildFixedTicketConfirmationSubject(eventName: string): string {
  return `Ticket confirmed — ${eventName}`;
}

export function buildFixedTicketConfirmationText(input: {
  eventName: string;
  customerName: string;
  ticketNumber: number;
  eventDateLabel: string;
  amount: string;
  siteBaseUrl?: string;
}): string {
  return [
    plainTextBrandLead(input.siteBaseUrl),
    `Ticket confirmed — ${input.eventName}`,
    '',
    `Hello ${input.customerName},`,
    '',
    `Your ticket purchase for ${input.eventName} was successful.`,
    `Your ticket number: #${input.ticketNumber}`,
    `Event: ${input.eventDateLabel}`,
    `Amount paid: ${input.amount}`,
    '',
    'Thank you,',
    'Shamell Entertainment',
    ...(input.siteBaseUrl ? ['', `Website: ${input.siteBaseUrl}`] : []),
  ].join('\n');
}

export function buildFixedTicketConfirmationHtml(input: {
  eventName: string;
  customerName: string;
  ticketNumber: number;
  eventDateLabel: string;
  amount: string;
  branding?: string | EmailBranding;
}): string {
  const name = escapeHtml(input.customerName);
  const event = escapeHtml(input.eventName);
  const eventDate = escapeHtml(input.eventDateLabel);
  const amount = escapeHtml(input.amount);
  const ticket = escapeHtml(String(input.ticketNumber));
  const logoBlock = buildEmailLogoWordmarkHtml(input.branding);

  const header = `${logoBlock}
${buildEmailHeading('Ticket confirmed', 1)}`;

  const body = `${buildEmailParagraph(`Hello <strong class="email-text-primary" style="color:${emailLightInlineStyle('textPrimary')};">${name}</strong>,`)}
${buildEmailParagraph(`Your ticket purchase for <strong class="email-text-primary" style="color:${emailLightInlineStyle('textPrimary')};">${event}</strong> was successful.`)}
${buildEmailParagraph(`<strong>Your ticket number:</strong> #${ticket}<br/><strong>Event:</strong> ${eventDate}<br/><strong>Amount paid:</strong> ${amount}`)}
<p class="email-text-muted" style="margin:22px 0 0;font-size:14px;color:${emailLightInlineStyle('textMuted')};">Thank you,<br/><span class="email-text-accent" style="color:${emailLightInlineStyle('textAccent')};">Shamell Entertainment</span></p>`;

  return buildPremiumEmail({
    title: `Ticket confirmed — ${input.eventName}`,
    headerHtml: header,
    bodyHtml: body,
  });
}
