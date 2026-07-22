import { isAdminStaffRole } from "@/lib/admin/permissions";
import {
  deriveAdminPermissions,
  type AdminPermission,
} from "@/lib/admin/permissions";

export const ADMIN_ACCESS_TOKEN_KEY = "admin_access_token";
export const ADMIN_USER_KEY = "admin_user";

export const ADMIN_SESSION_CHANGED_EVENT = "shamell-admin-session-changed";

export function notifyAdminSessionChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(ADMIN_SESSION_CHANGED_EVENT));
}

export function readAdminSessionRole(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ADMIN_USER_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw) as { role?: string };
    return user.role ?? null;
  } catch {
    return null;
  }
}

export function isAdminLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
  const role = readAdminSessionRole();
  return Boolean(token && isAdminStaffRole(role));
}

/** Normalize login user payload and ensure permissions[] is present. */
export function persistAdminSessionUser(user: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const role = typeof user.role === "string" ? user.role : undefined;
  const fromApi = Array.isArray(user.permissions)
    ? (user.permissions.filter((p): p is string => typeof p === "string") as AdminPermission[])
    : [];
  const permissions = fromApi.length > 0 ? fromApi : deriveAdminPermissions(role);
  localStorage.setItem(
    ADMIN_USER_KEY,
    JSON.stringify({
      ...user,
      permissions,
    }),
  );
}
