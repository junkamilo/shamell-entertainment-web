import type { SanitizedInquiryDetails } from '../contact/contact-inquiry-details';
import { buildEmailLogoWordmarkHtml, plainTextBrandLead } from '../mail/email-html-branding';

export type BookingConfirmationTemplateInput = {
  recipientName: string;
  timeZone: string;
  /** Calendar instant for the event (stored UTC; displayed in timeZone). */
  eventDate: Date;
  eventTimeStart?: string;
  eventTimeEnd?: string;
  location: string;
  serviceLabel: string;
  /** Default "Service"; use "Services" when multiple catalog lines are booked. */
  serviceHeading?: string;
  eventTypeLabel?: string;
  occasionLabel?: string;
  guestCount?: number | null;
  appPublicName: string;
  frontendBaseUrl?: string;
  /** Warmer copy when the guest booking originated from the admin inbox flow. */
  emailVariant?: 'default' | 'inbox_from_contact';
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Format HH:mm (24h) as en-US 12h with minutes. */
function formatUs12h(hhmm: string): string {
  if (!/^\d{2}:\d{2}$/.test(hhmm.trim())) return hhmm;
  const h = Number(hhmm.slice(0, 2));
  const m = Number(hhmm.slice(3, 5));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return hhmm;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
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

function timeRangeLine(
  start?: string,
  end?: string,
): { line: string; hasTimes: boolean } {
  if (
    start &&
    end &&
    /^\d{2}:\d{2}$/.test(start.trim()) &&
    /^\d{2}:\d{2}$/.test(end.trim())
  ) {
    return {
      line: `${formatUs12h(start)} – ${formatUs12h(end)}`,
      hasTimes: true,
    };
  }
  return { line: '', hasTimes: false };
}

export function buildBookingConfirmationSubject(appPublicName: string): string {
  return `${appPublicName} — Your reservation is confirmed`;
}

export function buildBookingConfirmationHtml(input: BookingConfirmationTemplateInput): string {
  const safeName = escapeHtml(input.recipientName.trim() || 'Guest');
  const dateLine = formatEventDateInZone(input.eventDate, input.timeZone);
  const { line: timeLine, hasTimes } = timeRangeLine(
    input.eventTimeStart,
    input.eventTimeEnd,
  );
  const location = escapeHtml(input.location.trim());
  const serviceHeading = escapeHtml(
    (input.serviceHeading ?? 'Service').trim(),
  );
  const service = escapeHtml(input.serviceLabel.trim());
  const eventType = input.eventTypeLabel?.trim()
    ? escapeHtml(input.eventTypeLabel.trim())
    : '';
  const occasion = input.occasionLabel?.trim()
    ? escapeHtml(input.occasionLabel.trim())
    : '';
  const app = escapeHtml(input.appPublicName.trim());
  const guestCount =
    input.guestCount != null && input.guestCount > 0
      ? `<p style="margin:12px 0 0;font-size:14px;line-height:1.6;color:#d6cfbd;">Guests: <strong style="color:#fff8e6;">${input.guestCount}</strong></p>`
      : '';

  const siteUrl = input.frontendBaseUrl?.trim();
  const siteLink =
    siteUrl ?
      `<p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#b9b09f;">
          <a href="${escapeHtml(siteUrl)}" style="color:#e8d5a3;text-decoration:underline;">Visit our website</a>
        </p>`
    : '';

  const timeBlock =
    hasTimes ?
      `<p style="margin:8px 0 0;font-size:15px;line-height:1.6;color:#fff8e6;"><strong>Time:</strong> ${escapeHtml(timeLine)}</p>`
    : '';

  const metaRows = [
    eventType ?
      `<tr><td style="padding:6px 0;color:#b9b09f;font-size:13px;width:120px;">Event type</td><td style="padding:6px 0;color:#fff8e6;font-size:14px;">${eventType}</td></tr>`
    : '',
    occasion ?
      `<tr><td style="padding:6px 0;color:#b9b09f;font-size:13px;">Occasion</td><td style="padding:6px 0;color:#fff8e6;font-size:14px;">${occasion}</td></tr>`
    : '',
  ]
    .filter(Boolean)
    .join('');

  const logoBlock = buildEmailLogoWordmarkHtml(input.frontendBaseUrl);
  const variant = input.emailVariant ?? 'default';
  const introSecond =
    variant === 'inbox_from_contact' ?
      `<p style="margin:14px 0 0;font-size:15px;line-height:1.7;color:#d6cfbd;">We are pleased to confirm your reservation is on file. We look forward to seeing you on the agreed date and at the venue below.</p>
            <p style="margin:14px 0 0;font-size:15px;line-height:1.7;color:#d6cfbd;">Here is a summary of what we have scheduled:</p>`
    : `<p style="margin:14px 0 0;font-size:15px;line-height:1.7;color:#d6cfbd;">Your booking has been scheduled successfully. Here are the details:</p>`;

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
            <p style="margin:0;font-family:Georgia,serif;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#d4af37;">${app}</p>
            <h1 style="margin:16px 0 8px;font-family:Georgia,serif;font-size:22px;line-height:1.25;color:#fff8e6;font-weight:600;">Your reservation is confirmed</h1>
            <p style="margin:0;font-size:15px;line-height:1.7;color:#d6cfbd;">Hi ${safeName},</p>
            ${introSecond}
            <div style="margin:20px 0;padding:16px;border-radius:12px;border:1px solid rgba(212,175,55,0.22);background:rgba(0,0,0,0.2);">
              <p style="margin:0;font-size:15px;line-height:1.6;color:#fff8e6;"><strong>When</strong></p>
              <p style="margin:6px 0 0;font-size:16px;line-height:1.5;color:#f5edd8;">${escapeHtml(dateLine)}</p>
              ${timeBlock}
            </div>
            <p style="margin:16px 0 0;font-size:15px;line-height:1.6;color:#d6cfbd;"><strong style="color:#fff8e6;">Where:</strong> ${location}</p>
            <p style="margin:12px 0 0;font-size:15px;line-height:1.6;color:#d6cfbd;"><strong style="color:#fff8e6;">${serviceHeading}:</strong> ${service}</p>
            ${guestCount}
            ${metaRows ? `<table role="presentation" width="100%" style="margin-top:16px;border-collapse:collapse;">${metaRows}</table>` : ''}
            ${siteLink}
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

export function buildBookingConfirmationText(input: BookingConfirmationTemplateInput): string {
  const dateLine = formatEventDateInZone(input.eventDate, input.timeZone);
  const { line: timeLine, hasTimes } = timeRangeLine(
    input.eventTimeStart,
    input.eventTimeEnd,
  );
  const variant = input.emailVariant ?? 'default';
  const introLines =
    variant === 'inbox_from_contact' ?
      [
        'We are pleased to confirm your reservation is on file. We look forward to seeing you on the agreed date and at the venue below.',
        '',
        'Here is a summary of what we have scheduled:',
      ]
    : ['Your booking has been scheduled successfully.', '', 'Details:'];
  const lines = [
    plainTextBrandLead(input.frontendBaseUrl?.trim()),
    `${input.appPublicName} — Your reservation is confirmed`,
    '',
    `Hi ${input.recipientName.trim() || 'Guest'},`,
    '',
    ...introLines,
    '',
    `When: ${dateLine}`,
    ...(hasTimes ? [`Time: ${timeLine}`] : []),
    `Where: ${input.location.trim()}`,
    `${input.serviceHeading ?? 'Service'}: ${input.serviceLabel.trim()}`,
    ...(input.guestCount != null && input.guestCount > 0 ?
      [`Guests: ${input.guestCount}`]
    : []),
    ...(input.eventTypeLabel?.trim() ?
      [`Event type: ${input.eventTypeLabel.trim()}`]
    : []),
    ...(input.occasionLabel?.trim() ?
      [`Occasion: ${input.occasionLabel.trim()}`]
    : []),
    '',
    input.frontendBaseUrl?.trim() ?
      `Website: ${input.frontendBaseUrl.trim()}`
    : '',
    '',
    'If you did not request this reservation, please contact us through our website.',
  ].filter((l) => l !== '');
  return lines.join('\n');
}

/** Extract HH:mm from sanitized booking details JSON. */
export function timesFromDetails(
  details: SanitizedInquiryDetails | undefined,
): { start?: string; end?: string } {
  if (!details) return {};
  const start = details.eventTimeStart?.trim();
  const end = details.eventTimeEnd?.trim();
  return {
    start:
      start && /^\d{2}:\d{2}$/.test(start) ? start : undefined,
    end: end && /^\d{2}:\d{2}$/.test(end) ? end : undefined,
  };
}
