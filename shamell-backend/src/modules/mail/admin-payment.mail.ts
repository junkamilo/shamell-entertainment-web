import {
  buildEmailLogoWordmarkHtml,
  plainTextBrandLead,
  type EmailBranding,
} from './email-html-branding';

export type AdminPaymentOutcome =
  | 'PAID'
  | 'DEPOSIT_PAID'
  | 'EXPIRED'
  | 'CANCELLED';

export type AdminPaymentFlowLabel =
  | 'Booking'
  | 'Venue seat'
  | 'Class'
  | 'Class package'
  | 'Same-day classes'
  | 'Fixed ticket';

type AdminPaymentMailInput = {
  appPublicName: string;
  frontendBaseUrl?: string;
  branding?: EmailBranding;
  outcome: AdminPaymentOutcome;
  flowLabel: AdminPaymentFlowLabel;
  customerName: string;
  customerEmail: string;
  amountUsd: string;
  contextLabel: string;
  reference?: string;
  stageLabel?: string;
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function outcomeHeadline(outcome: AdminPaymentOutcome): string {
  switch (outcome) {
    case 'PAID':
      return 'Payment received';
    case 'DEPOSIT_PAID':
      return 'Deposit received';
    case 'EXPIRED':
      return 'Payment link expired';
    case 'CANCELLED':
      return 'Payment cancelled';
  }
}

function outcomeColor(outcome: AdminPaymentOutcome): string {
  switch (outcome) {
    case 'PAID':
      return '#34d399';
    case 'DEPOSIT_PAID':
      return '#fb923c';
    case 'EXPIRED':
      return '#fbbf24';
    case 'CANCELLED':
      return '#f87171';
  }
}

export function buildAdminPaymentOutcomeSubject(
  appPublicName: string,
  outcome: AdminPaymentOutcome,
  customerName: string,
): string {
  const headline = outcomeHeadline(outcome);
  return `${appPublicName} — ${headline}: ${customerName}`;
}

export function buildAdminPaymentOutcomeHtml(
  input: AdminPaymentMailInput,
): string {
  const logoBlock = buildEmailLogoWordmarkHtml(input.branding ?? input.frontendBaseUrl);
  const color = outcomeColor(input.outcome);
  const headline = outcomeHeadline(input.outcome);

  return `
  <html><body style="font-family:Arial,sans-serif;background:#0f0818;color:#f7f2e8;padding:24px;">
    <div style="max-width:580px;margin:0 auto;border:1px solid rgba(212,175,55,.3);border-radius:14px;padding:22px;background:#1a1026;">
      ${logoBlock}
      <p style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:${color};margin:0 0 8px;">${escapeHtml(headline)}</p>
      <h1 style="font-size:20px;margin:0 0 16px;">Payment update — ${escapeHtml(input.flowLabel)}</h1>
      <p><strong>Customer:</strong> ${escapeHtml(input.customerName)}</p>
      <p><strong>Email:</strong> ${escapeHtml(input.customerEmail)}</p>
      <p><strong>Context:</strong> ${escapeHtml(input.contextLabel)}</p>
      ${input.reference ? `<p><strong>Reference:</strong> ${escapeHtml(input.reference)}</p>` : ''}
      ${input.stageLabel ? `<p><strong>Stage:</strong> ${escapeHtml(input.stageLabel)}</p>` : ''}
      <p><strong>Amount:</strong> ${escapeHtml(input.amountUsd)}</p>
    </div>
  </body></html>
  `.trim();
}

export function buildAdminPaymentOutcomeText(
  input: AdminPaymentMailInput,
): string {
  const headline = outcomeHeadline(input.outcome);
  return [
    plainTextBrandLead(input.frontendBaseUrl),
    `${input.appPublicName} — ${headline}`,
    '',
    `Flow: ${input.flowLabel}`,
    `Customer: ${input.customerName}`,
    `Email: ${input.customerEmail}`,
    `Context: ${input.contextLabel}`,
    ...(input.reference ? [`Reference: ${input.reference}`] : []),
    ...(input.stageLabel ? [`Stage: ${input.stageLabel}`] : []),
    `Amount: ${input.amountUsd}`,
  ].join('\n');
}

export function flowLabelFromCode(
  flow:
    | 'BOOKING_QUOTE'
    | 'VENUE_SEAT'
    | 'CLASS_SESSION'
    | 'CLASS_PACKAGE'
    | 'CLASS_DAY_BUNDLE'
    | 'FIXED_TICKET',
): AdminPaymentFlowLabel {
  switch (flow) {
    case 'BOOKING_QUOTE':
      return 'Booking';
    case 'VENUE_SEAT':
      return 'Venue seat';
    case 'CLASS_SESSION':
      return 'Class';
    case 'CLASS_PACKAGE':
      return 'Class package';
    case 'CLASS_DAY_BUNDLE':
      return 'Same-day classes';
    case 'FIXED_TICKET':
      return 'Fixed ticket';
  }
}

export function stageLabelFromCode(
  stage: 'FULL' | 'DEPOSIT' | 'BALANCE' | null | undefined,
): string | undefined {
  if (!stage) return undefined;
  if (stage === 'FULL') return 'Full payment';
  if (stage === 'DEPOSIT') return 'Deposit';
  return 'Balance';
}
