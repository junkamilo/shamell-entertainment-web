import { describe, expect, it } from "vitest";
import { fetchAdminVenueTables } from "@/features/admin/venue-tables/services/fetchAdminVenueTables";
import { fetchAdminStandaloneChairs } from "@/features/admin/venue-tables/services/fetchAdminStandaloneChairs";
import {
  makeStandaloneChairConfig,
  makeVenueTable,
  makeVenueTablesApiPayload,
} from "@test/features/admin/venue-tables/support/fixtures/venueTables.fixture";
import {
  FIXTURE_CHAIR_CONFIG_ID,
  FIXTURE_TABLE_ID,
} from "@test/features/admin/venue-tables/support/fixtures/uuids.fixture";
import { createMockVenueTablesListState } from "@test/features/admin/venue-tables/support/helpers/mockVenueTablesPage";

describe("venue-tables test environment", () => {
  it("exposes usable fixtures and list mock", () => {
    expect(makeVenueTable().id).toBe(FIXTURE_TABLE_ID);
    expect(makeVenueTablesApiPayload()).toHaveLength(2);
    expect(makeStandaloneChairConfig().id).toBe(FIXTURE_CHAIR_CONFIG_ID);

    const list = createMockVenueTablesListState({ loading: true });
    expect(list.loading).toBe(true);
    list.reload();
    expect(list.reload).toHaveBeenCalled();
  });

  it("serves tables and standalone chairs via MSW", async () => {
    const tables = await fetchAdminVenueTables("token-1");
    expect(tables.ok).toBe(true);
    expect(tables.items[0]?.id).toBe(FIXTURE_TABLE_ID);

    const chairs = await fetchAdminStandaloneChairs("token-1");
    expect(chairs.ok).toBe(true);
    expect(chairs.config?.id).toBe(FIXTURE_CHAIR_CONFIG_ID);
  });
});
