export function maskEmail(email: string | null | undefined): string | null {
  if (!email?.trim()) return null;
  const trimmed = email.trim();
  const at = trimmed.indexOf('@');
  if (at <= 0) return '***';
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at);
  const maskedLocal =
    local.length <= 1
      ? '*'
      : `${local[0]}${'*'.repeat(Math.min(3, local.length - 1))}`;
  return `${maskedLocal}${domain}`;
}

export function maskCustomerName(name: string | null | undefined): string {
  if (!name?.trim()) return 'Guest';
  const first = name.trim().split(/\s+/)[0];
  return first || 'Guest';
}
