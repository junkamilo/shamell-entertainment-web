/** Local calendar date helpers (US-facing form; storage uses `YYYY-MM-DD`). */

export function startOfTodayLocal(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

export function parseISOLocal(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  return dt;
}

export function toISOLocalDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function formatDateDisplayUs(iso: string): string {
  const d = parseISOLocal(iso);
  if (!d) return "";
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function hhmmToMinutes(hhmm: string): number | null {
  const t = hhmm.trim();
  if (!/^\d{2}:\d{2}$/.test(t)) return null;
  const h = Number(t.slice(0, 2));
  const m = Number(t.slice(3, 5));
  if (!Number.isFinite(h) || !Number.isFinite(m) || h > 23 || m > 59) return null;
  return h * 60 + m;
}

export function formatTimeDisplayUs(hhmm: string): string {
  if (!/^\d{2}:\d{2}$/.test(hhmm.trim())) return "";
  const [hs, ms] = hhmm.split(":");
  const d = new Date();
  d.setHours(Number(hs), Number(ms), 0, 0);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

export function hhmmToParts(hhmm: string): { h12: number; min: number; ap: "AM" | "PM" } {
  if (!/^\d{2}:\d{2}$/.test(hhmm.trim())) return { h12: 12, min: 0, ap: "PM" };
  let h24 = Number(hhmm.slice(0, 2));
  const min = Number(hhmm.slice(3, 5));
  const ap = h24 >= 12 ? "PM" : "AM";
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  return { h12, min, ap };
}

export function partsToHHMM(h12: number, min: number, ap: "AM" | "PM"): string {
  let h24 = h12 % 12;
  if (ap === "PM") h24 += 12;
  if (ap === "AM" && h12 === 12) h24 = 0;
  return `${String(h24).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}
