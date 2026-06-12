import {
  EMAIL_TOKENS_DARK,
  EMAIL_TOKENS_LIGHT,
  emailLightInlineStyle,
} from './email-html-tokens';
import { escapeHtml } from './email-html.util';

export type EmailCardSectionRole = 'solo' | 'top' | 'middle' | 'bottom';

function buildDualModeStylesheet(): string {
  const L = EMAIL_TOKENS_LIGHT;
  const D = EMAIL_TOKENS_DARK;
  return `
:root { color-scheme: light dark; supported-color-schemes: light dark; }
html, body { height: auto !important; width: 100% !important; margin: 0 !important; padding: 0 !important; }
.email-body { background-color: ${L.bodyBg} !important; height: auto !important; }
.email-card { background-color: transparent !important; height: auto !important; }
.email-card-section { height: auto !important; }
.email-text-primary { color: ${L.textPrimary} !important; }
.email-text-body { color: ${L.textBody} !important; }
.email-text-muted { color: ${L.textMuted} !important; }
.email-text-accent { color: ${L.textAccent} !important; }
.email-label { color: ${L.labelGold} !important; }
.email-wordmark { color: ${L.wordmarkGold} !important; }
.email-link { color: ${L.link} !important; }
.email-divider { border-color: ${L.divider} !important; }
.email-callout { background-color: ${L.calloutBg} !important; border-color: ${L.calloutBorder} !important; }
.email-success { color: ${L.success} !important; }
.email-header-divider { border-bottom-color: ${L.divider} !important; }
.email-cta-link { word-break: break-all !important; }
@media (prefers-color-scheme: dark) {
  .email-body { background-color: ${D.bodyBg} !important; }
  .email-text-primary { color: ${D.textPrimary} !important; }
  .email-text-body { color: ${D.textBody} !important; }
  .email-text-muted { color: ${D.textMuted} !important; }
  .email-text-accent { color: ${D.textAccent} !important; }
  .email-label { color: ${D.labelGold} !important; }
  .email-wordmark { color: ${D.wordmarkGold} !important; }
  .email-link { color: ${D.link} !important; }
  .email-divider { border-color: ${D.divider} !important; }
  .email-callout { background-color: ${D.calloutBg} !important; border-color: ${D.calloutBorder} !important; }
  .email-success { color: ${D.success} !important; }
  .email-header-divider { border-bottom-color: ${D.divider} !important; }
}`.trim();
}

function buildCardCellBorderStyle(role: EmailCardSectionRole): string {
  const border = emailLightInlineStyle('cardBorder');
  const divider = emailLightInlineStyle('divider');
  const bg = emailLightInlineStyle('cardBg');
  const base = `background-color:${bg};height:auto;`;

  switch (role) {
    case 'solo':
      return `${base}border:1px solid ${border};border-radius:16px;`;
    case 'top':
      return `${base}border-top:1px solid ${border};border-left:1px solid ${border};border-right:1px solid ${border};border-bottom:1px solid ${divider};border-radius:16px 16px 0 0;`;
    case 'middle':
      return `${base}border-left:1px solid ${border};border-right:1px solid ${border};`;
    case 'bottom':
      return `${base}border-left:1px solid ${border};border-right:1px solid ${border};border-bottom:1px solid ${border};border-radius:0 0 16px 16px;`;
  }
}

export function buildEmailDocumentOpen(title?: string): string {
  const safeTitle = title ? escapeHtml(title) : 'Shamell';
  return `<!DOCTYPE html>
<html lang="en" style="height:auto;width:100%;margin:0;padding:0;">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light dark" />
<meta name="supported-color-schemes" content="light dark" />
<title>${safeTitle}</title>
<style type="text/css">${buildDualModeStylesheet()}</style>
</head>
<body class="email-body" style="margin:0;padding:0;height:auto;width:100%;background-color:${emailLightInlineStyle('bodyBg')};font-family:Arial,Helvetica,sans-serif;">`;
}

export function buildEmailDocumentClose(): string {
  return `</body></html>`;
}

export function buildEmailPreheader(text: string): string {
  return `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">${escapeHtml(text)}</div>`;
}

export function buildEmailOuterTable(innerHtml: string): string {
  return `<table role="presentation" class="email-body" width="100%" cellspacing="0" cellpadding="0" style="background-color:${emailLightInlineStyle('bodyBg')};padding:28px 12px;height:auto;width:100%;">
<tr><td align="center" style="height:auto;">${innerHtml}</td></tr>
</table>`;
}

