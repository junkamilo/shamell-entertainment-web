import { describe, expect, it } from "vitest";
import { fetchAdminStripeWebhooks } from "@/features/admin/agenda/stripe-webhooks/services/fetchAdminStripeWebhooks";
import { makeWebhookRow, makeWebhooksList } from "@test/features/admin/agenda/stripe-webhooks/support/fixtures/stripeWebhooks.fixture";
import { FIXTURE_WEBHOOK_ID } from "@test/features/admin/agenda/stripe-webhooks/support/fixtures/uuids.fixture";
import { createMockStripeWebhooksPageState } from "@test/features/admin/agenda/stripe-webhooks/support/helpers/mockStripeWebhooksPage";

describe("stripe-webhooks test environment", () => {
  it("exposes usable fixtures and page mock", () => {
    expect(makeWebhookRow().id).toBe(FIXTURE_WEBHOOK_ID);
    expect(makeWebhooksList().items).toHaveLength(2);

    const page = createMockStripeWebhooksPageState({ flowFilter: "class_session" });
    expect(page.flowFilter).toBe("class_session");
    page.setPage(2);
    expect(page.setPage).toHaveBeenCalledWith(2);
  });

  it("serves webhook events via MSW", async () => {
    const list = await fetchAdminStripeWebhooks("token-1", {
      page: 1,
      limit: 20,
      status: "FAILED",
    });
    expect(list.items.every((row) => row.status === "FAILED")).toBe(true);
    expect(list.items.length).toBeGreaterThan(0);
  });
});
