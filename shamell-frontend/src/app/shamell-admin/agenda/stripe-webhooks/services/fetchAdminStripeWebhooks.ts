import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import type {
  AdminStripeWebhookEventsListResponse,
  AdminStripeWebhookEventsQuery,
} from "../types/stripeWebhooks.types";

function buildQueryString(query: AdminStripeWebhookEventsQuery): string {
  const sp = new URLSearchParams();
  if (query.page != null) sp.set("page", String(query.page));
  if (query.limit != null) sp.set("limit", String(query.limit));
  if (query.eventType?.trim()) sp.set("eventType", query.eventType.trim());
  if (query.metadataFlow?.trim()) sp.set("metadataFlow", query.metadataFlow.trim());
  if (query.checkoutSessionId?.trim()) {
    sp.set("checkoutSessionId", query.checkoutSessionId.trim());
  }
  if (query.status) sp.set("status", query.status);
  if (query.processed === true) sp.set("processed", "true");
  if (query.processed === false) sp.set("processed", "false");
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export async function fetchAdminStripeWebhooks(
  token: string,
  query: AdminStripeWebhookEventsQuery = {},
): Promise<AdminStripeWebhookEventsListResponse> {
  const base = getAdminApiBaseUrl();
  const res = await fetch(
    `${base}/api/v1/admin/stripe-webhook-events${buildQueryString(query)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) {
    throw new Error(`Failed to load webhook events (${res.status})`);
  }
  return res.json() as Promise<AdminStripeWebhookEventsListResponse>;
}
