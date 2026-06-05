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
        <td style="padding:12px 0;border-bottom:1px solid rgba(212,175,106,0.15);">
          <p style="margin:0;font-size:14px;line-height:1.6;color:#d6cfbd;"><strong style="color:#fff8e6;">${session}</strong><br/>
          <span style="color:#b9b09f;">Amount:</span> ${amount}<br/>
          <span style="color:#b9b09f;">Confirmation:</span> <span style="color:#e8d5a3;font-weight:600;">#${ref}</span></p>
        </td>
      </tr>`;
    })
    .join('');
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#0c0610;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0c0610;padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;border:1px solid rgba(212,175,106,0.35);border-radius:16px;background:linear-gradient(165deg,#1a0d24 0%,#120818 100%);">
        <tr><td style="padding:28px 26px 22px;border-bottom:1px solid rgba(212,175,106,0.2);">
          ${logoBlock}
          <h1 style="margin:12px 0 0;font-size:22px;line-height:1.35;color:#fff8e6;font-weight:600;">Classes confirmed</h1>
        </td></tr>
        <tr><td style="padding:24px 26px 28px;font-family:Georgia,serif;">
          <p style="margin:0;font-size:15px;line-height:1.75;color:#d6cfbd;">Hello <strong style="color:#fff8e6;">${name}</strong>,</p>
          <p style="margin:16px 0 0;font-size:15px;line-height:1.75;color:#d6cfbd;">Your purchase for <strong style="color:#fff8e6;">${event}</strong> on <strong style="color:#fff8e6;">${dateLabel}</strong> is confirmed.</p>
          <p style="margin:16px 0 0;font-size:15px;line-height:1.75;color:#d6cfbd;"><strong>Total paid:</strong> ${total}</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:18px;">${rows}</table>
          <p style="margin:20px 0 0;font-size:14px;line-height:1.65;color:#b9b09f;">Please present this email at check-in for each class.</p>
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
