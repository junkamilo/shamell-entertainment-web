import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import type { ConfigService } from '@nestjs/config';
import { emailLightInlineStyle } from './email-html-tokens';
import { escapeHtml } from './email-html.util';

/** Public path on the Next.js site (`public/01_bailarina.png`). */
export const EMAIL_LOGO_PUBLIC_PATH = '/01_bailarina.png';

/** Display size in HTML emails (matches optimized `assets/email/01_bailarina.png`). */
export const EMAIL_LOGO_DISPLAY_WIDTH = 140;
export const EMAIL_LOGO_DISPLAY_HEIGHT = 141;

export type EmailBranding = {
  siteBaseUrl?: string;
  logoImageUrl?: string;
};

function parseFrontendOrigins(raw?: string): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

function isLocalhostOrigin(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === 'localhost' || host === '127.0.0.1' || host === '::1';
  } catch {
    return false;
  }
}

/**
 * Best public site origin for footer links (not for logo when localhost-only).
 * In production, skips localhost entries and prefers https.
 */
export function resolvePublicSiteBaseUrl(
  frontendUrlRaw?: string,
  nodeEnv?: string,
): string | undefined {
  const origins = parseFrontendOrigins(frontendUrlRaw);
  if (origins.length === 0) return undefined;

  const isProd = nodeEnv === 'production';
  const candidates = isProd
    ? origins.filter((o) => !isLocalhostOrigin(o))
    : origins;
  const list = candidates.length > 0 ? candidates : origins;

  const https = list.find((o) => o.startsWith('https://'));
  return https ?? list[0];
}

let cachedEmbeddedLogoDataUri: string | null | undefined;

/** Inline PNG so logos work when FRONTEND_URL is localhost (emails cannot load localhost). */
function loadEmbeddedLogoDataUri(): string | null {
  if (cachedEmbeddedLogoDataUri !== undefined) {
    return cachedEmbeddedLogoDataUri;
  }
  const candidates = [
    join(process.cwd(), 'assets/email/01_bailarina.png'),
    join(process.cwd(), 'dist/assets/email/01_bailarina.png'),
    join(__dirname, '..', '..', '..', '..', 'assets/email/01_bailarina.png'),
    join(__dirname, '..', '..', '..', 'assets/email/01_bailarina.png'),
  ];
  for (const filePath of candidates) {
    if (!existsSync(filePath)) continue;
    try {
      const buf = readFileSync(filePath);
      cachedEmbeddedLogoDataUri = `data:image/png;base64,${buf.toString('base64')}`;
      return cachedEmbeddedLogoDataUri;
    } catch {
      /* try next path */
    }
  }
  cachedEmbeddedLogoDataUri = null;
  return null;
}

/**
 * Absolute logo URL for <img src>. Order: EMAIL_LOGO_URL → public site asset → embedded PNG.
 */
export function resolveEmailLogoImageUrl(options: {
  frontendUrlRaw?: string;
  explicitLogoUrl?: string;
  nodeEnv?: string;
}): string | undefined {
  const explicit = options.explicitLogoUrl?.trim();
  if (explicit) return explicit;

  const siteBase = resolvePublicSiteBaseUrl(
    options.frontendUrlRaw,
    options.nodeEnv,
  );
  if (siteBase && !isLocalhostOrigin(siteBase)) {
    return `${siteBase}${EMAIL_LOGO_PUBLIC_PATH}`;
  }

  return loadEmbeddedLogoDataUri() ?? undefined;
}

/** When ConfigService is not injected (e.g. small mail modules). */
export function emailBrandingFromProcessEnv(): EmailBranding {
  return emailBrandingFromConfig({
    get: (key: string) => process.env[key],
  });
}

