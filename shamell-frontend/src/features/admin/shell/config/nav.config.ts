import {
  ABOUT_ADMIN_PATH,
  AGREGAR_ADMIN_PATH,
  AGENDA_HUB_PATH,
  EVENT_TYPES_PATH,
  EVENTS_PATH,
  GALLERY_CATEGORIES_PATH,
  GALLERY_PATH,
  HEADER_MEDIA_PATH,
  OCCASION_TYPES_PATH,
  ON_COMING_EVENTS_ADMIN_PATH,
  ON_COMING_EVENTS_LAYOUT_ADMIN_PATH,
  SERVICE_TYPES_PATH,
  SERVICES_PATH,
  VENUE_RESERVATIONS_ADMIN_PATH,
  VENUE_TABLES_PATH,
} from "@/lib/admin/routes";
import { SEATING_LAYOUT_ADMIN_LABEL } from "@/lib/onComingEventsRoutes";
import {
  NavAboutIcon,
  NavAddAdminIcon,
  NavAgendaIcon,
  NavEventTypesIcon,
  NavEventsIcon,
  NavGalleryCategoriesIcon,
  NavGalleryIcon,
  NavHeaderMediaIcon,
  NavOccasionTypesIcon,
  NavOnComingEventsSiteIcon,
  NavSeatReservationsIcon,
  NavSeatingLayoutIcon,
  NavServiceTypesIcon,
  NavServicesIcon,
  NavTableSeatingIcon,
  NavUpcomingEventsIcon,
} from "@/components/admin/icons";
import type { AdminPermission } from "@/lib/admin/permissions";
import { hasAllAdminPermissions } from "@/lib/admin/permissions";
import type {
  AdminNavEntry,
  AdminNavGroupItem,
  AdminNavLinkItem,
} from "../types/nav.types";
import { UPCOMING_EVENTS_NAV_GROUP_ID } from "../types/nav.types";

export type { AdminNavEntry, AdminNavGroupItem, AdminNavLinkItem };
export { UPCOMING_EVENTS_NAV_GROUP_ID };

export const UPCOMING_EVENTS_NAV_EXPANDED_KEY = "admin-nav-upcoming-expanded";

const ACCESS: AdminPermission[] = ["admin.access"];
const INVITE: AdminPermission[] = ["admin.invite"];

