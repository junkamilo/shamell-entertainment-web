import { describe, expect, it } from "vitest";
import { server } from "@/test/server";
import { fetchAdminOccasionTypes } from "../services/fetchAdminOccasionTypes";
import { postAdminOccasionType } from "../services/postAdminOccasionType";
import {
  makeOccasionTypeItem,
  makeOccasionTypesApiPayload,
} from "./fixtures/occasionTypes.fixture";
import { FIXTURE_OCCASION_TYPE_ID } from "./fixtures/uuids.fixture";
import { createMockOccasionTypesPageState } from "./helpers/mockOccasionTypesPage";
import { occasionTypesListHandler } from "./mocks/handlers";

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
