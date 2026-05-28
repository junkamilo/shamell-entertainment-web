import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import { mapAdminHeaderTextFromApi } from "@/lib/headerTextStyleTokens";
import type { AdminHeaderTextRow, HeaderTextContent } from "@/lib/headerTextTypes";

export type PatchAdminHeaderTextPayload = Partial<HeaderTextContent>;

export async function patchAdminHeaderText(
  token: string,
  payload: PatchAdminHeaderTextPayload,
): Promise<AdminHeaderTextRow> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(`${base}/api/v1/header-text/admin`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const data: unknown = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof (data as { message: unknown }).message === "string"
        ? (data as { message: string }).message
        : "Could not save header text.";
    throw new Error(message);
  }

  const mapped = mapAdminHeaderTextFromApi(data);
  if (!mapped) {
    throw new Error("Invalid response from server.");
  }

  return mapped;
}
