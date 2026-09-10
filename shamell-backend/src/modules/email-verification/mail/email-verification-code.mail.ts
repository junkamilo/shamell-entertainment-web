import {
  buildEmailCallout,
  buildEmailCard,
  buildEmailCardHeader,
  buildEmailCardSection,
  buildEmailDocumentClose,
  buildEmailDocumentOpen,
  buildEmailOuterTable,
  buildEmailParagraph,
  buildEmailPreheader,
} from '../../mail/utils/email-html-layout';
import { emailLightInlineStyle } from '../../mail/utils/email-html-tokens';
import { escapeHtml } from '../../mail/utils/email-html.util';
import {
  buildEmailLogoWordmarkHtml,
  type EmailBranding,
} from '../../mail/utils/email-html-branding';

export type EmailVerificationCodeMailInput = {
  appName: string;
  code: string;
  branding?: EmailBranding;
};

export function buildEmailVerificationCodeSubject(appName: string): string {
  const app = appName.trim() || 'Shamell';
  return `Your ${app} verification code`;
}

export function buildEmailVerificationCodeHtml(
  input: EmailVerificationCodeMailInput,
): string {
  const safeAppName = escapeHtml(input.appName.trim() || 'Shamell');
  const spacedCode = input.code.split('').join(' ');
  const logoBlock = buildEmailLogoWordmarkHtml(input.branding);

  const header = buildEmailCardHeader(`
${logoBlock}
<p class="email-label" style="margin:0;font-size:12px;line-height:1.4;letter-spacing:0.28em;text-transform:uppercase;color:${emailLightInlineStyle('labelGold')};">${safeAppName}</p>
<h1 class="email-text-primary" style="margin:14px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:1.2;font-weight:400;color:${emailLightInlineStyle('textPrimary')};">Verify your email</h1>
<p class="email-text-body" style="margin:12px auto 0;max-width:420px;font-size:14px;line-height:1.7;color:${emailLightInlineStyle('textBody')};">Enter this code to confirm you own this email address.</p>
`);

  const codeBox = buildEmailCallout(`
<div class="email-label" style="margin-bottom:10px;font-size:11px;line-height:1.4;letter-spacing:0.22em;text-transform:uppercase;color:${emailLightInlineStyle('labelGold')};">Verification Code</div>
<div style="font-family:'Courier New',Courier,monospace;font-size:38px;line-height:1.15;font-weight:700;letter-spacing:0.2em;color:${emailLightInlineStyle('textAccent')};">${spacedCode}</div>
`);

  const body = buildEmailCardSection(
    `
${buildEmailParagraph('Use this 6-digit code in the verification window on the Shamell website.')}
${codeBox}
${buildEmailParagraph('This code expires in <strong class="email-text-primary" style="color:' + emailLightInlineStyle('textPrimary') + ';">10 minutes</strong>. If you request a new code, use the latest email.')}
`,
    { sectionRole: 'middle' },
  );

  const footer = buildEmailCardSection(
    `
<div class="email-callout" style="padding:16px 18px;border-radius:18px;background-color:${emailLightInlineStyle('calloutBg')};border:1px solid ${emailLightInlineStyle('calloutBorder')};">
<p class="email-text-muted" style="margin:0;font-size:12px;line-height:1.7;color:${emailLightInlineStyle('textMuted')};">If you did not request this code, you can ignore this email.</p>
</div>
`,
    { sectionRole: 'bottom' },
  );

  return `${buildEmailDocumentOpen(`${input.appName} verification code`)}
${buildEmailPreheader(`Your ${input.appName} verification code is ${input.code}.`)}
${buildEmailOuterTable(buildEmailCard(`${header}${body}${footer}`, { maxWidth: 620 }))}
${buildEmailDocumentClose()}`.trim();
}

export function buildEmailVerificationCodeText(
  input: EmailVerificationCodeMailInput,
): string {
  const app = input.appName.trim() || 'Shamell';
  return [
    `Your ${app} verification code is: ${input.code}`,
    '',
    'This code expires in 10 minutes.',
    'If you did not request this code, you can ignore this email.',
  ].join('\n');
}
