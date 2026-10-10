import { describe, expect, it } from "vitest";
import { fetchAdminServices } from "@/features/admin/services/services/fetchAdminServices";
import { postAdminService } from "@/features/admin/services/services/postAdminService";
import {
  makeAdminService,
  makeAdminServicesApiPayload,
} from "@test/features/admin/services/support/fixtures/services.fixture";
import { FIXTURE_SERVICE_ID } from "@test/features/admin/services/support/fixtures/uuids.fixture";
import { createMockServicesPageState } from "@test/features/admin/services/support/helpers/mockServicesPage";

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
