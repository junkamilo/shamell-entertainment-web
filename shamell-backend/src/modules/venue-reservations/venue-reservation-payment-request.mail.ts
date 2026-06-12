import { buildPaymentActionEmail } from '../mail/email-html-layout';
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

  return buildPaymentActionEmail({
    title: 'Complete your seat reservation',
    preheader: 'Complete your payment — Pay now inside',
    logoBlock,
    heading: 'Complete your seat reservation',
    greeting: `Hi ${escapeHtml(input.recipientName)},`,
    introParagraph:
      'Your seat has been held. Please use the secure link below to complete your payment.',
    amountUsd: input.amountUsd,
    cta: { label: 'Pay now', href: input.payUrl },
    detailLines: [
      { label: 'Booking reference', value: input.reservationReference },
      { label: 'Event', value: input.eventLabel },
      { label: 'Seat', value: input.seatLabel },
    ],
    disclaimer: 'Tax is calculated at checkout based on your billing address.',
  });
}

export function buildVenueReservationPaymentRequestText(
  input: VenueReservationPaymentRequestInput,
): string {
  return [
    plainTextBrandLead(input.frontendBaseUrl),
    `${input.appPublicName} — Complete your seat reservation payment`,
    '',
    `Pay now: ${input.payUrl}`,
    '',
    `Hi ${input.recipientName},`,
    'Your seat has been held. Please use the secure link above to complete your payment.',
    `Booking reference: ${input.reservationReference}`,
    `Event: ${input.eventLabel}`,
    `Seat: ${input.seatLabel}`,
    `Amount: ${input.amountUsd}`,
  ].join('\n');
}
