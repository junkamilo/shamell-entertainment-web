import {
  buildEmailHeading,
  buildEmailParagraph,
  buildPremiumEmail,
} from '../../mail/utils/email-html-layout';
import { emailLightInlineStyle } from '../../mail/utils/email-html-tokens';
import { escapeHtml } from '../../mail/utils/email-html.util';
import {
  buildEmailLogoWordmarkHtml,
  plainTextBrandLead,
  type EmailBranding,
} from '../../mail/utils/email-html-branding';

export type FixedTicketPackageSnapshot = {
  packageTitle: string;
  packageArrivalLabel?: string | null;
  packageInclusions?: { title: string }[] | null;
};

export function formatPackageInclusionTitles(
  inclusions: FixedTicketPackageSnapshot['packageInclusions'],
): string[] {
  if (!inclusions?.length) return [];
  return inclusions
    .map((item) => item.title?.trim())
    .filter((title): title is string => Boolean(title));
}

export function buildFixedTicketConfirmationSubject(eventName: string): string {
  return `Ticket confirmed — ${eventName}`;
}

export function packageSnapshotFromEnrollment(enrollment: {
  packageTitle?: string | null;
  packageArrivalLabel?: string | null;
  packageInclusions?: unknown;
}): FixedTicketPackageSnapshot | null {
  if (!enrollment.packageTitle?.trim()) return null;
  const inclusions = Array.isArray(enrollment.packageInclusions)
    ? (enrollment.packageInclusions as { title: string }[])
    : null;
  return {
    packageTitle: enrollment.packageTitle.trim(),
    packageArrivalLabel: enrollment.packageArrivalLabel,
    packageInclusions: inclusions,
  };
}

export function buildFixedTicketConfirmationText(input: {
  eventName: string;
  customerName: string;
  ticketNumber: number;
  eventDateLabel: string;
  amount: string;
  verificationCode: string;
  siteBaseUrl?: string;
  package?: FixedTicketPackageSnapshot | null;
}): string {
  const code = input.verificationCode.trim().toLowerCase();
  const lines = [
    plainTextBrandLead(input.siteBaseUrl),
    `Ticket confirmed — ${input.eventName}`,
    '',
    `Hello ${input.customerName},`,
    '',
    `Your ticket purchase for ${input.eventName} was successful.`,
    '',
    `Verification code (show at the door):`,
    code,
    '',
    `Your ticket number: #${input.ticketNumber}`,
  ];

  if (input.package?.packageTitle) {
    lines.push('', `Package: ${input.package.packageTitle}`);
    if (input.package.packageArrivalLabel?.trim()) {
      lines.push(`Arrival window: ${input.package.packageArrivalLabel.trim()}`);
    }
    const includes = formatPackageInclusionTitles(
      input.package.packageInclusions,
    );
    if (includes.length) {
      lines.push('This package includes:');
      for (const title of includes) {
        lines.push(`  • ${title}`);
      }
    }
  }

  lines.push(
    '',
    `Event: ${input.eventDateLabel}`,
    `Amount paid: ${input.amount}`,
    '',
    'Keep this email. Shamell staff will match this verification code to your purchase.',
    '',
    'Thank you,',
    'Shamell Entertainment',
  );
  if (input.siteBaseUrl) lines.push('', `Website: ${input.siteBaseUrl}`);
  return lines.join('\n');
}

export function buildFixedTicketConfirmationHtml(input: {
  eventName: string;
  customerName: string;
  ticketNumber: number;
  eventDateLabel: string;
  amount: string;
  verificationCode: string;
  branding?: string | EmailBranding;
  package?: FixedTicketPackageSnapshot | null;
}): string {
  const name = escapeHtml(input.customerName);
  const event = escapeHtml(input.eventName);
  const eventDate = escapeHtml(input.eventDateLabel);
  const amount = escapeHtml(input.amount);
  const ticket = escapeHtml(String(input.ticketNumber));
  const code = escapeHtml(input.verificationCode.trim().toLowerCase());
  const logoBlock = buildEmailLogoWordmarkHtml(input.branding);
  const accent = emailLightInlineStyle('textAccent');
  const primary = emailLightInlineStyle('textPrimary');
  const muted = emailLightInlineStyle('textMuted');

  const includes = formatPackageInclusionTitles(
    input.package?.packageInclusions,
  );
  const includesHtml = includes.length
    ? `<ul style="margin:8px 0 0;padding-left:18px;color:${primary};">
${includes
  .map(
    (title) =>
      `<li style="margin:4px 0;font-size:15px;line-height:1.5;">${escapeHtml(title)}</li>`,
  )
  .join('\n')}
</ul>`
    : '';

  const packageBlock = input.package?.packageTitle
    ? buildEmailParagraph(
        `<strong style="color:${accent};">Package</strong><br/>
<span style="font-size:18px;font-weight:600;color:${primary};">${escapeHtml(input.package.packageTitle)}</span>
${
  input.package.packageArrivalLabel?.trim()
    ? `<br/><span style="color:${muted};font-size:14px;"><strong>Arrival:</strong> ${escapeHtml(input.package.packageArrivalLabel.trim())}</span>`
    : ''
}
${
  includesHtml
    ? `<br/><span style="display:inline-block;margin-top:10px;color:${muted};font-size:13px;letter-spacing:0.08em;text-transform:uppercase;">Includes</span>${includesHtml}`
    : ''
}`,
      )
    : '';

  const verificationBlock = `
<div style="margin:18px 0;padding:16px 18px;border-radius:12px;border:1px solid rgba(197,165,90,0.45);background:rgba(197,165,90,0.08);">
  <p style="margin:0;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${accent};">Verification code</p>
  <p style="margin:10px 0 0;font-family:Consolas,'Courier New',monospace;font-size:15px;line-height:1.45;word-break:break-all;color:${primary};letter-spacing:0.04em;">${code}</p>
  <p style="margin:10px 0 0;font-size:13px;line-height:1.5;color:${muted};">Show this code at the door. It matches the code sent to Shamell for this purchase.</p>
</div>`;

  const header = `${logoBlock}
${buildEmailHeading('Ticket confirmed', 1)}`;

  const body = `${buildEmailParagraph(`Hello <strong class="email-text-primary" style="color:${primary};">${name}</strong>,`)}
${buildEmailParagraph(`Your ticket purchase for <strong class="email-text-primary" style="color:${primary};">${event}</strong> was successful.`)}
${verificationBlock}
${packageBlock}
${buildEmailParagraph(`<strong>Your ticket number:</strong> #${ticket}<br/><strong>Event:</strong> ${eventDate}<br/><strong>Amount paid:</strong> ${amount}`)}
<p class="email-text-muted" style="margin:22px 0 0;font-size:14px;color:${muted};">Thank you,<br/><span class="email-text-accent" style="color:${accent};">Shamell Entertainment</span></p>`;

  return buildPremiumEmail({
    title: `Ticket confirmed — ${input.eventName}`,
    headerHtml: header,
    bodyHtml: body,
  });
}