export function emailBrandingFromConfig(
  config: Pick<ConfigService, 'get'>,
): EmailBranding {
  const frontendRaw = config.get<string>('FRONTEND_URL')?.trim();
  const nodeEnv = config.get<string>('NODE_ENV') ?? process.env.NODE_ENV;
  const siteBaseUrl = resolvePublicSiteBaseUrl(frontendRaw, nodeEnv);
  const logoImageUrl = resolveEmailLogoImageUrl({
    frontendUrlRaw: frontendRaw,
    explicitLogoUrl: config.get<string>('EMAIL_LOGO_URL'),
    nodeEnv,
  });
  return { siteBaseUrl, logoImageUrl };
}

function normalizeBrandingInput(input?: string | EmailBranding): EmailBranding {
  const fromEnv = emailBrandingFromProcessEnv();

  if (input == null) {
    return fromEnv;
  }

  if (typeof input === 'string') {
    const siteBaseUrl = input.trim().replace(/\/$/, '') || undefined;
    const logoImageUrl =
      siteBaseUrl && !isLocalhostOrigin(siteBaseUrl)
        ? `${siteBaseUrl}${EMAIL_LOGO_PUBLIC_PATH}`
        : (fromEnv.logoImageUrl ?? loadEmbeddedLogoDataUri() ?? undefined);
    return {
      siteBaseUrl: siteBaseUrl ?? fromEnv.siteBaseUrl,
      logoImageUrl,
    };
  }

  return {
    siteBaseUrl: input.siteBaseUrl ?? fromEnv.siteBaseUrl,
    logoImageUrl: input.logoImageUrl ?? fromEnv.logoImageUrl,
  };
}

/** Centered logo image + “SHAMELL” below. Falls back to wordmark only if no logo URL. */
export function buildEmailLogoWordmarkHtml(
  branding?: string | EmailBranding,
): string {
  const { logoImageUrl } = normalizeBrandingInput(branding);
  const dividerColor = emailLightInlineStyle('divider');
  const wordmarkColor = emailLightInlineStyle('wordmarkGold');
  const wordmark = `<p class="email-wordmark" style="margin:14px 0 0;font-family:Georgia,serif;font-size:18px;letter-spacing:0.26em;color:${wordmarkColor};font-weight:600;">SHAMELL</p>`;
  if (!logoImageUrl) {
    return `<div class="email-header-divider" style="text-align:center;padding:0 0 20px;border-bottom:1px solid ${dividerColor};">${wordmark}</div>`;
  }
  const src = escapeHtml(logoImageUrl);
  return `<div class="email-header-divider" style="text-align:center;padding:0 0 20px;border-bottom:1px solid ${dividerColor};">
<img src="${src}" alt="Shamell" width="${EMAIL_LOGO_DISPLAY_WIDTH}" height="${EMAIL_LOGO_DISPLAY_HEIGHT}" style="display:block;margin:0 auto;max-width:${EMAIL_LOGO_DISPLAY_WIDTH}px;width:${EMAIL_LOGO_DISPLAY_WIDTH}px;height:auto;border:0;outline:none;text-decoration:none;" />
${wordmark}
</div>`;
}

/** Plain-text emails: brand line(s) at top. */
export function plainTextBrandLead(siteUrl?: string): string {
  const lines = ['SHAMELL'];
  const u = siteUrl?.trim();
  if (u) lines.push(u);
  lines.push('');
  return lines.join('\n');
}

/** Resolve branding when templates only receive legacy `frontendBaseUrl` string. */
export function emailBrandingFromFrontendBaseUrl(
  frontendBaseUrl?: string,
  config?: Pick<ConfigService, 'get'>,
): EmailBranding {
  const trimmed = frontendBaseUrl?.trim();
  if (trimmed && !isLocalhostOrigin(trimmed)) {
    return {
      siteBaseUrl: trimmed.replace(/\/$/, ''),
      logoImageUrl: `${trimmed.replace(/\/$/, '')}${EMAIL_LOGO_PUBLIC_PATH}`,
    };
  }
  if (config) return emailBrandingFromConfig(config);
  return {
    siteBaseUrl: trimmed?.replace(/\/$/, ''),
    logoImageUrl:
      resolveEmailLogoImageUrl({ frontendUrlRaw: trimmed }) ??
      loadEmbeddedLogoDataUri() ??
      undefined,
  };
}
