import { getAdminApiBaseUrl } from "../../shared/lib/adminApiBaseUrl";

export type PostAdminLoginResult = {
  response: Response;
  data: unknown;
};

export async function postAdminLogin(
  email: string,
  password: string,
): Promise<PostAdminLoginResult> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(`${base}/api/v1/auth/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });

  const data: unknown = await response.json().catch(() => ({}));
  return { response, data };
}
