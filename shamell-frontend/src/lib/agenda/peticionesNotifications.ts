import type { PeticionesLane } from "@/features/admin/agenda/peticiones/types/peticiones.types";

export const PETICIONES_LAST_SEEN_AT_KEY = "peticiones.lastSeenAt";
const BOOKINGS_LAST_SEEN_KEY = "peticiones.bookingsLastSeenAt";
const GUIDANCE_LAST_SEEN_KEY = "peticiones.guidanceLastSeenAt";
const PRIVATE_CLASSES_LAST_SEEN_KEY = "peticiones.privateClassesLastSeenAt";

export const PETICIONES_BADGE_REFRESH_EVENT = "shamell:peticiones-badge-refresh";

function laneKey(lane: PeticionesLane): string {
  if (lane === "guidance") return GUIDANCE_LAST_SEEN_KEY;
  if (lane === "private_classes") return PRIVATE_CLASSES_LAST_SEEN_KEY;
  return BOOKINGS_LAST_SEEN_KEY;
}

function migrateLegacyLastSeen(): void {
  if (typeof window === "undefined") return;
  const legacy = window.localStorage.getItem(PETICIONES_LAST_SEEN_AT_KEY);
  if (!legacy) return;
  const n = Number(legacy);
  if (!Number.isFinite(n) || n <= 0) return;
  if (!window.localStorage.getItem(BOOKINGS_LAST_SEEN_KEY)) {
    window.localStorage.setItem(BOOKINGS_LAST_SEEN_KEY, legacy);
  }
  if (!window.localStorage.getItem(GUIDANCE_LAST_SEEN_KEY)) {
    window.localStorage.setItem(GUIDANCE_LAST_SEEN_KEY, legacy);
  }
}

export function readPeticionesLastSeenAt(lane: PeticionesLane = "bookings"): number {
  if (typeof window === "undefined") return 0;
  migrateLegacyLastSeen();
  const raw = window.localStorage.getItem(laneKey(lane));
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function markPeticionesLaneSeenNow(lane: PeticionesLane): number {
  if (typeof window === "undefined") return 0;
  const now = Date.now();
  window.localStorage.setItem(laneKey(lane), String(now));
  notifyPeticionesBadgeRefresh();
  return now;
}

/** Marks inbox lanes as seen (legacy helper). */
export function markPeticionesSeenNow(): number {
  if (typeof window === "undefined") return 0;
  const now = Date.now();
  window.localStorage.setItem(BOOKINGS_LAST_SEEN_KEY, String(now));
  window.localStorage.setItem(GUIDANCE_LAST_SEEN_KEY, String(now));
  window.localStorage.setItem(PRIVATE_CLASSES_LAST_SEEN_KEY, String(now));
  window.localStorage.setItem(PETICIONES_LAST_SEEN_AT_KEY, String(now));
  notifyPeticionesBadgeRefresh();
  return now;
}

export function notifyPeticionesBadgeRefresh(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(PETICIONES_BADGE_REFRESH_EVENT));
}
