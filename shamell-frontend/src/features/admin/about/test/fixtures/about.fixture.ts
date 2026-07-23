import type { AdminAboutRow } from "../../types/aboutAdmin.types";

export function makeAdminAboutRow(overrides: Partial<AdminAboutRow> = {}): AdminAboutRow {
  return {
    id: "about_1",
    title: "ABOUT SHAMELL",
    paragraph1: "Performance artistry for private galas.",
    coreValues: ["Professionalism", "Excellence"],
    imageUrl: "https://cdn.test/hero.jpg",
    heroMediaType: "IMAGE",
    updatedAt: "2026-01-15T10:00:00.000Z",
    ...overrides,
  };
}
