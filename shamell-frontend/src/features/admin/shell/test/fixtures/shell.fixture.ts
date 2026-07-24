import { NavAgendaIcon, NavUpcomingEventsIcon } from "@/components/admin/icons";
import {
  AGENDA_HUB_PATH,
  ON_COMING_EVENTS_ADMIN_PATH,
  VENUE_RESERVATIONS_ADMIN_PATH,
} from "@/lib/admin/routes";
import type { AdminNavGroupItem, AdminNavLinkItem } from "../../types/nav.types";
import { UPCOMING_EVENTS_NAV_GROUP_ID } from "../../types/nav.types";
import { FIXTURE_ADMIN_USER_ID } from "./uuids.fixture";

export function makeAdminNavLink(
  overrides: Partial<AdminNavLinkItem> = {},
): AdminNavLinkItem {
  return {
    type: "link",
    href: AGENDA_HUB_PATH,
    label: "Agenda",
    icon: NavAgendaIcon,
    requiredPermissions: ["admin.access"],
    ...overrides,
  };
}

export function makeUpcomingEventsNavGroup(
  overrides: Partial<AdminNavGroupItem> = {},
): AdminNavGroupItem {
  return {
    type: "group",
    id: UPCOMING_EVENTS_NAV_GROUP_ID,
    label: "UpComing Events",
    icon: NavUpcomingEventsIcon,
    requiredPermissions: ["admin.access"],
    children: [
      makeAdminNavLink({
        href: ON_COMING_EVENTS_ADMIN_PATH,
        label: "On Coming Events (site)",
      }),
      makeAdminNavLink({
        href: VENUE_RESERVATIONS_ADMIN_PATH,
        label: "Seat reservations",
        badge: "reservations",
      }),
    ],
    ...overrides,
  };
}

export function makeAdminSessionUser(
  overrides: Record<string, unknown> = {},
) {
  return {
    id: FIXTURE_ADMIN_USER_ID,
    fullName: "Ada Lovelace",
    email: "ada@example.com",
    role: "SUPER_ADMIN",
    ...overrides,
  };
}
