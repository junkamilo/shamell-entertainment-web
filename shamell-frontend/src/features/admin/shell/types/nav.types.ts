import type { AdminIcon } from "@/components/admin/icons";
import type { AdminPermission } from "@/lib/admin/permissions";

export const UPCOMING_EVENTS_NAV_GROUP_ID = "upcoming-events" as const;

export type AdminNavLinkItem = {
  type: "link";
  href: string;
  label: string;
  icon: AdminIcon;
  badge?: "reservations";
  requiredPermissions?: AdminPermission[];
};

export type AdminNavGroupItem = {
  type: "group";
  id: typeof UPCOMING_EVENTS_NAV_GROUP_ID;
  label: string;
  icon: AdminIcon;
  children: AdminNavLinkItem[];
  requiredPermissions?: AdminPermission[];
};

export type AdminNavEntry = AdminNavLinkItem | AdminNavGroupItem;
