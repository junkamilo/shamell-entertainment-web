"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  deriveAdminPermissions,
  isAdminStaffRole,
  type AdminPermission,
} from "@/lib/admin/permissions";
import {
  ADMIN_ACCESS_TOKEN_KEY,
  ADMIN_SESSION_CHANGED_EVENT,
  ADMIN_USER_KEY,
  notifyAdminSessionChanged,
} from "@/lib/adminSession";

export type AdminSessionUser = {
  id?: string;
  fullName?: string;
  name?: string;
  email?: string;
  role?: string;
  permissions?: AdminPermission[];
};

export type AdminSessionSnapshot = {
  isLoggedIn: boolean;
  role: string | null;
  user: AdminSessionUser | null;
  token: string | null;
  permissions: readonly AdminPermission[];
};

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(ADMIN_SESSION_CHANGED_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(ADMIN_SESSION_CHANGED_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function permissionsFromUser(user: AdminSessionUser | null): AdminPermission[] {
  if (user?.permissions && Array.isArray(user.permissions) && user.permissions.length > 0) {
    return user.permissions as AdminPermission[];
  }
  return deriveAdminPermissions(user?.role ?? null);
}

const serverSnapshot: AdminSessionSnapshot = {
  isLoggedIn: false,
  role: null,
  user: null,
  token: null,
  permissions: [],
};

/** Cached so getSnapshot returns a stable reference when storage is unchanged. */
let cachedToken: string | null = null;
let cachedUserRaw: string | null = null;
let cachedSnapshot: AdminSessionSnapshot = serverSnapshot;

function getSnapshot(): AdminSessionSnapshot {
  const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
  const userRaw = localStorage.getItem(ADMIN_USER_KEY);

  if (token === cachedToken && userRaw === cachedUserRaw) {
    return cachedSnapshot;
  }

  cachedToken = token;
  cachedUserRaw = userRaw;

  let user: AdminSessionUser | null = null;
  if (userRaw) {
    try {
      user = JSON.parse(userRaw) as AdminSessionUser;
    } catch {
      user = null;
    }
  }

  const role = user?.role ?? null;
  cachedSnapshot = {
    isLoggedIn: Boolean(token && isAdminStaffRole(role)),
    role,
    user,
    token,
    permissions: permissionsFromUser(user),
  };
  return cachedSnapshot;
}

function getServerSnapshot(): AdminSessionSnapshot {
  return serverSnapshot;
}

/**
 * Thin client session hook over localStorage admin auth.
 * `permissions` come from login payload or are derived from coarse role.
 */
export function useAdminSession() {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const refresh = useCallback(() => {
    notifyAdminSessionChanged();
  }, []);

  const clear = useCallback(() => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(ADMIN_ACCESS_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
    notifyAdminSessionChanged();
  }, []);

  return {
    isLoggedIn: snap.isLoggedIn,
    role: snap.role,
    user: snap.user,
    token: snap.token,
    permissions: snap.permissions,
    refresh,
    clear,
  };
}
