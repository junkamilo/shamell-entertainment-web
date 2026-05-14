import { buildEmailLogoWordmarkHtml, plainTextBrandLead } from '../mail/email-html-branding';

export type BookingInquiryAckTemplateInput = {
  /** First word of full name, or full display name. */
  recipientFirstName: string;
  appPublicName: string;
  /** Optional public site URL for footer link and logo asset. */
  siteUrl?: string;
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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
  const siteLink =
    siteUrl ?
      `<p style="margin:22px 0 0;font-size:13px;line-height:1.7;color:#b9b09f;">
          <a href="${escapeHtml(siteUrl)}" style="color:#e8d5a3;text-decoration:underline;">Visit our website</a>
        </p>`
    : '';
  const logoBlock = buildEmailLogoWordmarkHtml(siteUrl);

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#0c0610;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0c0610;padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;border:1px solid rgba(212,175,106,0.35);border-radius:16px;background:linear-gradient(165deg,#1a0d24 0%,#120818 100%);overflow:hidden;">
          <tr>
            <td style="padding:28px 26px 22px;border-bottom:1px solid rgba(212,175,106,0.2);">
              ${logoBlock}
              <p style="margin:12px 0 0;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#c9a962;">${app}</p>
              <h1 style="margin:12px 0 0;font-size:22px;line-height:1.35;color:#fff8e6;font-weight:600;">Your booking inquiry was received</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 26px 28px;">
              <p style="margin:0;font-size:15px;line-height:1.75;color:#d6cfbd;">Hi <strong style="color:#fff8e6;">${name}</strong>,</p>
              <p style="margin:16px 0 0;font-size:15px;line-height:1.75;color:#d6cfbd;">
                Thank you for completing the <strong style="color:#fff8e6;">booking inquiry</strong> form. Your request will be handled with care.
              </p>
              <p style="margin:16px 0 0;font-size:15px;line-height:1.75;color:#d6cfbd;">
                The <strong style="color:#fff8e6;">${app}</strong> team will reach out shortly to go over the details and finalize your reservation.
              </p>
              <p style="margin:16px 0 0;font-size:15px;line-height:1.75;color:#d6cfbd;">
                If you would like to add anything in the meantime, reply to this email or contact us again through the website.
              </p>
              <p style="margin:22px 0 0;font-size:14px;line-height:1.65;color:#b9b09f;">Warm regards,<br /><span style="color:#e8d5a3;">${app} Team</span></p>
              ${siteLink}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
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
