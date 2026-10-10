import { describe, expect, it } from "vitest";
import { VENUE_TABLES_PATH } from "@/features/admin/venue-tables/lib/venueTablesRoutes";

describe("venueTablesRoutes", () => {
  it("exports admin venue tables path", () => {
    expect(VENUE_TABLES_PATH).toBe("/admin/venue-tables");
  });
});
