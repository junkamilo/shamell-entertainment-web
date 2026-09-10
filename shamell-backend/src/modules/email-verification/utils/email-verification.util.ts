import { timingSafeEqual } from 'crypto';

export function maskEmail(email: string): string {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.indexOf('@');
  if (at < 1) return '***';
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  if (!domain) return '***';
  const keep = local.slice(0, 1);
  return `${keep}***@${domain}`;
}

export function hashesMatch(left: string, right: string): boolean {
  const a = Buffer.from(left, 'utf8');
  const b = Buffer.from(right, 'utf8');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
