import { buildPaymentActionEmail } from '../mail/email-html-layout';
import { escapeHtml } from '../mail/email-html.util';
import {
  buildEmailLogoWordmarkHtml,
  plainTextBrandLead,
  type EmailBranding,
} from '../mail/email-html-branding';

export type ClassPaymentRequestInput = {
  recipientName: string;
  appPublicName: string;
  frontendBaseUrl?: string;
  branding?: EmailBranding;
  enrollmentReference: string;
  eventLabel: string;
  classLabel: string;
  amountUsd: string;
  payUrl: string;
};

export function buildClassPaymentRequestSubject(appPublicName: string): string {
  return `${appPublicName} — Complete your class payment`;
}

export function buildClassPaymentRequestHtml(
  input: ClassPaymentRequestInput,
): string {
  const logoBlock = buildEmailLogoWordmarkHtml(
    input.branding ?? input.frontendBaseUrl,
  );

  return buildPaymentActionEmail({
    title: 'Complete your class reservation',
    preheader: 'Complete your payment — Pay now inside',
    logoBlock,
    heading: 'Complete your class reservation',
    greeting: `Hi ${escapeHtml(input.recipientName)},`,
    introParagraph:
      'Your class spot has been held. Please use the secure link below to complete your payment.',
    amountUsd: input.amountUsd,
    cta: { label: 'Pay now', href: input.payUrl },
    detailLines: [
      { label: 'Booking reference', value: input.enrollmentReference },
      { label: 'Event', value: input.eventLabel },
      { label: 'Class', value: input.classLabel },
    ],
    disclaimer: 'Tax is calculated at checkout based on your billing address.',
  });
}

export function buildClassPaymentRequestText(
  input: ClassPaymentRequestInput,
): string {
  return [
    plainTextBrandLead(input.frontendBaseUrl),
    `${input.appPublicName} — Complete your class payment`,
    '',
    `Pay now: ${input.payUrl}`,
    '',
    `Reference: ${input.enrollmentReference}`,
    `Event: ${input.eventLabel}`,
    `Class: ${input.classLabel}`,
    `Amount: ${input.amountUsd}`,
  ].join('\n');
}
