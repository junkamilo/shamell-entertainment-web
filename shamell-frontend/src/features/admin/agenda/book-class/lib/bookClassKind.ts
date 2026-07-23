export type BookClassKind = "private" | "group";

export function parseBookClassKind(raw: string | null | undefined): BookClassKind {
  return raw === "group" ? "group" : "private";
}
