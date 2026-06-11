import {
  buildEmailCard,
  buildEmailCardHeader,
  buildEmailCardSection,
  buildEmailDetailRow,
  buildEmailDetailTable,
  buildEmailDocumentClose,
  buildEmailDocumentOpen,
  buildEmailHeading,
  buildEmailParagraph,
  buildEmailOuterTable,
  buildEmailStatusBadge,
} from './email-html-layout';
import { emailLightInlineStyle } from './email-html-tokens';
import { escapeHtml } from './email-html.util';
import {
  buildEmailLogoWordmarkHtml,
  plainTextBrandLead,
  type EmailBranding,
} from './email-html-branding';

export type AdminCustomerActivityKind =
  | 'CONCIERGE_INQUIRY'
  | 'BOOKING_INQUIRY'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_QUOTE_SENT'
  | 'BOOKING_BALANCE_LINK_SENT';

type AdminCustomerActivityMailInput = {
  appPublicName: string;
  frontendBaseUrl?: string;
  branding?: EmailBranding;
  kind: AdminCustomerActivityKind;
  customerName: string;
  customerEmail: string;
  reference?: string;
  contextLabel?: string;
  amountUsd?: string;
  detailsLines?: string[];
};

function kindHeadline(kind: AdminCustomerActivityKind): string {
  switch (kind) {
    case 'CONCIERGE_INQUIRY':
      return 'New concierge inquiry';
    case 'BOOKING_INQUIRY':
      return 'New booking inquiry';
    case 'BOOKING_CONFIRMED':
      return 'Reservation confirmed (customer notified)';
    case 'BOOKING_QUOTE_SENT':
      return 'Payment link sent to customer';
    case 'BOOKING_BALANCE_LINK_SENT':
      return 'Balance payment link sent to customer';
  }
}

function kindSubjectHeadline(kind: AdminCustomerActivityKind): string {
  switch (kind) {
    case 'CONCIERGE_INQUIRY':
      return 'Nueva consulta concierge';
    case 'BOOKING_INQUIRY':
      return 'Nueva consulta de reserva';
    case 'BOOKING_CONFIRMED':
      return 'Reserva confirmada (cliente notificado)';
    case 'BOOKING_QUOTE_SENT':
      return 'Enlace de pago enviado';
    case 'BOOKING_BALANCE_LINK_SENT':
      return 'Enlace de balance enviado';
  }
}

function kindAccentColor(kind: AdminCustomerActivityKind): string {
  switch (kind) {
    case 'CONCIERGE_INQUIRY':
      return '#a78bfa';
    case 'BOOKING_INQUIRY':
      return '#60a5fa';
    case 'BOOKING_CONFIRMED':
      return '#34d399';
    case 'BOOKING_QUOTE_SENT':
    case 'BOOKING_BALANCE_LINK_SENT':
      return '#fbbf24';
  }
}

export function buildAdminCustomerActivitySubject(
  appPublicName: string,
  kind: AdminCustomerActivityKind,
  customerName: string,
): string {
  const headline = kindSubjectHeadline(kind);
  return `${appPublicName} — ${headline}: ${customerName}`;
}

export function buildAdminCustomerActivityHtml(
  input: AdminCustomerActivityMailInput,
): string {
  const logoBlock = buildEmailLogoWordmarkHtml(
    input.branding ?? input.frontendBaseUrl,
  );
  const color = kindAccentColor(input.kind);
  const headline = kindHeadline(input.kind);

  const detailRows = [
    buildEmailDetailRow('Customer', escapeHtml(input.customerName)),
    buildEmailDetailRow('Email', escapeHtml(input.customerEmail)),
    ...(input.reference
      ? [buildEmailDetailRow('Reference', escapeHtml(input.reference))]
      : []),
    ...(input.contextLabel
      ? [buildEmailDetailRow('Context', escapeHtml(input.contextLabel))]
      : []),
    ...(input.amountUsd
      ? [buildEmailDetailRow('Amount', escapeHtml(input.amountUsd))]
      : []),
  ].join('');

  const detailsHtml =
    input.detailsLines && input.detailsLines.length > 0
      ? `<div class="email-divider" style="margin-top:12px;padding-top:12px;border-top:1px solid ${emailLightInlineStyle('divider')};">
${input.detailsLines.map((line) => buildEmailParagraph(escapeHtml(line), 'body')).join('')}
</div>`
      : '';

  const header = buildEmailCardHeader(`
${logoBlock}
<div style="margin:0 0 8px;">${buildEmailStatusBadge(headline, color)}</div>
${buildEmailHeading('Customer activity', 1)}
`);

  const body = buildEmailCardSection(`
${buildEmailDetailTable(detailRows)}
${detailsHtml}
`);

  return `${buildEmailDocumentOpen('Customer activity')}
${buildEmailOuterTable(buildEmailCard(`${header}${body}`))}
${buildEmailDocumentClose()}`.trim();
}

export function buildAdminCustomerActivityText(
  input: AdminCustomerActivityMailInput,
): string {
  const headline = kindHeadline(input.kind);
  return [
    plainTextBrandLead(input.frontendBaseUrl),
    `${input.appPublicName} — ${headline}`,
    '',
    `Customer: ${input.customerName}`,
    `Email: ${input.customerEmail}`,
    ...(input.reference ? [`Reference: ${input.reference}`] : []),
    ...(input.contextLabel ? [`Context: ${input.contextLabel}`] : []),
    ...(input.amountUsd ? [`Amount: ${input.amountUsd}`] : []),
    ...(input.detailsLines && input.detailsLines.length > 0
      ? ['', ...input.detailsLines]
      : []),
  ].join('\n');
}
