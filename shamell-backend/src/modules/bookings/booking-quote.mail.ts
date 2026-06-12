import {
  buildEmailHeading,
  buildEmailParagraph,
  buildEmailSimpleCardBody,
  buildPaymentActionEmail,
} from '../mail/email-html-layout';
import { escapeHtml } from '../mail/email-html.util';
import {
  buildEmailLogoWordmarkHtml,
  plainTextBrandLead,
  type EmailBranding,
} from '../mail/email-html-branding';

type QuoteMailInput = {
  recipientName: string;
  appPublicName: string;
  frontendBaseUrl?: string;
  branding?: EmailBranding;
  bookingReference: string;
  totalAmountUsd: string;
  depositAmountUsd?: string;
  balanceAmountUsd?: string;
  payUrl: string;
};

export function buildBookingQuoteSubject(appPublicName: string): string {
  return `${appPublicName} — Complete your payment`;
}

export function buildBookingQuoteHtml(input: QuoteMailInput): string {
  const logoBlock = buildEmailLogoWordmarkHtml(
    input.branding ?? input.frontendBaseUrl,
  );
  const extraLines: string[] = [];
  if (input.depositAmountUsd) {
    extraLines.push(
      `<p class="email-text-body" style="margin:0 0 14px;font-size:15px;line-height:1.7;"><strong>Deposit:</strong> ${escapeHtml(input.depositAmountUsd)}</p>`,
    );
  }
  if (input.balanceAmountUsd) {
    extraLines.push(
      `<p class="email-text-body" style="margin:0 0 14px;font-size:15px;line-height:1.7;"><strong>Remaining balance:</strong> ${escapeHtml(input.balanceAmountUsd)}</p>`,
    );
  }

  return buildPaymentActionEmail({
    title: 'Complete your payment',
    preheader: 'Complete your payment — Pay now inside',
    logoBlock,
    heading: 'Complete your payment',
    greeting: `Hi ${escapeHtml(input.recipientName)},`,
    introParagraph:
      'Thank you for your inquiry. Please use the secure link below to complete your payment.',
    amountUsd: input.totalAmountUsd,
    cta: { label: 'Pay now', href: input.payUrl },
    detailLines: [
      { label: 'Booking reference', value: input.bookingReference },
      { label: 'Total', value: input.totalAmountUsd },
    ],
    extraHtml: extraLines.join(''),
  });
}

export function buildBookingQuoteText(input: QuoteMailInput): string {
  return [
    plainTextBrandLead(input.frontendBaseUrl),
    `${input.appPublicName} — Complete your payment`,
    '',
    `Pay now: ${input.payUrl}`,
    '',
    `Hi ${input.recipientName},`,
    'Please use the secure link above to complete your payment.',
    `Booking reference: ${input.bookingReference}`,
    `Total: ${input.totalAmountUsd}`,
    ...(input.depositAmountUsd ? [`Deposit: ${input.depositAmountUsd}`] : []),
    ...(input.balanceAmountUsd
      ? [`Remaining balance: ${input.balanceAmountUsd}`]
      : []),
  ].join('\n');
}

export function buildBookingDepositPaidSubject(appPublicName: string): string {
  return `${appPublicName} — Deposit received`;
}

export function buildBookingDepositPaidHtml(input: {
  recipientName: string;
  appPublicName: string;
  frontendBaseUrl?: string;
  branding?: EmailBranding;
  bookingReference: string;
  amountUsd: string;
  eventDateLabel?: string;
}): string {
  const logoBlock = buildEmailLogoWordmarkHtml(
    input.branding ?? input.frontendBaseUrl,
  );
  const extra = [
    `<p class="email-text-body" style="margin:0 0 14px;font-size:15px;line-height:1.7;"><strong>Booking reference:</strong> ${escapeHtml(input.bookingReference)}</p>`,
    input.eventDateLabel
      ? `<p class="email-text-body" style="margin:0 0 14px;font-size:15px;line-height:1.7;"><strong>Event date:</strong> ${escapeHtml(input.eventDateLabel)}</p>`
      : '',
    `<p class="email-text-body" style="margin:0 0 14px;font-size:15px;line-height:1.7;"><strong>Amount paid:</strong> ${escapeHtml(input.amountUsd)}</p>`,
  ].join('');
  const inner = `
${logoBlock}
${buildEmailHeading('Deposit received', 1)}
${buildEmailParagraph(`Hi ${escapeHtml(input.recipientName)},`)}
${buildEmailParagraph('We received your deposit. Your reservation with Shamell is in progress — the remaining balance will be collected separately.')}
${extra}`;
  return buildEmailSimpleCardBody(inner);
}

