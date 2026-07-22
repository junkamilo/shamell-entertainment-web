import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import type {
  AdminPaymentFlow,
  AdminStripePaymentDetail,
} from "../types/paymentHistory.types";

export async function fetchAdminPaymentDetail(
  token: string,
  flow: AdminPaymentFlow,
  id: string,
): Promise<AdminStripePaymentDetail> {
  const base = getAdminApiBaseUrl();
  const res = await fetch(
    `${base}/api/v1/admin/payments/${encodeURIComponent(flow)}/${encodeURIComponent(id)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) {
    throw new Error(`Failed to load payment detail (${res.status})`);
  }
  return res.json() as Promise<AdminStripePaymentDetail>;
}
