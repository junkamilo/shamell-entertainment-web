import {
  buildEmailAmountHighlight,
  buildEmailCard,
  buildEmailCardHeader,
  buildEmailCardSection,
  buildEmailDetailRow,
  buildEmailDetailTable,
  buildEmailDocumentClose,
  buildEmailDocumentOpen,
  buildEmailFooterDisclaimer,
  buildEmailOuterTable,
  buildEmailSiteLink,
  buildEmailStatusBadge,
} from './email-html-layout';
import { emailLightInlineStyle } from './email-html-tokens';
import { escapeHtml } from './email-html.util';
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
  const emailLink = `<a href="mailto:${customerEmail}" class="email-link" style="color:${emailLightInlineStyle('link')};text-decoration:underline;">${customerEmail}</a>`;
  const context = escapeHtml(input.contextLabel);
  const siteUrl = input.branding?.siteBaseUrl ?? input.frontendBaseUrl?.trim();
  const siteLink = siteUrl ? buildEmailSiteLink(siteUrl, 'Open Shamell website') : '';

  const detailRows = [
    buildEmailDetailRow(
      'Customer',
      `<strong class="email-text-primary" style="color:${emailLightInlineStyle('textPrimary')};">${customerName}</strong>`,
    ),
    buildEmailDetailRow('Email', emailLink),
    buildEmailDetailRow('Purchase', context),
    ...(input.reference
      ? [
          buildEmailDetailRow(
            'Reference',
            `<span style="font-family:Consolas,'Courier New',monospace;font-size:14px;color:${emailLightInlineStyle('textAccent')};letter-spacing:0.06em;">${escapeHtml(input.reference)}</span>`,
          ),
        ]
      : []),
    ...(input.stageLabel
      ? [buildEmailDetailRow('Stage', escapeHtml(input.stageLabel))]
      : []),
  ].join('');

  const header = buildEmailCardHeader(`
${logoBlock}
<p class="email-label" style="margin:14px 0 0;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:${emailLightInlineStyle('labelGold')};">${app} · Operations</p>
<div style="margin:16px 0 0;">${buildEmailStatusBadge(headline, color)}</div>
<h1 class="email-text-primary" style="margin:14px 0 0;font-size:24px;line-height:1.35;color:${emailLightInlineStyle('textPrimary')};font-weight:600;">${flow}</h1>
<p class="email-text-muted" style="margin:10px 0 0;font-size:14px;line-height:1.65;color:${emailLightInlineStyle('textMuted')};">${escapeHtml(subtitle)}</p>
`);

  const body = buildEmailCardSection(
    `
${buildEmailDetailTable(detailRows)}
${buildEmailAmountHighlight(input.amountUsd)}
${buildEmailFooterDisclaimer(`This is an automated ops notification from ${app}. Reply to the customer email above if you need to follow up.`)}
${siteLink}
`,
    { sectionRole: 'bottom' },
  );

  return `${buildEmailDocumentOpen(`${app} — ${headline}`)}
${buildEmailOuterTable(buildEmailCard(`${header}${body}`))}
${buildEmailDocumentClose()}`.trim();
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
