import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { fetchAdminStripeWebhooks } from "./fetchAdminStripeWebhooks";
import { FIXTURE_WEBHOOK_ID } from "../test/fixtures/uuids.fixture";

describe("fetchAdminStripeWebhooks", () => {
  it("loads a paginated webhook events list", async () => {
    const result = await fetchAdminStripeWebhooks("token-1", {
      page: 1,
      limit: 20,
      metadataFlow: "class_session",
    });
    expect(result.items[0]?.id).toBe(FIXTURE_WEBHOOK_ID);
    expect(result.meta.page).toBe(1);
  });

  it("throws when the request fails", async () => {
    server.use(
      http.get("*/api/v1/admin/stripe-webhook-events", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    await expect(fetchAdminStripeWebhooks("token-1")).rejects.toThrow(
      /Failed to load webhook events \(500\)/,
    );
  });
});
