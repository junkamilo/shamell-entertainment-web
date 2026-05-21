import type {
  EventTypeItem,
  EventTypeOccasionAssignmentPayload,
  OccasionCatalogItem,
} from "../types/eventTypes.types";

/** All selected occasions are stored as `OCCASION_SINGLE` (contact list). */
export function packLinkedOccasionsForApi(
  linkedIds: string[],
  catalog: OccasionCatalogItem[],
): EventTypeOccasionAssignmentPayload[] {
  const order = new Map(catalog.map((c, i) => [c.id, i]));
  const sorted = [...linkedIds].sort((a, b) => (order.get(a) ?? 999) - (order.get(b) ?? 999));
  return sorted.map((occasionTypeId) => ({ occasionTypeId, usage: "OCCASION_SINGLE" as const }));
}

export function linkedOccasionIdsSignature(ids: string[]) {
  return JSON.stringify([...ids].sort());
}

/** Merge all already-linked occasions (any prior use) for editing in one list. */
export function flattenLinkedOccasionIdsFromAssignments(
  assignments: NonNullable<EventTypeItem["occasionAssignments"]> | undefined,
): string[] {
  if (!assignments?.length) return [];
  const sorted = [...assignments].sort((a, b) => {
    if (a.usage !== b.usage) return a.usage.localeCompare(b.usage);
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  });
  const seen = new Set<string>();
  const out: string[] = [];
  for (const a of sorted) {
    if (seen.has(a.occasionTypeId)) continue;
    seen.add(a.occasionTypeId);
    out.push(a.occasionTypeId);
  }
  return out;
}

export function formatLinkedOccasionLine(
  assignments: NonNullable<EventTypeItem["occasionAssignments"]> | undefined,
): string | null {
  if (!assignments?.length) return null;
  const seen = new Set<string>();
  const names: string[] = [];
  for (const a of assignments) {
    if (seen.has(a.occasionTypeId)) continue;
    seen.add(a.occasionTypeId);
    names.push(a.occasionName?.trim() || "…");
  }
  return names.length ? names.join(", ") : null;
}