export function isAdminNavLinkActive(pathname: string, href: string): boolean {
  if (href === AGENDA_HUB_PATH) {
    return pathname === AGENDA_HUB_PATH || pathname.startsWith(`${AGENDA_HUB_PATH}/`);
  }

  if (href === ON_COMING_EVENTS_ADMIN_PATH) {
    return pathname === ON_COMING_EVENTS_ADMIN_PATH;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isAdminNavGroupActive(pathname: string, group: AdminNavGroupItem): boolean {
  return group.children.some((child) => isAdminNavLinkActive(pathname, child.href));
}

export function filterAdminNavEntries(
  entries: readonly AdminNavEntry[],
  permissions: readonly string[],
): AdminNavEntry[] {
  return entries
    .map((entry) => {
      if (entry.type === "group") {
        if (!hasAllAdminPermissions(permissions, entry.requiredPermissions)) {
          return null;
        }
        const children = entry.children.filter((child) =>
          hasAllAdminPermissions(permissions, child.requiredPermissions),
        );
        if (children.length === 0) return null;
        return { ...entry, children };
      }
      if (!hasAllAdminPermissions(permissions, entry.requiredPermissions)) {
        return null;
      }
      return entry;
    })
    .filter((e): e is AdminNavEntry => e !== null);
}

export const upcomingEventsNavGroup: AdminNavGroupItem = {
  type: "group",
  id: UPCOMING_EVENTS_NAV_GROUP_ID,
  label: "UpComing Events",
  icon: NavUpcomingEventsIcon,
  requiredPermissions: ACCESS,
  children: [
    {
      type: "link",
      href: ON_COMING_EVENTS_LAYOUT_ADMIN_PATH,
      label: SEATING_LAYOUT_ADMIN_LABEL,
      icon: NavSeatingLayoutIcon,
      requiredPermissions: ACCESS,
    },
    {
      type: "link",
      href: ON_COMING_EVENTS_ADMIN_PATH,
      label: "On Coming Events (site)",
      icon: NavOnComingEventsSiteIcon,
      requiredPermissions: ACCESS,
    },
    {
      type: "link",
      href: VENUE_RESERVATIONS_ADMIN_PATH,
      label: "Seat reservations",
      icon: NavSeatReservationsIcon,
      badge: "reservations",
      requiredPermissions: ACCESS,
    },
    {
      type: "link",
      href: VENUE_TABLES_PATH,
      label: "Table seating",
      icon: NavTableSeatingIcon,
      requiredPermissions: ACCESS,
    },
  ],
};

export const adminNavEntries: AdminNavEntry[] = [
  { type: "link", href: AGENDA_HUB_PATH, label: "Agenda", icon: NavAgendaIcon, requiredPermissions: ACCESS },
  { type: "link", href: HEADER_MEDIA_PATH, label: "Header media", icon: NavHeaderMediaIcon, requiredPermissions: ACCESS },
  { type: "link", href: SERVICE_TYPES_PATH, label: "Service types (form)", icon: NavServiceTypesIcon, requiredPermissions: ACCESS },
  { type: "link", href: SERVICES_PATH, label: "Services", icon: NavServicesIcon, requiredPermissions: ACCESS },
  { type: "link", href: OCCASION_TYPES_PATH, label: "Occasion types (form)", icon: NavOccasionTypesIcon, requiredPermissions: ACCESS },
  { type: "link", href: EVENT_TYPES_PATH, label: "Event types (form)", icon: NavEventTypesIcon, requiredPermissions: ACCESS },
  { type: "link", href: EVENTS_PATH, label: "Events", icon: NavEventsIcon, requiredPermissions: ACCESS },
  { type: "link", href: GALLERY_CATEGORIES_PATH, label: "Gallery categories", icon: NavGalleryCategoriesIcon, requiredPermissions: ACCESS },
  { type: "link", href: GALLERY_PATH, label: "Gallery", icon: NavGalleryIcon, requiredPermissions: ACCESS },
  upcomingEventsNavGroup,
  { type: "link", href: ABOUT_ADMIN_PATH, label: "About Shamell", icon: NavAboutIcon, requiredPermissions: ACCESS },
  { type: "link", href: AGREGAR_ADMIN_PATH, label: "Add admin", icon: NavAddAdminIcon, requiredPermissions: INVITE },
];

/** Route segment → breadcrumb label */
export const adminBreadcrumbLabel: Record<string, string> = {
  admin: "Admin",
  "shamell-admin": "Admin",
  agenda: "Agenda",
  "header-media": "Header media",
  agendar: "Book",
  "box-office": "Box office",
  disponibilidad: "Availability",
  peticiones: "Requests",
  "mi-agenda": "My agenda",
  "payment-history": "Payment history",
  "service-types": "Service types (form)",
  services: "Services",
  "event-types": "Event types (form)",
  "occasion-types": "Occasion types (form)",
  events: "Events",
  "upcoming-events": "Upcoming Events",
  "gallery-categories": "Gallery categories",
  gallery: "Gallery",
  "on-coming-events": "On Coming Events (site)",
  layout: SEATING_LAYOUT_ADMIN_LABEL,
  "venue-reservations": "Seat reservations",
  "venue-tables": "Table seating",
  about: "About Shamell",
  "agregar-admin": "Add admin",
  "invite-admin": "Add admin",
};

const upcomingEventsRouteSegments = new Set([
  "on-coming-events",
  "venue-reservations",
  "venue-tables",
]);

export function isUpcomingEventsBreadcrumbRoute(segment: string): boolean {
  return upcomingEventsRouteSegments.has(segment);
}
