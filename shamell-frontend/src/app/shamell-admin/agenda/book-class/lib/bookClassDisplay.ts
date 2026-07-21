export const inputClass =
  "mt-1 w-full min-h-[44px] rounded-lg border border-gold/20 bg-black/30 px-3 py-2 font-body text-sm text-foreground outline-none transition focus:border-gold/45 focus:ring-1 focus:ring-gold/25";

export function formatSectionTime(start: string, end: string) {
  const fmt = (hhmm: string) => {
    const [hs, ms] = hhmm.split(":");
    const d = new Date();
    d.setHours(Number(hs), Number(ms), 0, 0);
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };
  return `${fmt(start)} – ${fmt(end)}`;
}
