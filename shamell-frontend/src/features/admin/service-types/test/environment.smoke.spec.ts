import { describe, expect, it } from "vitest";
import { server } from "@/test/server";
import { fetchAdminServiceTypes } from "../services/fetchAdminServiceTypes";
import { postAdminServiceType } from "../services/postAdminServiceType";
import {
  makeServiceTypeItem,
  makeServiceTypesApiPayload,
} from "./fixtures/serviceTypes.fixture";
import { FIXTURE_SERVICE_TYPE_ID } from "./fixtures/uuids.fixture";
import { createMockServiceTypesPageState } from "./helpers/mockServiceTypesPage";
import { serviceTypesListHandler } from "./mocks/handlers";

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
