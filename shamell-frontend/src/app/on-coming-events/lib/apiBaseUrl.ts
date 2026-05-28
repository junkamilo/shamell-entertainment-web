const DEFAULT_BACKEND = "http://localhost:3001";

export function getPublicApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_BACKEND_URL ?? DEFAULT_BACKEND;
  return raw.replace(/\/$/, "");
}
