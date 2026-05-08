export const PETICIONES_LAST_SEEN_AT_KEY = "peticiones.lastSeenAt";

export function readPeticionesLastSeenAt(): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(PETICIONES_LAST_SEEN_AT_KEY);
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function markPeticionesSeenNow(): number {
  if (typeof window === "undefined") return 0;
  const now = Date.now();
  window.localStorage.setItem(PETICIONES_LAST_SEEN_AT_KEY, String(now));
  return now;
}
