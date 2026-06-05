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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

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
  const detailsHtml =
    input.detailsLines && input.detailsLines.length > 0
      ? input.detailsLines
          .map(
            (line) =>
              `<p style="margin:4px 0;color:#e8dcc8;">${escapeHtml(line)}</p>`,
          )
          .join('')
      : '';

  return `
  <html><body style="font-family:Arial,sans-serif;background:#0f0818;color:#f7f2e8;padding:24px;">
    <div style="max-width:580px;margin:0 auto;border:1px solid rgba(212,175,55,.3);border-radius:14px;padding:22px;background:#1a1026;">
      ${logoBlock}
      <p style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:${color};margin:0 0 8px;">${escapeHtml(headline)}</p>
      <h1 style="font-size:20px;margin:0 0 16px;">Customer activity</h1>
      <p><strong>Customer:</strong> ${escapeHtml(input.customerName)}</p>
      <p><strong>Email:</strong> ${escapeHtml(input.customerEmail)}</p>
      ${input.reference ? `<p><strong>Reference:</strong> ${escapeHtml(input.reference)}</p>` : ''}
      ${input.contextLabel ? `<p><strong>Context:</strong> ${escapeHtml(input.contextLabel)}</p>` : ''}
      ${input.amountUsd ? `<p><strong>Amount:</strong> ${escapeHtml(input.amountUsd)}</p>` : ''}
      ${detailsHtml ? `<div style="margin-top:12px;padding-top:12px;border-top:1px solid rgba(212,175,55,.2);">${detailsHtml}</div>` : ''}
    </div>
  </body></html>
  `.trim();
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
