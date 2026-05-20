import { getPublicApiBaseUrl } from "../lib/apiBaseUrl";

export type OccupiedRange = { startMinutes: number; endMinutes: number };

export async function fetchOccupiedRanges(eventDate: string): Promise<OccupiedRange[]> {
  const base = getPublicApiBaseUrl();
  const res = await fetch(
    `${base}/api/v1/bookings/public/occupied?date=${encodeURIComponent(eventDate)}`,
    { cache: "no-store" },
  );
  if (!res.ok) throw new Error("occupied");
  const json: unknown = await res.json();
  if (!json || typeof json !== "object") return [];
  const occupied = (json as { occupied?: unknown }).occupied;
  if (!Array.isArray(occupied)) return [];
  return occupied
    .map((row) => {
      const o = row as { startMinutes?: unknown; endMinutes?: unknown };
      const startMinutes = Number(o.startMinutes);
      const endMinutes = Number(o.endMinutes);
      if (!Number.isFinite(startMinutes) || !Number.isFinite(endMinutes)) return null;
      return { startMinutes, endMinutes };
    })
    .filter(Boolean) as OccupiedRange[];
}
