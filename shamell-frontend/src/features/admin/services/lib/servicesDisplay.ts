import { TYPE_PILL_STYLES } from "./servicesConstants";

export function pillClassForTypeName(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = name.charCodeAt(i) + ((h << 5) - h);
  }
  return TYPE_PILL_STYLES[Math.abs(h) % TYPE_PILL_STYLES.length];
}

/** Short label for modals and confirmations (first line or sentence, not full description). */
export function serviceDeleteConfirmName(description: string): string {
  const { title } = displayServiceHeading(description);
  const oneLine = title.replace(/\s+/g, " ").trim();
  const sentence = oneLine.match(/^.{1,160}?[.!?](?=\s|$)/)?.[0]?.trim();
  return (sentence && sentence.length < oneLine.length ? sentence : oneLine) || "Untitled service";
}

export function displayServiceHeading(description: string): { title: string; subtitle: string } {
  const t = description.trim();
  if (!t) return { title: "No description", subtitle: "" };
  const firstBlock = t.split(/\n/)[0]?.trim() ?? t;
  const title = firstBlock;
  let subtitle = "";
  if (t.includes("\n")) {
    subtitle = t
      .split(/\n/)
      .slice(1)
      .join(" ")
      .trim();
  } else if (t.length > firstBlock.length) {
    subtitle = t.slice(firstBlock.length).trim().replace(/^\.+\s*/, "");
  }
  return { title, subtitle };
}

export function formatPriceEn(value: number | null | undefined): string {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value));
}
