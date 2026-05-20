const DEFAULT_BACKEND = "http://localhost:3001";

/** Nest API origin, no trailing slash (matches prior login + dashboard callers). */
export function getAdminApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_BACKEND_URL ?? DEFAULT_BACKEND;
  return raw.replace(/\/$/, "");
}
