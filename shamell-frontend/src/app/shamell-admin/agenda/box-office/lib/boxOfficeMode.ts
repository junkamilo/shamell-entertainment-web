export type BoxOfficeMode = "fixed" | "classes";

export function parseBoxOfficeMode(raw: string | null): BoxOfficeMode {
  return raw === "classes" ? "classes" : "fixed";
}
