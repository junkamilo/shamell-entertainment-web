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

function outcomeSubtitle(outcome: AdminPaymentOutcome): string {
  switch (outcome) {
    case 'PAID':
      return 'A customer completed payment successfully.';
    case 'DEPOSIT_PAID':
      return 'A customer paid their deposit.';
    case 'EXPIRED':
      return 'The checkout session expired before payment.';
    case 'CANCELLED':
      return 'The customer cancelled checkout.';
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

function buildStatusBadge(headline: string, color: string): string {
  return `<p style="margin:0;display:inline-block;padding:6px 12px;border-radius:999px;font-size:11px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:${color};background:${color}22;border:1px solid ${color}55;">${escapeHtml(headline)}</p>`;
}

function buildDetailRow(label: string, valueHtml: string): string {
  return `<tr>
    <td style="padding:10px 0 10px 4px;width:34%;vertical-align:top;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#9a8f7c;">${escapeHtml(label)}</td>
    <td style="padding:10px 0;vertical-align:top;font-size:15px;line-height:1.55;color:#fff8e6;">${valueHtml}</td>
  </tr>`;
}

function buildAmountHighlight(amount: string): string {
  return `<div style="margin:22px 0 0;padding:18px 20px;border:1px solid rgba(212,175,106,0.4);border-radius:12px;background:rgba(0,0,0,0.28);text-align:center;">
    <p style="margin:0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#c9a962;">Amount</p>
    <p style="margin:10px 0 0;font-size:28px;line-height:1.2;color:#e8d5a3;font-weight:600;">${escapeHtml(amount)}</p>
  </div>`;
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
  const app = escapeHtml(input.appPublicName.trim() || 'Shamell');
  const logoBlock = buildEmailLogoWordmarkHtml(
    input.branding ?? input.frontendBaseUrl,
  );
  const color = outcomeColor(input.outcome);
  const headline = outcomeHeadline(input.outcome);
  const subtitle = outcomeSubtitle(input.outcome);
  const flow = escapeHtml(input.flowLabel);
  const customerName = escapeHtml(input.customerName);
  const customerEmail = escapeHtml(input.customerEmail);
  const emailLink = `<a href="mailto:${customerEmail}" style="color:#e8d5a3;text-decoration:underline;">${customerEmail}</a>`;
  const context = escapeHtml(input.contextLabel);
  const siteUrl = input.branding?.siteBaseUrl ?? input.frontendBaseUrl?.trim();
  const siteLink = siteUrl
    ? `<p style="margin:22px 0 0;font-size:13px;line-height:1.7;color:#b9b09f;text-align:center;">
          <a href="${escapeHtml(siteUrl)}" style="color:#e8d5a3;text-decoration:underline;">Open Shamell website</a>
        </p>`
    : '';

  const detailRows = [
    buildDetailRow(
      'Customer',
      `<strong style="color:#fff8e6;">${customerName}</strong>`,
    ),
    buildDetailRow('Email', emailLink),
    buildDetailRow('Purchase', context),
    ...(input.reference
      ? [
          buildDetailRow(
            'Reference',
            `<span style="font-family:Consolas,'Courier New',monospace;font-size:14px;color:#e8d5a3;letter-spacing:0.06em;">${escapeHtml(input.reference)}</span>`,
          ),
        ]
      : []),
    ...(input.stageLabel
      ? [buildDetailRow('Stage', escapeHtml(input.stageLabel))]
      : []),
  ].join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#0c0610;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0c0610;padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;border:1px solid rgba(212,175,106,0.35);border-radius:16px;background:linear-gradient(165deg,#1a0d24 0%,#120818 100%);overflow:hidden;">
          <tr>
            <td style="padding:28px 26px 22px;border-bottom:1px solid rgba(212,175,106,0.2);text-align:center;">
              ${logoBlock}
              <p style="margin:14px 0 0;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#c9a962;">${app} · Operations</p>
              <div style="margin:16px 0 0;">${buildStatusBadge(headline, color)}</div>
              <h1 style="margin:14px 0 0;font-size:24px;line-height:1.35;color:#fff8e6;font-weight:600;">${flow}</h1>
              <p style="margin:10px 0 0;font-size:14px;line-height:1.65;color:#b9b09f;">${escapeHtml(subtitle)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 26px 28px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid rgba(212,175,106,0.15);">
                ${detailRows}
              </table>
              ${buildAmountHighlight(input.amountUsd)}
              <p style="margin:24px 0 0;font-size:12px;line-height:1.65;color:#8a8072;text-align:center;">
                This is an automated ops notification from ${app}. Reply to the customer email above if you need to follow up.
              </p>
              ${siteLink}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
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
    outcomeSubtitle(input.outcome),
    '',
    `Customer: ${input.customerName}`,
    `Email: ${input.customerEmail}`,
    `Purchase: ${input.contextLabel}`,
    ...(input.reference ? [`Reference: ${input.reference}`] : []),
    ...(input.stageLabel ? [`Stage: ${input.stageLabel}`] : []),
    `Amount: ${input.amountUsd}`,
    '',
    '— Shamell operations notification',
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
