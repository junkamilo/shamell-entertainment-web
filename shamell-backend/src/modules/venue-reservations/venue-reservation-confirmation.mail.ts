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

export type VenueReservationConfirmationTemplateInput = {
  recipientName: string;
  appPublicName: string;
  frontendBaseUrl?: string;
  branding?: EmailBranding;
  eventDate: Date;
  reservationTimezone: string;
  reservationKindLabel: 'Table' | 'Chair';
  layoutItemLabel: string;
};

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
  const logoBlock = buildEmailLogoWordmarkHtml(
    input.branding ?? input.frontendBaseUrl,
  );
  const siteUrl = input.frontendBaseUrl?.trim();

  const header = `${logoBlock}
${buildEmailLabelLine(appName)}
${buildEmailHeading('Your reservation is confirmed', 1)}`;

  const body = `${buildEmailParagraph(`Hi ${safeName},`)}
${buildEmailParagraph(`Your ${kindLabel.toLowerCase()} reservation was successful. We have received your payment and your spot is now secured.`)}
${buildEmailCallout(`
<p class="email-text-primary" style="margin:0;font-size:15px;line-height:1.6;color:${emailLightInlineStyle('textPrimary')};"><strong>${kindLabel} reserved</strong></p>
<p class="email-text-primary" style="margin:6px 0 0;font-size:16px;line-height:1.5;color:${emailLightInlineStyle('textPrimary')};">${itemLabel}</p>
<p class="email-text-body" style="margin:12px 0 0;font-size:14px;line-height:1.6;color:${emailLightInlineStyle('textBody')};"><strong style="color:${emailLightInlineStyle('textPrimary')};">Event date:</strong> ${dateLine}</p>
`)}
${siteUrl ? buildEmailSiteLink(siteUrl) : ''}
${buildEmailFooterDisclaimer('If you did not request this reservation, please contact us using the information on our website.')}
`;

  return buildPremiumEmail({
    title: `${input.appPublicName} — Reservation confirmed`,
    headerHtml: header,
    bodyHtml: body,
  });
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
    input.frontendBaseUrl?.trim()
      ? `Website: ${input.frontendBaseUrl.trim()}`
      : '',
    '',
    'If you did not request this reservation, please contact us through our website.',
  ].filter((l) => l !== '');
  return lines.join('\n');
}
