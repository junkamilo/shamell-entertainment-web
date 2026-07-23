import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import type { PeticionesLane } from "../peticiones/types/peticiones.types";

export type FetchPeticionesBadgeOptions = {
  since?: number;
  lane?: PeticionesLane;
};

export async function fetchPeticionesBadge(
  token: string,
  options: FetchPeticionesBadgeOptions = {},
): Promise<number> {
  const { since, lane = "bookings" } = options;
  const sp = new URLSearchParams({ lane });
  if (since !== undefined && since > 0) sp.set("since", String(since));

  const res = await fetch(
    `${getAdminApiBaseUrl()}/api/v1/contact/peticiones/badge?${sp}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const json = (await res.json().catch(() => ({}))) as { count?: number };
  const count = typeof json.count === "number" && Number.isFinite(json.count) ? json.count : 0;
  return count;
}
