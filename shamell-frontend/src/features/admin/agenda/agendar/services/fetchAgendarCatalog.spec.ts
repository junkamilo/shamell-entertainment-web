import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchAgendarCatalog } from "./fetchAgendarCatalog";
import {
  sampleAgendarCatalog,
  sampleAgendarCatalogApiResponse,
} from "../tests/fixtures/catalog.fixture";
import { FIXTURE_SERVICE_ID } from "../tests/fixtures/uuids.fixture";

vi.mock("@/app/admin/shared/lib/adminApiBaseUrl", () => ({
  getAdminApiBaseUrl: () => "http://test-api",
}));

const legacyCatalog = {
  services: [{ id: "legacy-svc", serviceTypeName: "Legacy" }],
  eventTypes: [{ id: "legacy-et", name: "Legacy Event" }],
  occasions: [{ id: "legacy-oc", name: "Legacy Occasion" }],
};

vi.mock("@/features/admin/agenda/shared/services/fetchAgendaCatalogMaps", () => ({
  fetchAgendaCatalogMaps: vi.fn(async () => legacyCatalog),
}));

describe("fetchAgendarCatalog", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("parses aggregated catalog endpoint on success", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => sampleAgendarCatalogApiResponse,
    } as Response);

    const catalog = await fetchAgendarCatalog("token-123");
    expect(catalog).toEqual(sampleAgendarCatalog);
    expect(fetch).toHaveBeenCalledWith("http://test-api/api/v1/agenda/agendar/catalog", {
      headers: { Authorization: "Bearer token-123" },
      cache: "no-store",
    });
  });

  it("uses description as service label when serviceTypeName is missing", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        services: [{ id: FIXTURE_SERVICE_ID, description: "From description" }],
        eventTypes: [],
        occasions: [],
      }),
    } as Response);

    const catalog = await fetchAgendarCatalog("token-123");
    expect(catalog.services).toEqual([
      { id: FIXTURE_SERVICE_ID, serviceTypeName: "From description" },
    ]);
  });

  it("drops rows without ids and tolerates empty payload", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        services: [{ serviceTypeName: "No id" }, { id: "" }],
        eventTypes: "bad",
        occasions: undefined,
      }),
    } as Response);

    const catalog = await fetchAgendarCatalog("token-123");
    expect(catalog).toEqual({
      services: [],
      eventTypes: [],
      occasions: [],
    });
  });

  it("falls back to legacy catalog maps when aggregated endpoint fails", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as Response);

    const catalog = await fetchAgendarCatalog("token-123");
    expect(catalog.services[0]?.id).toBe("legacy-svc");
    expect(catalog.eventTypes[0]?.name).toBe("Legacy Event");
    expect(catalog.occasions[0]?.name).toBe("Legacy Occasion");
  });
});
