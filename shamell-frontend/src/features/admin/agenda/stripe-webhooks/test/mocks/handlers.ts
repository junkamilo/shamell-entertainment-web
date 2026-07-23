import { http, HttpResponse } from "msw";
import { makeWebhooksList } from "../fixtures/stripeWebhooks.fixture";

export const stripeWebhooksHandlers = [
  http.get("*/api/v1/admin/stripe-webhook-events", ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const flow = url.searchParams.get("metadataFlow");
    let list = makeWebhooksList();

    if (status) {
      list = makeWebhooksList(list.items.filter((row) => row.status === status));
    }
    if (flow) {
      list = makeWebhooksList(
        list.items.filter((row) => row.metadataFlow === flow),
      );
    }

    return HttpResponse.json(list);
  }),
];
