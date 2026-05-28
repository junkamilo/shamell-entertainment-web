import { AGREGAR_ADMIN_PATH } from "@/app/shamell-admin/agregar-admin/lib/agregarAdminRoutes";
import { EVENT_TYPES_PATH } from "@/app/shamell-admin/event-types/lib/eventTypesRoutes";
import { EVENTS_PATH } from "@/app/shamell-admin/events/lib/eventsRoutes";
import { HEADER_MEDIA_PATH } from "@/app/shamell-admin/header-media/lib/headerMediaRoutes";
import { OCCASION_TYPES_PATH } from "@/app/shamell-admin/occasion-types/lib/occasionTypesRoutes";
import { SERVICE_TYPES_PATH } from "@/app/shamell-admin/service-types/lib/serviceTypesRoutes";
import { SERVICES_PATH } from "@/app/shamell-admin/services/lib/servicesRoutes";
import { GALLERY_CATEGORIES_PATH, GALLERY_PATH } from "@/app/shamell-admin/gallery/lib/galleryRoutes";
import { VENUE_RESERVATIONS_ADMIN_PATH } from "@/app/shamell-admin/venue-reservations/lib/venueReservationsRoutes";
import { VENUE_TABLES_PATH } from "@/app/shamell-admin/venue-tables/lib/venueTablesRoutes";
import {
  ON_COMING_EVENTS_ADMIN_PATH,
  ON_COMING_EVENTS_LAYOUT_ADMIN_PATH,
  SEATING_LAYOUT_ADMIN_LABEL,
} from "@/lib/onComingEventsRoutes";
import {
  Armchair,
  CalendarDays,
  CalendarRange,
  ClipboardList,
  ImageIcon,
  Info,
  LayoutGrid,
  Package,
  PanelsTopLeft,
  Shapes,
  Store,
  Tags,
  Ticket,
  UserPlus,
  type LucideIcon,
} from "lucide-react";

export const UPCOMING_EVENTS_NAV_GROUP_ID = "upcoming-events";
export const UPCOMING_EVENTS_NAV_EXPANDED_KEY = "admin-nav-upcoming-expanded";

export type AdminNavBadge = "reservations";

export type AdminNavLinkItem = {
  type: "link";
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: AdminNavBadge;
};

export type AdminNavGroupItem = {
  type: "group";
  id: typeof UPCOMING_EVENTS_NAV_GROUP_ID;
  label: string;
  icon: LucideIcon;
  children: AdminNavLinkItem[];
};

export type AdminNavEntry = AdminNavLinkItem | AdminNavGroupItem;

export function isAdminNavLinkActive(pathname: string, href: string): boolean {
  if (href === "/shamell-admin/agenda") {
    return pathname === "/shamell-admin/agenda" || pathname.startsWith("/shamell-admin/agenda/");
  }

  if (href === ON_COMING_EVENTS_ADMIN_PATH) {
    return pathname === ON_COMING_EVENTS_ADMIN_PATH;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isAdminNavGroupActive(pathname: string, group: AdminNavGroupItem): boolean {
  return group.children.some((child) => isAdminNavLinkActive(pathname, child.href));
}

export const upcomingEventsNavGroup: AdminNavGroupItem = {
  type: "group",
  id: UPCOMING_EVENTS_NAV_GROUP_ID,
  label: "UpComing Events",
  icon: LayoutGrid,
  children: [
    {
      type: "link",
      href: ON_COMING_EVENTS_LAYOUT_ADMIN_PATH,
      label: SEATING_LAYOUT_ADMIN_LABEL,
      icon: LayoutGrid,
    },
    {
      type: "link",
      href: ON_COMING_EVENTS_ADMIN_PATH,
      label: "On Coming Events (site)",
      icon: Store,
    },
    {
      type: "link",
      href: VENUE_RESERVATIONS_ADMIN_PATH,
      label: "Seat reservations",
      icon: Ticket,
      badge: "reservations",
    },
    {
      type: "link",
      href: VENUE_TABLES_PATH,
      label: "Table seating",
      icon: Armchair,
    },
  ],
};

export const adminNavEntries: AdminNavEntry[] = [
  { type: "link", href: "/shamell-admin/agenda", label: "Agenda", icon: CalendarDays },
  { type: "link", href: HEADER_MEDIA_PATH, label: "Header media", icon: ImageIcon },
  { type: "link", href: SERVICE_TYPES_PATH, label: "Service types (form)", icon: Shapes },
  { type: "link", href: SERVICES_PATH, label: "Services", icon: Package },
  { type: "link", href: OCCASION_TYPES_PATH, label: "Occasion types (form)", icon: ClipboardList },
  { type: "link", href: EVENT_TYPES_PATH, label: "Event types (form)", icon: Tags },
  { type: "link", href: EVENTS_PATH, label: "Events", icon: CalendarRange },
  { type: "link", href: GALLERY_CATEGORIES_PATH, label: "Gallery categories", icon: PanelsTopLeft },
  { type: "link", href: GALLERY_PATH, label: "Gallery", icon: ImageIcon },
  upcomingEventsNavGroup,
  { type: "link", href: "/shamell-admin/about", label: "About Shamell", icon: Info },
  { type: "link", href: AGREGAR_ADMIN_PATH, label: "Add admin", icon: UserPlus },
];

/** Route segment → breadcrumb label */
export const adminBreadcrumbLabel: Record<string, string> = {
  "shamell-admin": "Admin",
  agenda: "Agenda",
  "header-media": "Header media",
  agendar: "Book",
  disponibilidad: "Availability",
  peticiones: "Requests",
  "mi-agenda": "My agenda",
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
