import { TYPE_PILL_STYLES } from "./eventsConstants";

export function pillIndexForTypeName(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = name.charCodeAt(i) + ((h << 5) - h);
  }
  return Math.abs(h) % TYPE_PILL_STYLES.length;
}

export function pillClassForTypeName(name: string) {
  return TYPE_PILL_STYLES[pillIndexForTypeName(name)];
}

export function displayEventHeading(description: string): { title: string; subtitle: string } {
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

/** First line of description (for tooltips). */
export function firstLineOfEventDescription(description: string): string {
  const t = description.trim();
  if (!t) return "";
  return t.split(/\n/)[0]?.trim() ?? t;
}

/** Short single-line label for the events data table only. */
export function eventTitleForTablePreview(description: string, maxLen = 36): string {
  const line = firstLineOfEventDescription(description);
  if (!line) return "No description";
  if (line.length <= maxLen) return line;
  return `${line.slice(0, maxLen - 1).trimEnd()}…`;
}

export function formatShortDateUs(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short" }).replace(".", "");
}