export function buildEmailCard(
  innerHtml: string,
  options?: { maxWidth?: number },
): string {
  const maxWidth = options?.maxWidth ?? 560;
  return `<!--[if mso]><table role="presentation" width="${maxWidth}" cellspacing="0" cellpadding="0" border="0"><tr><td><![endif]-->
<table role="presentation" class="email-card" width="100%" cellspacing="0" cellpadding="0" style="max-width:${maxWidth}px;width:100%;height:auto;border-collapse:separate;border-spacing:0;">
${innerHtml}
</table>
<!--[if mso]></td></tr></table><![endif]-->`;
}

export function buildEmailCardSection(
  innerHtml: string,
  options?: {
    padding?: string;
    bordered?: boolean;
    sectionRole?: EmailCardSectionRole;
  },
): string {
  const padding = options?.padding ?? '24px 26px 28px';
  const sectionRole = options?.sectionRole ?? 'solo';
  const cellBorder = buildCardCellBorderStyle(sectionRole);
  const divider =
    options?.bordered && sectionRole !== 'solo'
      ? `border-bottom:1px solid ${emailLightInlineStyle('divider')};`
      : '';
  return `<tr><td class="email-card-section" style="padding:${padding};${cellBorder}${divider}">${innerHtml}</td></tr>`;
}

export function buildEmailCardHeader(innerHtml: string): string {
  return buildEmailCardSection(innerHtml, {
    padding: '28px 26px 22px',
    sectionRole: 'top',
  });
}

export function buildEmailDetailRow(label: string, valueHtml: string): string {
  return `<tr>
<td class="email-label" style="padding:10px 0 10px 4px;width:34%;vertical-align:top;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${emailLightInlineStyle('labelGold')};">${escapeHtml(label)}</td>
<td class="email-text-primary email-value" style="padding:10px 0;vertical-align:top;font-size:15px;line-height:1.55;color:${emailLightInlineStyle('textPrimary')};">${valueHtml}</td>
</tr>`;
}

export function buildEmailDetailTable(rowsHtml: string): string {
  return `<table role="presentation" class="email-divider" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid ${emailLightInlineStyle('divider')};height:auto;">
${rowsHtml}
</table>`;
}

export function buildEmailParagraph(
  html: string,
  variant: 'body' | 'muted' | 'primary' = 'body',
): string {
  const cls =
    variant === 'muted'
      ? 'email-text-muted'
      : variant === 'primary'
        ? 'email-text-primary'
        : 'email-text-body';
  const color =
    variant === 'muted'
      ? emailLightInlineStyle('textMuted')
      : variant === 'primary'
        ? emailLightInlineStyle('textPrimary')
        : emailLightInlineStyle('textBody');
  return `<p class="${cls}" style="margin:0 0 14px;font-size:15px;line-height:1.7;color:${color};">${html}</p>`;
}

export function buildEmailHeading(
  text: string,
  level: 1 | 2 = 1,
  options?: { colorClass?: 'primary' | 'success' },
): string {
  const size = level === 1 ? '22px' : '20px';
  const cls =
    options?.colorClass === 'success'
      ? 'email-success email-text-primary'
      : 'email-text-primary';
  const color =
    options?.colorClass === 'success'
      ? emailLightInlineStyle('success')
      : emailLightInlineStyle('textPrimary');
  return `<h${level} class="${cls}" style="margin:10px 0 16px;font-family:Georgia,serif;font-size:${size};line-height:1.3;color:${color};font-weight:600;">${text}</h${level}>`;
}

export function buildEmailLabelLine(text: string): string {
  return `<p class="email-label" style="margin:0;font-family:Georgia,serif;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:${emailLightInlineStyle('labelGold')};">${text}</p>`;
}

