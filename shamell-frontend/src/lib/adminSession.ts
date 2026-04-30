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
  return Boolean(token && role === "ADMIN");
}
