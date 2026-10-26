import { describe, expect, it } from "vitest";
import { server } from "@test/support/server";
import { fetchAdminOccasionTypes } from "@/features/admin/occasion-types/services/fetchAdminOccasionTypes";
import { postAdminOccasionType } from "@/features/admin/occasion-types/services/postAdminOccasionType";
import {
  makeOccasionTypeItem,
  makeOccasionTypesApiPayload,
} from "@test/features/admin/occasion-types/support/fixtures/occasionTypes.fixture";
import { FIXTURE_OCCASION_TYPE_ID } from "@test/features/admin/occasion-types/support/fixtures/uuids.fixture";
import { createMockOccasionTypesPageState } from "@test/features/admin/occasion-types/support/helpers/mockOccasionTypesPage";
import { occasionTypesListHandler } from "@test/features/admin/occasion-types/support/mocks/handlers";

describe("occasion-types test environment", () => {
  it("exposes usable fixtures and page mock", () => {
    expect(makeOccasionTypeItem().id).toBe(FIXTURE_OCCASION_TYPE_ID);
    expect(makeOccasionTypesApiPayload()).toHaveLength(2);

    const page = createMockOccasionTypesPageState({ isModalOpen: true });
    expect(page.isModalOpen).toBe(true);
    page.openCreateModal();
    expect(page.openCreateModal).toHaveBeenCalled();
  });

  it("serves occasion types list and create via MSW", async () => {
    server.use(occasionTypesListHandler());

    const list = await fetchAdminOccasionTypes("token-1");
    expect(list[0]?.id).toBe(FIXTURE_OCCASION_TYPE_ID);

    await expect(
      postAdminOccasionType("token-1", { name: "Birthday" }),
    ).resolves.toBeUndefined();
  });
});