export function buildEmailCtaButton(label: string, href: string): string {
  const safeHref = escapeHtml(href);
  const safeLabel = escapeHtml(label);
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:18px 0 0;height:auto;">
<tr>
<td align="center" style="border-radius:8px;background-color:${emailLightInlineStyle('ctaBg')};">
<a href="${safeHref}" class="email-cta" style="display:block;width:100%;box-sizing:border-box;padding:14px 20px;border-radius:8px;background-color:${emailLightInlineStyle('ctaBg')};color:${emailLightInlineStyle('ctaText')};text-decoration:none;font-weight:700;font-size:15px;text-align:center;">${safeLabel}</a>
</td>
</tr>
</table>`;
}

export function buildEmailTextLinkFallback(href: string): string {
  const safeHref = escapeHtml(href);
  return `<p class="email-text-muted" style="margin:14px 0 0;font-size:12px;line-height:1.6;color:${emailLightInlineStyle('textMuted')};">
Or copy this link:<br />
<a href="${safeHref}" class="email-link email-cta-link" style="color:${emailLightInlineStyle('link')};text-decoration:underline;word-break:break-all;">${safeHref}</a>
</p>`;
}

export function buildEmailAmountHighlight(amount: string): string {
  return `<div class="email-callout" style="margin:16px 0 0;padding:18px 20px;border:1px solid ${emailLightInlineStyle('calloutBorder')};border-radius:12px;background-color:${emailLightInlineStyle('calloutBg')};text-align:center;">
<p class="email-label" style="margin:0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:${emailLightInlineStyle('labelGold')};">Amount</p>
<p class="email-text-accent" style="margin:10px 0 0;font-size:28px;line-height:1.2;color:${emailLightInlineStyle('textAccent')};font-weight:600;">${escapeHtml(amount)}</p>
</div>`;
}

export function buildEmailStatusBadge(text: string, color: string): string {
  return `<p style="margin:0;display:inline-block;padding:6px 12px;border-radius:999px;font-size:11px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:${color};background:${color}22;border:1px solid ${color}55;">${escapeHtml(text)}</p>`;
}

export function buildEmailCallout(innerHtml: string): string {
  return `<div class="email-callout" style="margin:20px 0;padding:16px;border-radius:12px;border:1px solid ${emailLightInlineStyle('calloutBorder')};background-color:${emailLightInlineStyle('calloutBg')};">
${innerHtml}
</div>`;
}

export function buildEmailSiteLink(siteUrl: string, label = 'Visit our website'): string {
  const safeUrl = escapeHtml(siteUrl);
  return `<p class="email-text-muted" style="margin:20px 0 0;font-size:13px;line-height:1.6;color:${emailLightInlineStyle('textMuted')};">
<a href="${safeUrl}" class="email-link" style="color:${emailLightInlineStyle('link')};text-decoration:underline;">${escapeHtml(label)}</a>
</p>`;
}

export function buildEmailFooterDisclaimer(html: string): string {
  return `<p class="email-text-muted" style="margin:24px 0 0;font-size:12px;line-height:1.65;color:${emailLightInlineStyle('textMuted')};text-align:center;">${html}</p>`;
}

export function buildEmailSimpleCardBody(
  innerHtml: string,
  options?: { preheader?: string },
): string {
  const preheader = options?.preheader ?? '';
  return `${buildEmailDocumentOpen()}
${buildEmailPreheader(preheader)}
${buildEmailOuterTable(buildEmailCard(buildEmailCardSection(innerHtml, { sectionRole: 'solo' })))}
${buildEmailDocumentClose()}`;
}

export type PaymentActionEmailDetailLine = {
  label: string;
  value: string;
};

export type PaymentActionEmailOptions = {
  title?: string;
  preheader: string;
  logoBlock: string;
  heading: string;
  greeting: string;
  introParagraph: string;
  amountUsd: string;
  cta: { label: string; href: string };
  detailLines: PaymentActionEmailDetailLine[];
  extraHtml?: string;
  disclaimer?: string;
};

/** Payment emails: amount + CTA above detail rows (mobile-safe above the fold). */
export function buildPaymentActionEmail(
  options: PaymentActionEmailOptions,
): string {
  const detailsHtml = options.detailLines
    .map(
      (line) =>
        `<p class="email-text-body" style="margin:0 0 14px;font-size:15px;line-height:1.7;"><strong>${escapeHtml(line.label)}:</strong> ${escapeHtml(line.value)}</p>`,
    )
    .join('');

  const inner = `
${options.logoBlock}
${buildEmailHeading(options.heading, 1)}
${buildEmailParagraph(options.greeting)}
${buildEmailParagraph(options.introParagraph)}
${buildEmailAmountHighlight(options.amountUsd)}
${buildEmailCtaButton(options.cta.label, options.cta.href)}
${buildEmailTextLinkFallback(options.cta.href)}
${options.extraHtml ?? ''}
${detailsHtml}
${options.disclaimer ? buildEmailParagraph(options.disclaimer, 'muted') : ''}`;

  return `${buildEmailDocumentOpen(options.title)}
${buildEmailPreheader(options.preheader)}
${buildEmailOuterTable(buildEmailCard(buildEmailCardSection(inner, { sectionRole: 'solo' })))}
${buildEmailDocumentClose()}`;
}

/** Table card with separate header and body sections (inquiry / confirmation emails). */
export function buildPremiumEmail(options: {
  title?: string;
  headerHtml: string;
  bodyHtml: string;
  maxWidth?: number;
  preheader?: string;
}): string {
  const preheader = options.preheader ?? '';
  return `${buildEmailDocumentOpen(options.title)}
${preheader ? buildEmailPreheader(preheader) : ''}
${buildEmailOuterTable(
  buildEmailCard(
    `${buildEmailCardHeader(options.headerHtml)}${buildEmailCardSection(options.bodyHtml, { sectionRole: 'bottom' })}`,
    { maxWidth: options.maxWidth },
  ),
)}
${buildEmailDocumentClose()}`.trim();
}
