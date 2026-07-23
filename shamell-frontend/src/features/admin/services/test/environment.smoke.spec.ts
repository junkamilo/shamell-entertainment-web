import { describe, expect, it } from "vitest";
import { fetchAdminServices } from "../services/fetchAdminServices";
import { postAdminService } from "../services/postAdminService";
import {
  makeAdminService,
  makeAdminServicesApiPayload,
} from "./fixtures/services.fixture";
import { FIXTURE_SERVICE_ID } from "./fixtures/uuids.fixture";
import { createMockServicesPageState } from "./helpers/mockServicesPage";

describe("services test environment", () => {
  it("exposes usable fixtures and page mock", () => {
    expect(makeAdminService().id).toBe(FIXTURE_SERVICE_ID);
    expect(makeAdminServicesApiPayload()).toHaveLength(2);

    const page = createMockServicesPageState({ isModalOpen: true });
    expect(page.isModalOpen).toBe(true);
    page.openCreateModal();
    expect(page.openCreateModal).toHaveBeenCalled();
  });

  it("serves services list and create via MSW", async () => {
    const list = await fetchAdminServices("token-1");
    expect(list[0]?.id).toBe(FIXTURE_SERVICE_ID);

    await expect(
      postAdminService("token-1", new FormData()),
    ).resolves.toBeUndefined();
  });
});
