import type { SanitizedInquiryDetails } from '../contact/contact-inquiry-details';
import {
  buildEmailCallout,
  buildEmailFooterDisclaimer,
  buildEmailHeading,
  buildEmailLabelLine,
  buildEmailParagraph,
  buildEmailSiteLink,
  buildPremiumEmail,
} from '../mail/email-html-layout';
import { emailLightInlineStyle } from '../mail/email-html-tokens';
import { escapeHtml } from '../mail/email-html.util';
import {
  buildEmailLogoWordmarkHtml,
  plainTextBrandLead,
  type EmailBranding,
} from '../mail/email-html-branding';

export type BookingConfirmationTemplateInput = {
  recipientName: string;
  timeZone: string;
  eventDate: Date;
  eventTimeStart?: string;
  eventTimeEnd?: string;
  location: string;
  serviceLabel: string;
  serviceHeading?: string;
  eventTypeLabel?: string;
  occasionLabel?: string;
  guestCount?: number | null;
  appPublicName: string;
  frontendBaseUrl?: string;
  branding?: EmailBranding;
  emailVariant?: 'default' | 'inbox_from_contact';
};

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

export function buildBookingConfirmationHtml(
  input: BookingConfirmationTemplateInput,
): string {
  const safeName = escapeHtml(input.recipientName.trim() || 'Guest');
  const dateLine = formatEventDateInZone(input.eventDate, input.timeZone);
  const { line: timeLine, hasTimes } = timeRangeLine(
    input.eventTimeStart,
    input.eventTimeEnd,
  );
  const location = escapeHtml(input.location.trim());
  const serviceHeading = escapeHtml((input.serviceHeading ?? 'Service').trim());
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
      ? buildEmailParagraph(
          `Guests: <strong class="email-text-primary" style="color:${emailLightInlineStyle('textPrimary')};">${input.guestCount}</strong>`,
        )
      : '';

  const siteUrl = input.frontendBaseUrl?.trim();
  const siteLink = siteUrl ? buildEmailSiteLink(siteUrl) : '';

  const timeBlock = hasTimes
    ? buildEmailParagraph(
        `<strong>Time:</strong> ${escapeHtml(timeLine)}`,
        'primary',
      )
    : '';

  const metaRows = [
    eventType
      ? `<tr><td class="email-text-muted" style="padding:6px 0;color:${emailLightInlineStyle('textMuted')};font-size:13px;width:120px;">Event type</td><td class="email-text-primary" style="padding:6px 0;color:${emailLightInlineStyle('textPrimary')};font-size:14px;">${eventType}</td></tr>`
      : '',
    occasion
      ? `<tr><td class="email-text-muted" style="padding:6px 0;color:${emailLightInlineStyle('textMuted')};font-size:13px;">Occasion</td><td class="email-text-primary" style="padding:6px 0;color:${emailLightInlineStyle('textPrimary')};font-size:14px;">${occasion}</td></tr>`
      : '',
  ]
    .filter(Boolean)
    .join('');

  const logoBlock = buildEmailLogoWordmarkHtml(
    input.branding ?? input.frontendBaseUrl,
  );
  const variant = input.emailVariant ?? 'default';
  const introSecond =
    variant === 'inbox_from_contact'
      ? `${buildEmailParagraph('We are pleased to confirm your reservation is on file. We look forward to seeing you on the agreed date and at the venue below.')}
${buildEmailParagraph('Here is a summary of what we have scheduled:')}`
      : buildEmailParagraph(
          'Your booking has been scheduled successfully. Here are the details:',
        );

  const header = `${logoBlock}
${buildEmailLabelLine(app)}
${buildEmailHeading('Your reservation is confirmed', 1)}`;

  const body = `${buildEmailParagraph(`Hi ${safeName},`, 'body')}
${introSecond}
${buildEmailCallout(`
<p class="email-text-primary" style="margin:0;font-size:15px;line-height:1.6;color:${emailLightInlineStyle('textPrimary')};"><strong>When</strong></p>
<p class="email-text-primary" style="margin:6px 0 0;font-size:16px;line-height:1.5;color:${emailLightInlineStyle('textPrimary')};">${escapeHtml(dateLine)}</p>
${timeBlock}
`)}
${buildEmailParagraph(`<strong style="color:${emailLightInlineStyle('textPrimary')};">Where:</strong> ${location}`)}
${buildEmailParagraph(`<strong style="color:${emailLightInlineStyle('textPrimary')};">${serviceHeading}:</strong> ${service}`)}
${guestCount}
${metaRows ? `<table role="presentation" class="email-divider" width="100%" style="margin-top:16px;border-collapse:collapse;">${metaRows}</table>` : ''}
${siteLink}
${buildEmailFooterDisclaimer('If you did not request this reservation, please contact us using the information on our website.')}
`;

  return buildPremiumEmail({
    title: `${input.appPublicName} — Reservation confirmed`,
    headerHtml: header,
    bodyHtml: body,
  });
}

export function buildBookingConfirmationText(
  input: BookingConfirmationTemplateInput,
): string {
  const dateLine = formatEventDateInZone(input.eventDate, input.timeZone);
  const { line: timeLine, hasTimes } = timeRangeLine(
    input.eventTimeStart,
    input.eventTimeEnd,
  );
  const variant = input.emailVariant ?? 'default';
  const introLines =
    variant === 'inbox_from_contact'
      ? [
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
    ...(input.guestCount != null && input.guestCount > 0
      ? [`Guests: ${input.guestCount}`]
      : []),
    ...(input.eventTypeLabel?.trim()
      ? [`Event type: ${input.eventTypeLabel.trim()}`]
      : []),
    ...(input.occasionLabel?.trim()
      ? [`Occasion: ${input.occasionLabel.trim()}`]
      : []),
    '',
    input.frontendBaseUrl?.trim()
      ? `Website: ${input.frontendBaseUrl.trim()}`
      : '',
    '',
    'If you did not request this reservation, please contact us through our website.',
  ].filter((l) => l !== '');
  return lines.join('\n');
}

export function timesFromDetails(
  details: SanitizedInquiryDetails | undefined,
): { start?: string; end?: string } {
  if (!details) return {};
  const start = details.eventTimeStart?.trim();
  const end = details.eventTimeEnd?.trim();
  return {
    start: start && /^\d{2}:\d{2}$/.test(start) ? start : undefined,
    end: end && /^\d{2}:\d{2}$/.test(end) ? end : undefined,
  };
}
