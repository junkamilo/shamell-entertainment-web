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
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#0c0610;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0c0610;padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;border:1px solid rgba(212,175,106,0.35);border-radius:16px;background:linear-gradient(165deg,#1a0d24 0%,#120818 100%);">
        <tr><td style="padding:28px 26px 22px;border-bottom:1px solid rgba(212,175,106,0.2);">
          ${logoBlock}
          <h1 style="margin:12px 0 0;font-size:22px;line-height:1.35;color:#fff8e6;font-weight:600;">Class confirmed</h1>
        </td></tr>
        <tr><td style="padding:24px 26px 28px;font-family:Georgia,serif;">
          <p style="margin:0;font-size:15px;line-height:1.75;color:#d6cfbd;">Hello <strong style="color:#fff8e6;">${name}</strong>,</p>
          <p style="margin:16px 0 0;font-size:15px;line-height:1.75;color:#d6cfbd;">Your class spot is confirmed for <strong style="color:#fff8e6;">${event}</strong>.</p>
          <p style="margin:16px 0 0;font-size:15px;line-height:1.75;color:#d6cfbd;"><strong>Session:</strong> ${session}<br/><strong>Confirmation:</strong> <span style="color:#e8d5a3;">#${confirmation}</span><br/><strong>Amount paid:</strong> ${amount}</p>
          <p style="margin:18px 0 0;font-size:14px;line-height:1.65;color:#b9b09f;">Please present this email at check-in.</p>
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
