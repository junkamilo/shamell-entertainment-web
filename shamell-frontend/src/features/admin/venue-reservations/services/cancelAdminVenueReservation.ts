import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";

export async function cancelAdminVenueReservation(
  token: string,
  id: string,
): Promise<{ ok: boolean; message?: string }> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(`${base}/api/v1/venue-reservations/admin/${id}/cancel`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const msg =
      data && typeof data === "object" && "message" in data
        ? String((data as { message: unknown }).message)
        : "Cancel failed.";
    return { ok: false, message: msg };
  }
  return {
    ok: true,
    message:
      data && typeof data === "object" && "message" in data
        ? String((data as { message: unknown }).message)
        : undefined,
  };
}
