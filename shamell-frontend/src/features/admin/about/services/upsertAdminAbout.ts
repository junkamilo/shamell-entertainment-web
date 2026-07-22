import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";

export type UpsertAdminAboutPayload = {
  title: string;
  paragraph1: string;
  coreValues: string[];
  mediaFile?: File | null;
};

export async function upsertAdminAbout(
  token: string,
  payload: UpsertAdminAboutPayload,
): Promise<{ response: Response; data: unknown }> {
  const base = getAdminApiBaseUrl();
  const body = new FormData();
  body.append("title", payload.title);
  body.append("paragraph1", payload.paragraph1);
  payload.coreValues.forEach((value) => body.append("coreValues", value));
  if (payload.mediaFile) body.append("media", payload.mediaFile);

  const response = await fetch(`${base}/api/v1/about/admin`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body,
    cache: "no-store",
  });
  const data: unknown = await response.json().catch(() => ({}));
  return { response, data };
}
