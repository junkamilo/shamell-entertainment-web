import { buildPaymentActionEmail } from '../../mail/utils/email-html-layout';
import { escapeHtml } from '../../mail/utils/email-html.util';
import {
  buildEmailLogoWordmarkHtml,
  plainTextBrandLead,
} from '../../mail/utils/email-html-branding';
import type { ClassPaymentRequestInput } from '../types/upcoming-events.types';

export type { ClassPaymentRequestInput } from '../types/upcoming-events.types';

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
