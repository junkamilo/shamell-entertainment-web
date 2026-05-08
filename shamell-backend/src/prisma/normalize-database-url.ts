/**
 * Adjusts Postgres connection URLs for node-pg and hosted providers (Supabase, Neon, etc.).
 */
export function normalizeDatabaseUrl(connectionString: string): string {
  let u: URL;
  try {
    u = new URL(connectionString);
  } catch {
    return connectionString;
  }

  if (u.protocol !== 'postgres:' && u.protocol !== 'postgresql:') {
    return connectionString;
  }

  const sslmode = u.searchParams.get('sslmode');
  if (
    sslmode === 'require' ||
    sslmode === 'prefer' ||
    sslmode === 'verify-ca'
  ) {
    u.searchParams.set('sslmode', 'verify-full');
  }

  const host = u.hostname;
  const port = u.port;

  const isSupabaseTransactionPooler =
    (host.endsWith('.pooler.supabase.com') ||
      host.endsWith('.pooler.supabase.co')) &&
    port === '6543';
  if (isSupabaseTransactionPooler && !u.searchParams.has('pgbouncer')) {
    u.searchParams.set('pgbouncer', 'true');
  }

  if (!u.searchParams.has('connect_timeout')) {
    const sec = process.env.DATABASE_CONNECT_TIMEOUT_SEC;
    u.searchParams.set(
      'connect_timeout',
      sec !== undefined && sec !== '' ? sec : '30',
    );
  }

  return u.toString();
}
