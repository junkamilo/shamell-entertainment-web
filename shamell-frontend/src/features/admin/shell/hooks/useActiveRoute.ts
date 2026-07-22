"use client";

import { useCallback } from "react";
import { usePathname } from "next/navigation";
import {
  isAdminNavGroupActive,
  isAdminNavLinkActive,
} from "../config/nav.config";
import type { AdminNavGroupItem } from "../types/nav.types";

/**
 * Active-route helpers for admin sidebar links/groups.
 * Encapsulates pathname + existing nav.config match rules (agenda nested, on-coming exact, …).
 */
export function useActiveRoute() {
  const pathname = usePathname();

  const isLinkActive = useCallback(
    (href: string) => isAdminNavLinkActive(pathname, href),
    [pathname],
  );

  const isGroupActive = useCallback(
    (group: AdminNavGroupItem) => isAdminNavGroupActive(pathname, group),
    [pathname],
  );

  return { pathname, isLinkActive, isGroupActive };
}
