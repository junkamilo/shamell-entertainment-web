import { ADMIN_ACCESS_TOKEN_KEY } from "@/lib/adminSession";

export function getAdminBearerToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
}

export function getAdminAuthHeaders(includeJson = true): HeadersInit {
  const token = getAdminBearerToken();
  const headers: Record<string, string> = {};
  if (includeJson) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}
