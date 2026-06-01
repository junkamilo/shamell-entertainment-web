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
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#0c0610;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0c0610;padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;border:1px solid rgba(212,175,106,0.35);border-radius:16px;background:linear-gradient(165deg,#1a0d24 0%,#120818 100%);">
        <tr><td style="padding:28px 26px 22px;border-bottom:1px solid rgba(212,175,106,0.2);">
          ${logoBlock}
          <h1 style="margin:12px 0 0;font-size:22px;line-height:1.35;color:#fff8e6;font-weight:600;">Ticket confirmed</h1>
        </td></tr>
        <tr><td style="padding:24px 26px 28px;font-family:Georgia,serif;">
          <p style="margin:0;font-size:15px;line-height:1.75;color:#d6cfbd;">Hello <strong style="color:#fff8e6;">${name}</strong>,</p>
          <p style="margin:16px 0 0;font-size:15px;line-height:1.75;color:#d6cfbd;">Your ticket purchase for <strong style="color:#fff8e6;">${event}</strong> was successful.</p>
          <p style="margin:16px 0 0;font-size:15px;line-height:1.75;color:#d6cfbd;"><strong>Your ticket number:</strong> #${ticket}<br/><strong>Event:</strong> ${eventDate}<br/><strong>Amount paid:</strong> ${amount}</p>
          <p style="margin:22px 0 0;font-size:14px;color:#b9b09f;">Thank you,<br/><span style="color:#e8d5a3;">Shamell Entertainment</span></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
