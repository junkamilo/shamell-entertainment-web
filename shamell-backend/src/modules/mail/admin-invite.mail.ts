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
} from './email-html-layout';
import { emailLightInlineStyle } from './email-html-tokens';
import { escapeHtml } from './email-html.util';
import {
  buildEmailLogoWordmarkHtml,
  type EmailBranding,
} from './email-html-branding';

type AdminInviteMailInput = {
  appName: string;
  fullName: string;
  code: string;
  branding?: EmailBranding;
};

export function buildAdminInviteEmailHtml(input: AdminInviteMailInput): string {
  const safeAppName = escapeHtml(input.appName);
  const safeFullName = escapeHtml(input.fullName);
  const spacedCode = input.code.split('').join(' ');

  const logoBlock = buildEmailLogoWordmarkHtml(input.branding);

  const header = buildEmailCardHeader(`
${logoBlock}
<p class="email-label" style="margin:0;font-size:12px;line-height:1.4;letter-spacing:0.28em;text-transform:uppercase;color:${emailLightInlineStyle('labelGold')};">${safeAppName}</p>
<h1 class="email-text-primary" style="margin:14px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:1.2;font-weight:400;color:${emailLightInlineStyle('textPrimary')};">Admin Invitation</h1>
<p class="email-text-body" style="margin:12px auto 0;max-width:420px;font-size:14px;line-height:1.7;color:${emailLightInlineStyle('textBody')};">Se está dando de alta una cuenta de administrador para ti.</p>
`);

  const codeBox = buildEmailCallout(`
<div class="email-label" style="margin-bottom:10px;font-size:11px;line-height:1.4;letter-spacing:0.22em;text-transform:uppercase;color:${emailLightInlineStyle('labelGold')};">Verification Code</div>
<div style="font-family:'Courier New',Courier,monospace;font-size:38px;line-height:1.15;font-weight:700;letter-spacing:0.2em;color:${emailLightInlineStyle('textAccent')};">${spacedCode}</div>
`);

  const body = buildEmailCardSection(
    `
${buildEmailParagraph(`Hola ${safeFullName},`, 'primary')}
${buildEmailParagraph('Usa este código para completar la creación de tu cuenta en el panel de administración de Shamell.')}
${codeBox}
${buildEmailParagraph('Comparte este código con quien completa el alta en <strong class="email-text-primary" style="color:' + emailLightInlineStyle('textPrimary') + ';">Shamell Admin → Agregar administrador</strong>, junto con la contraseña que definirán para tu cuenta.')}
${buildEmailParagraph('Este código caduca en <strong class="email-text-primary" style="color:' + emailLightInlineStyle('textPrimary') + ';">48 horas</strong>. Si solicitan un código nuevo, usa siempre el email más reciente.')}
`,
    { sectionRole: 'middle' },
  );

  const footer = buildEmailCardSection(
    `
<div class="email-callout" style="padding:16px 18px;border-radius:18px;background-color:${emailLightInlineStyle('calloutBg')};border:1px solid ${emailLightInlineStyle('calloutBorder')};">
<p class="email-text-muted" style="margin:0;font-size:12px;line-height:1.7;color:${emailLightInlineStyle('textMuted')};">Security note: this code only activates an administrator account for ${safeAppName}. If you were not expecting this invitation, ignore this email.</p>
</div>
`,
    { sectionRole: 'bottom' },
  );

  return `${buildEmailDocumentOpen(`${input.appName} invitation code`)}
${buildEmailPreheader(`Tu código para crear una cuenta de administrador en ${input.appName} es ${input.code}.`)}
${buildEmailOuterTable(buildEmailCard(`${header}${body}${footer}`, { maxWidth: 620 }))}
${buildEmailDocumentClose()}`.trim();
}

export function buildAdminInviteEmailText(input: AdminInviteMailInput): string {
  return [
    `Hola ${input.fullName},`,
    '',
    `Tu código para crear una cuenta de administrador en ${input.appName} es: ${input.code}`,
    '',
    'Este código caduca en 48 horas.',
    '',
    'Si solicitan un código nuevo, usa siempre el email más reciente.',
    'Si no esperabas esta invitación, puedes ignorar este correo.',
  ].join('\n');
}
