import { isAboutHeroVideoDisplay } from "@/lib/aboutHeroMedia";
import type { AboutAdminStats, AdminAboutRow } from "../types/aboutAdmin.types";

export function excerptBody(text: string, max = 220): string {
  const firstLine = text.split(/\r?\n/).find((line) => line.trim()) ?? "";
  const oneLine = firstLine.trim().replace(/\s+/g, " ");
  if (!oneLine) return "";
  return oneLine.length > max ? `${oneLine.slice(0, max)}…` : oneLine;
}

export function formatRelativeEn(iso: string | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 45) return "Just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return date.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

export function parseCoreValuesFromText(text: string): string[] {
  return text
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeAdminAboutRow(data: unknown): AdminAboutRow | null {
  if (!data || typeof data !== "object" || !("id" in data)) return null;
  const row = data as AdminAboutRow;
  if (typeof row.title !== "string") return null;
  return {
    ...row,
    heroMediaType: row.heroMediaType === "VIDEO" ? "VIDEO" : "IMAGE",
  };
}

export function buildAboutStats(record: AdminAboutRow | null): AboutAdminStats {
  if (!record) {
    return {
      state: "Not published",
      values: "—",
      media: "—",
      updated: "—",
    };
  }
  return {
    state: "Published",
    values: String(record.coreValues?.length ?? 0),
    media:
      record.imageUrl == null
        ? "No"
        : isAboutHeroVideoDisplay({
            heroMediaType: record.heroMediaType,
            imageUrl: record.imageUrl,
          })
          ? "Video"
          : "Photo",
    updated: formatRelativeEn(record.updatedAt),
  };
}
