import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import type {
  AdminPaymentsListResponse,
  AdminPaymentsQuery,
} from "../types/paymentHistory.types";

function buildQueryString(query: AdminPaymentsQuery): string {
  const sp = new URLSearchParams();
  if (query.page != null) sp.set("page", String(query.page));
  if (query.limit != null) sp.set("limit", String(query.limit));
  if (query.flow) sp.set("flow", query.flow);
  if (query.status) sp.set("status", query.status);
  if (query.q?.trim()) sp.set("q", query.q.trim());
  if (query.from) sp.set("from", query.from);
  if (query.to) sp.set("to", query.to);
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export async function fetchAdminPayments(
  token: string,
  query: AdminPaymentsQuery = {},
): Promise<AdminPaymentsListResponse> {
  const base = getAdminApiBaseUrl();
  const res = await fetch(
    `${base}/api/v1/admin/payments${buildQueryString(query)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) {
    throw new Error(`Failed to load payments (${res.status})`);
  }
  return res.json() as Promise<AdminPaymentsListResponse>;
}

export async function fetchPaymentHistoryBadge(
  token: string,
  since?: number,
): Promise<number> {
  const sp = new URLSearchParams();
  if (since !== undefined && since > 0) sp.set("since", String(since));
  const qs = sp.toString();
  const res = await fetch(
    `${getAdminApiBaseUrl()}/api/v1/admin/payments/badge${qs ? `?${qs}` : ""}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const json = (await res.json().catch(() => ({}))) as { count?: number };
  return typeof json.count === "number" && Number.isFinite(json.count)
    ? json.count
    : 0;
}
