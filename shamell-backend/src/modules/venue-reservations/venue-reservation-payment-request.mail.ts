import {
  buildEmailCtaButton,
  buildEmailHeading,
  buildEmailParagraph,
  buildEmailSimpleCardBody,
} from '../mail/email-html-layout';
import { escapeHtml } from '../mail/email-html.util';
import {
  buildEmailLogoWordmarkHtml,
  plainTextBrandLead,
  type EmailBranding,
} from '../mail/email-html-branding';

export type VenueReservationPaymentRequestInput = {
  recipientName: string;
  appPublicName: string;
  frontendBaseUrl?: string;
  branding?: EmailBranding;
  reservationReference: string;
  eventLabel: string;
  seatLabel: string;
  amountUsd: string;
  payUrl: string;
};

export function buildVenueReservationPaymentRequestSubject(
  appPublicName: string,
): string {
  return `${appPublicName} — Complete your seat reservation payment`;
}

export function buildVenueReservationPaymentRequestHtml(
  input: VenueReservationPaymentRequestInput,
): string {
  const logoBlock = buildEmailLogoWordmarkHtml(
    input.branding ?? input.frontendBaseUrl,
  );
  const extra = [
    `<p class="email-text-body" style="margin:0 0 14px;font-size:15px;line-height:1.7;"><strong>Booking reference:</strong> ${escapeHtml(input.reservationReference)}</p>`,
    `<p class="email-text-body" style="margin:0 0 14px;font-size:15px;line-height:1.7;"><strong>Event:</strong> ${escapeHtml(input.eventLabel)}</p>`,
    `<p class="email-text-body" style="margin:0 0 14px;font-size:15px;line-height:1.7;"><strong>Seat:</strong> ${escapeHtml(input.seatLabel)}</p>`,
    `<p class="email-text-body" style="margin:0 0 14px;font-size:15px;line-height:1.7;"><strong>Amount:</strong> ${escapeHtml(input.amountUsd)}</p>`,
  ].join('');
  const inner = `
${logoBlock}
${buildEmailHeading('Complete your seat reservation', 1)}
${buildEmailParagraph(`Hi ${escapeHtml(input.recipientName)},`)}
${buildEmailParagraph('Your seat has been held. Please use the secure link below to complete your payment.')}
${extra}
${buildEmailCtaButton('Pay now', input.payUrl)}`;
  return buildEmailSimpleCardBody(inner);
}

export function buildVenueReservationPaymentRequestText(
  input: VenueReservationPaymentRequestInput,
): string {
  return [
    plainTextBrandLead(input.frontendBaseUrl),
    `${input.appPublicName} — Complete your seat reservation payment`,
    '',
    `Hi ${input.recipientName},`,
    'Your seat has been held. Please use the secure link below to complete your payment.',
    `Booking reference: ${input.reservationReference}`,
    `Event: ${input.eventLabel}`,
    `Seat: ${input.seatLabel}`,
    `Amount: ${input.amountUsd}`,
    '',
    `Pay now: ${input.payUrl}`,
  ].join('\n');
}
