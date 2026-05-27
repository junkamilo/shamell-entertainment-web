import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import { mapAdminHeaderTextFromApi } from "@/lib/headerTextStyleTokens";
import type { AdminHeaderTextRow } from "@/lib/headerTextTypes";

export async function fetchAdminHeaderText(
  token: string,
): Promise<AdminHeaderTextRow | null> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(`${base}/api/v1/header-text/admin`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!response.ok) {
    const data: unknown = await response.json().catch(() => ({}));
    const message =
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof (data as { message: unknown }).message === "string"
        ? (data as { message: string }).message
        : "Could not load header text.";
    throw new Error(message);
  }

  const data: unknown = await response.json();
  return mapAdminHeaderTextFromApi(data);
}
