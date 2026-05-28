import {
  buildEmailLogoWordmarkHtml,
  plainTextBrandLead,
} from '../mail/email-html-branding';

export type VenueReservationConfirmationTemplateInput = {
  recipientName: string;
  appPublicName: string;
  frontendBaseUrl?: string;
  eventDate: Date;
  reservationTimezone: string;
  reservationKindLabel: 'Table' | 'Chair';
  layoutItemLabel: string;
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatEventDateInZone(eventDate: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(eventDate);
}

export function buildVenueReservationConfirmationSubject(
  appPublicName: string,
): string {
  return `${appPublicName} — Your reservation is confirmed`;
}

export function buildVenueReservationConfirmationHtml(
  input: VenueReservationConfirmationTemplateInput,
): string {
  const safeName = escapeHtml(input.recipientName.trim() || 'Guest');
  const appName = escapeHtml(
    input.appPublicName.trim() || 'Shamell Entertainment',
  );
  const kindLabel = escapeHtml(input.reservationKindLabel);
  const itemLabel = escapeHtml(input.layoutItemLabel.trim() || 'Reserved item');
  const dateLine = escapeHtml(
    formatEventDateInZone(input.eventDate, input.reservationTimezone),
  );
  const logoBlock = buildEmailLogoWordmarkHtml(input.frontendBaseUrl);
  const safeSiteUrl = input.frontendBaseUrl?.trim();

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#0f0818;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0f0818;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:linear-gradient(165deg,rgba(31,10,46,0.96) 0%,rgba(23,8,36,0.98) 100%);border:1px solid rgba(212,175,55,0.28);border-radius:16px;padding:28px 24px;">
          <tr><td>
            ${logoBlock}
            <p style="margin:0;font-family:Georgia,serif;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#d4af37;">${appName}</p>
            <h1 style="margin:16px 0 8px;font-family:Georgia,serif;font-size:22px;line-height:1.25;color:#fff8e6;font-weight:600;">Your reservation is confirmed</h1>
            <p style="margin:0;font-size:15px;line-height:1.7;color:#d6cfbd;">Hi ${safeName},</p>
            <p style="margin:14px 0 0;font-size:15px;line-height:1.7;color:#d6cfbd;">Your ${kindLabel.toLowerCase()} reservation was successful. We have received your payment and your spot is now secured.</p>

            <div style="margin:20px 0;padding:16px;border-radius:12px;border:1px solid rgba(212,175,55,0.22);background:rgba(0,0,0,0.2);">
              <p style="margin:0;font-size:15px;line-height:1.6;color:#fff8e6;"><strong>${kindLabel} reserved</strong></p>
              <p style="margin:6px 0 0;font-size:16px;line-height:1.5;color:#f5edd8;">${itemLabel}</p>
              <p style="margin:12px 0 0;font-size:14px;line-height:1.6;color:#d6cfbd;"><strong style="color:#fff8e6;">Event date:</strong> ${dateLine}</p>
            </div>

            ${
              safeSiteUrl
                ? `<p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#b9b09f;">
                    <a href="${escapeHtml(safeSiteUrl)}" style="color:#e8d5a3;text-decoration:underline;">Visit our website</a>
                   </p>`
                : ''
            }
            <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#8a8274;border-top:1px solid rgba(212,175,55,0.15);padding-top:16px;">
              If you did not request this reservation, please contact us using the information on our website.
            </p>
          </td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

export function buildVenueReservationConfirmationText(
  input: VenueReservationConfirmationTemplateInput,
): string {
  const kindLower = input.reservationKindLabel.toLowerCase();
  const itemLabel = input.layoutItemLabel.trim() || 'Reserved item';
  const dateLine = formatEventDateInZone(
    input.eventDate,
    input.reservationTimezone,
  );
  const lines = [
    plainTextBrandLead(input.frontendBaseUrl?.trim()),
    `${input.appPublicName.trim() || 'Shamell Entertainment'} — Your reservation is confirmed`,
    '',
    `Hi ${input.recipientName.trim() || 'Guest'},`,
    '',
    `Your ${kindLower} reservation was successful.`,
    'We have received your payment and your spot is now secured.',
    '',
    `${input.reservationKindLabel} reserved: ${itemLabel}`,
    `Event date: ${dateLine}`,
    '',
    ...(input.frontendBaseUrl?.trim()
      ? [`Website: ${input.frontendBaseUrl.trim()}`, '']
      : []),
    'If you did not request this reservation, please contact us through our website.',
  ];
  return lines.join('\n');
}