export function buildBookingDepositPaidText(input: {
  appPublicName: string;
  recipientName: string;
  bookingReference: string;
  amountUsd: string;
  eventDateLabel?: string;
}): string {
  return [
    `${input.appPublicName} — Deposit received`,
    '',
    `Hi ${input.recipientName},`,
    'We received your deposit. Your reservation with Shamell is in progress — the remaining balance will be collected separately.',
    `Booking reference: ${input.bookingReference}`,
    ...(input.eventDateLabel ? [`Event date: ${input.eventDateLabel}`] : []),
    `Amount paid: ${input.amountUsd}`,
  ].join('\n');
}

export function buildBookingFullyPaidSubject(appPublicName: string): string {
  return `${appPublicName} — Your reservation is confirmed`;
}

export function buildBookingFullyPaidHtml(input: {
  recipientName: string;
  appPublicName: string;
  frontendBaseUrl?: string;
  branding?: EmailBranding;
  bookingReference: string;
  amountUsd: string;
  eventDateLabel?: string;
}): string {
  const logoBlock = buildEmailLogoWordmarkHtml(
    input.branding ?? input.frontendBaseUrl,
  );
  const extra = [
    `<p class="email-text-body" style="margin:0 0 14px;font-size:15px;line-height:1.7;"><strong>Booking reference:</strong> ${escapeHtml(input.bookingReference)}</p>`,
    input.eventDateLabel
      ? `<p class="email-text-body" style="margin:0 0 14px;font-size:15px;line-height:1.7;"><strong>Event date:</strong> ${escapeHtml(input.eventDateLabel)}</p>`
      : '',
    `<p class="email-text-body" style="margin:0 0 14px;font-size:15px;line-height:1.7;"><strong>Amount paid:</strong> ${escapeHtml(input.amountUsd)}</p>`,
  ].join('');
  const inner = `
${logoBlock}
${buildEmailHeading('Payment complete — reservation confirmed', 1, { colorClass: 'success' })}
${buildEmailParagraph(`Hi ${escapeHtml(input.recipientName)},`)}
${buildEmailParagraph('Your payment was successful and your reservation with Shamell is now confirmed. We look forward to seeing you!')}
${extra}`;
  return buildEmailSimpleCardBody(inner);
}

export function buildBookingFullyPaidText(input: {
  appPublicName: string;
  recipientName: string;
  bookingReference: string;
  amountUsd: string;
  eventDateLabel?: string;
}): string {
  return [
    `${input.appPublicName} — Your reservation is confirmed`,
    '',
    `Hi ${input.recipientName},`,
    'Your payment was successful and your reservation with Shamell is now confirmed. We look forward to seeing you!',
    `Booking reference: ${input.bookingReference}`,
    ...(input.eventDateLabel ? [`Event date: ${input.eventDateLabel}`] : []),
    `Paid amount: ${input.amountUsd}`,
  ].join('\n');
}

export function buildBookingBalanceLinkSubject(appPublicName: string): string {
  return `${appPublicName} — Complete your balance payment`;
}

export function buildBookingBalanceLinkHtml(input: QuoteMailInput): string {
  const logoBlock = buildEmailLogoWordmarkHtml(
    input.branding ?? input.frontendBaseUrl,
  );

  return buildPaymentActionEmail({
    title: 'Complete your balance payment',
    preheader: 'Complete your balance payment — Pay now inside',
    logoBlock,
    heading: 'Complete your balance payment',
    greeting: `Hi ${escapeHtml(input.recipientName)},`,
    introParagraph:
      'Your deposit has been received. Please use the secure link below to pay the remaining balance and confirm your reservation.',
    amountUsd: input.totalAmountUsd,
    cta: { label: 'Pay balance now', href: input.payUrl },
    detailLines: [
      { label: 'Booking reference', value: input.bookingReference },
      { label: 'Balance due', value: input.totalAmountUsd },
    ],
  });
}

export function buildBookingBalanceLinkText(input: QuoteMailInput): string {
  return [
    plainTextBrandLead(input.frontendBaseUrl),
    `${input.appPublicName} — Complete your balance payment`,
    '',
    `Pay now: ${input.payUrl}`,
    '',
    `Hi ${input.recipientName},`,
    'Your deposit has been received. Please use the secure link above to pay the remaining balance.',
    `Booking reference: ${input.bookingReference}`,
    `Balance due: ${input.totalAmountUsd}`,
  ].join('\n');
}
