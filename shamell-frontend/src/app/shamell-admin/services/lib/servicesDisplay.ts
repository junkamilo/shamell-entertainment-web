import { TYPE_PILL_STYLES } from "./servicesConstants";

export function pillClassForTypeName(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = name.charCodeAt(i) + ((h << 5) - h);
  }
  return TYPE_PILL_STYLES[Math.abs(h) % TYPE_PILL_STYLES.length];
}

export function displayServiceHeading(description: string): { title: string; subtitle: string } {
  const t = description.trim();
  if (!t) return { title: "No description", subtitle: "" };
  const firstBlock = t.split(/\n/)[0]?.trim() ?? t;
  const title = firstBlock.length > 64 ? `${firstBlock.slice(0, 62).trim()}…` : firstBlock;
  let subtitle = "";
  if (t.includes("\n")) {
    subtitle = t
      .split(/\n/)
      .slice(1)
      .join(" ")
      .trim()
      .slice(0, 140);
  } else if (t.length > title.length) {
    subtitle = t.slice(title.length).trim().replace(/^\.+\s*/, "").slice(0, 140);
  }
  if (subtitle.length > 130) subtitle = `${subtitle.slice(0, 128)}…`;
  return { title, subtitle };
}

export function formatPriceEn(value: number | null | undefined): string {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value));
}
