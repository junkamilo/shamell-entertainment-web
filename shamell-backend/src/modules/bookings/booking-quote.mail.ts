import {
  buildEmailLogoWordmarkHtml,
  plainTextBrandLead,
} from '../mail/email-html-branding';

type QuoteMailInput = {
  recipientName: string;
  appPublicName: string;
  frontendBaseUrl?: string;
  bookingReference: string;
  totalAmountUsd: string;
  depositAmountUsd?: string;
  balanceAmountUsd?: string;
  payUrl: string;
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildBookingQuoteSubject(appPublicName: string): string {
  return `${appPublicName} — Complete your payment`;
}

export function buildBookingQuoteHtml(input: QuoteMailInput): string {
  const logoBlock = buildEmailLogoWordmarkHtml(input.frontendBaseUrl);
  return `
  <html><body style="font-family:Arial,sans-serif;background:#0f0818;color:#f7f2e8;padding:24px;">
    <div style="max-width:580px;margin:0 auto;border:1px solid rgba(212,175,55,.3);border-radius:14px;padding:22px;background:#1a1026;">
      ${logoBlock}
      <h1 style="font-size:22px;margin:10px 0;">Complete your payment</h1>
      <p>Hi ${escapeHtml(input.recipientName)},</p>
      <p>Thank you for your inquiry. Please use the secure link below to complete your payment.</p>
      <p><strong>Booking reference:</strong> ${escapeHtml(input.bookingReference)}</p>
      <p><strong>Total:</strong> ${escapeHtml(input.totalAmountUsd)}</p>
      ${
        input.depositAmountUsd
          ? `<p><strong>Deposit:</strong> ${escapeHtml(input.depositAmountUsd)}</p>`
          : ''
      }
      ${
        input.balanceAmountUsd
          ? `<p><strong>Remaining balance:</strong> ${escapeHtml(input.balanceAmountUsd)}</p>`
          : ''
      }
      <div style="margin-top:18px;">
        <a href="${escapeHtml(input.payUrl)}" style="display:inline-block;padding:12px 20px;border-radius:8px;background:#d4af37;color:#1a1026;text-decoration:none;font-weight:700;">Pay now</a>
      </div>
    </div>
  </body></html>
  `.trim();
}

export function buildBookingQuoteText(input: QuoteMailInput): string {
  return [
    plainTextBrandLead(input.frontendBaseUrl),
    `${input.appPublicName} — Complete your payment`,
    '',
    `Hi ${input.recipientName},`,
    'Please use the secure link below to complete your payment.',
    `Booking reference: ${input.bookingReference}`,
    `Total: ${input.totalAmountUsd}`,
    ...(input.depositAmountUsd ? [`Deposit: ${input.depositAmountUsd}`] : []),
    ...(input.balanceAmountUsd
      ? [`Remaining balance: ${input.balanceAmountUsd}`]
      : []),
    '',
    `Pay now: ${input.payUrl}`,
  ].join('\n');
}

export function buildBookingDepositPaidSubject(appPublicName: string): string {
  return `${appPublicName} — Deposit received`;
}

export function buildBookingDepositPaidText(input: {
  appPublicName: string;
  recipientName: string;
  bookingReference: string;
  amountUsd: string;
}): string {
  return `${input.appPublicName} — Deposit received\n\nHi ${input.recipientName},\nWe received your deposit for booking ${input.bookingReference}.\nAmount paid: ${input.amountUsd}\nYour booking remains pending until the balance is paid.`;
}

export function buildBookingFullyPaidSubject(appPublicName: string): string {
  return `${appPublicName} — Your reservation is confirmed`;
}

export function buildBookingFullyPaidText(input: {
  appPublicName: string;
  recipientName: string;
  bookingReference: string;
  amountUsd: string;
}): string {
  return `${input.appPublicName} — Your reservation is confirmed\n\nHi ${input.recipientName},\nYour payment has been completed and your reservation is now confirmed.\nBooking reference: ${input.bookingReference}\nPaid amount: ${input.amountUsd}`;
}

