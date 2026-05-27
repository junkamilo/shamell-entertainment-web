export function splitIsoToDateAndTime(iso: string | null | undefined): {
  date: string;
  time: string;
} {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "", time: "" };
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

export function combineDateAndTime(date: string, time: string): string | undefined {
  if (!date.trim()) return undefined;
  const t = time.trim() || "00:00";
  const parsed = new Date(`${date}T${t}`);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}
