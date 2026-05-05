import { ADMIN_THEME_STORAGE_KEY } from "@/features/theme/constants/themeColors";
import type { Theme } from "@/features/theme/types/Theme";

function isTheme(value: string | null): value is Theme {
  return value === "light" || value === "dark";
}

export function readStoredAdminTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(ADMIN_THEME_STORAGE_KEY);
  return isTheme(value) ? value : null;
}

export function writeStoredAdminTheme(theme: Theme): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ADMIN_THEME_STORAGE_KEY, theme);
}

export function resolvePreferredTheme(fallback: Theme = "dark"): Theme {
  if (typeof window === "undefined") return fallback;
  const stored = readStoredAdminTheme();
  if (stored) return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
