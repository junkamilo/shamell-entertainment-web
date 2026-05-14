/**
 * Shared transactional email branding: public-site logo + wordmark.
 * Logo file must be served at `{FRONTEND_ORIGIN}/01_bailarina.png` (Next.js `public/`).
 */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Centered logo image + “SHAMELL” below. Falls back to wordmark only if no base URL. */
export function buildEmailLogoWordmarkHtml(
  publicSiteBaseUrl: string | undefined,
): string {
  const base =
    typeof publicSiteBaseUrl === 'string'
      ? publicSiteBaseUrl.trim().replace(/\/$/, '')
      : '';
  const wordmark = `<p style="margin:14px 0 0;font-family:Georgia,serif;font-size:18px;letter-spacing:0.26em;color:#d4af37;font-weight:600;">SHAMELL</p>`;
  if (!base) {
    return `<div style="text-align:center;padding:0 0 20px;border-bottom:1px solid rgba(212,175,106,0.2);">${wordmark}</div>`;
  }
  const src = `${base}/01_bailarina.png`;
  return `<div style="text-align:center;padding:0 0 20px;border-bottom:1px solid rgba(212,175,106,0.2);">
<img src="${escapeHtml(src)}" alt="Shamell" width="140" style="display:block;margin:0 auto;max-width:180px;height:auto;border:0;outline:none;text-decoration:none;" />
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
