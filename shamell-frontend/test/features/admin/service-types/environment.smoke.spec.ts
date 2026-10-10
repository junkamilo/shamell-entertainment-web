import { describe, expect, it } from "vitest";
import { server } from "@test/support/server";
import { fetchAdminServiceTypes } from "@/features/admin/service-types/services/fetchAdminServiceTypes";
import { postAdminServiceType } from "@/features/admin/service-types/services/postAdminServiceType";
import {
  makeServiceTypeItem,
  makeServiceTypesApiPayload,
} from "@test/features/admin/service-types/support/fixtures/serviceTypes.fixture";
import { FIXTURE_SERVICE_TYPE_ID } from "@test/features/admin/service-types/support/fixtures/uuids.fixture";
import { createMockServiceTypesPageState } from "@test/features/admin/service-types/support/helpers/mockServiceTypesPage";
import { serviceTypesListHandler } from "@test/features/admin/service-types/support/mocks/handlers";

describe("service-types test environment", () => {
  it("exposes usable fixtures and page mock", () => {
    expect(makeServiceTypeItem().id).toBe(FIXTURE_SERVICE_TYPE_ID);
    expect(makeServiceTypesApiPayload()).toHaveLength(2);

    const page = createMockServiceTypesPageState({ isModalOpen: true });
    expect(page.isModalOpen).toBe(true);
    page.openCreateModal();
    expect(page.openCreateModal).toHaveBeenCalled();
  });

  it("serves service types list and create via MSW", async () => {
    server.use(serviceTypesListHandler());

    const list = await fetchAdminServiceTypes("token-1");
    expect(list[0]?.id).toBe(FIXTURE_SERVICE_TYPE_ID);

    await expect(
      postAdminServiceType("token-1", { name: "Performance" }),
    ).resolves.toBeUndefined();
  });
});
