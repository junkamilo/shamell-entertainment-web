"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ADMIN_LOGIN_PATH } from "@/app/admin/shared/lib/adminRoutes";
import { AGREGAR_ADMIN_PATH } from "@/app/shamell-admin/agregar-admin/lib/agregarAdminRoutes";
import { EVENT_TYPES_PATH } from "@/app/shamell-admin/event-types/lib/eventTypesRoutes";
import { EVENTS_PATH } from "@/app/shamell-admin/events/lib/eventsRoutes";
import { HEADER_MEDIA_PATH } from "@/app/shamell-admin/header-media/lib/headerMediaRoutes";
import { OCCASION_TYPES_PATH } from "@/app/shamell-admin/occasion-types/lib/occasionTypesRoutes";
import { SERVICE_TYPES_PATH } from "@/app/shamell-admin/service-types/lib/serviceTypesRoutes";
import { SERVICES_PATH } from "@/app/shamell-admin/services/lib/servicesRoutes";
import { GALLERY_CATEGORIES_PATH, GALLERY_PATH } from "@/app/shamell-admin/gallery/lib/galleryRoutes";
import {
  ON_COMING_EVENTS_ADMIN_PATH,
  ON_COMING_EVENTS_LAYOUT_ADMIN_PATH,
} from "@/lib/onComingEventsRoutes";
import { VENUE_RESERVATIONS_ADMIN_PATH } from "@/app/shamell-admin/venue-reservations/lib/venueReservationsRoutes";
import { VENUE_TABLES_PATH } from "@/app/shamell-admin/venue-tables/lib/venueTablesRoutes";
import {
  Armchair,
  CalendarDays,
  CalendarRange,
  ClipboardList,
  ExternalLink,
  ImageIcon,
  Info,
  Menu,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Shapes,
  Store,
  Tags,
  Ticket,
  LayoutGrid,
  PanelsTopLeft,
  UserPlus,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import bailarinaLogo from "@/public/01_bailarina.png";
import { getAdminBearerToken } from "@/app/admin/shared/lib/adminAuth";
import { fetchAdminVenueReservations } from "@/app/shamell-admin/venue-reservations/services/fetchAdminVenueReservations";
import AdminNavNotification from "@/components/admin/AdminNavNotification";
import {
  ADMIN_ACCESS_TOKEN_KEY,
  ADMIN_USER_KEY,
  notifyAdminSessionChanged,
} from "@/lib/adminSession";
import {
  ON_COMING_EVENTS_BADGE_REFRESH_EVENT,
  readLastSeenPaidReservationAtMs,
} from "@/lib/onComingEventsReservationsNotice";

type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const navItems: AdminNavItem[] = [
  { href: "/shamell-admin/agenda", label: "Agenda", icon: CalendarDays },
  { href: HEADER_MEDIA_PATH, label: "Header media", icon: ImageIcon },
  { href: SERVICE_TYPES_PATH, label: "Service types (form)", icon: Shapes },
  { href: SERVICES_PATH, label: "Services", icon: Package },
  { href: OCCASION_TYPES_PATH, label: "Occasion types (form)", icon: ClipboardList },
  { href: EVENT_TYPES_PATH, label: "Event types (form)", icon: Tags },
  { href: EVENTS_PATH, label: "Events", icon: CalendarRange },
  { href: GALLERY_CATEGORIES_PATH, label: "Gallery categories", icon: PanelsTopLeft },
  { href: GALLERY_PATH, label: "Gallery", icon: ImageIcon },
  { href: ON_COMING_EVENTS_LAYOUT_ADMIN_PATH, label: "On Coming Events", icon: LayoutGrid },
  { href: ON_COMING_EVENTS_ADMIN_PATH, label: "On Coming Events (site)", icon: Store },
  { href: VENUE_RESERVATIONS_ADMIN_PATH, label: "Seat reservations", icon: Ticket },
  { href: VENUE_TABLES_PATH, label: "Table seating", icon: Armchair },
  { href: "/shamell-admin/about", label: "About Shamell", icon: Info },
  { href: AGREGAR_ADMIN_PATH, label: "Add admin", icon: UserPlus },
];

const breadcrumbLabel: Record<string, string> = {
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
  "gallery-categories": "Gallery categories",
  gallery: "Gallery",
  "on-coming-events": "On Coming Events (site)",
  layout: "On Coming Events",
  "venue-reservations": "Seat reservations",
  "venue-tables": "Table seating",
  about: "About Shamell",
  "agregar-admin": "Add admin",
  "invite-admin": "Add admin",
};

function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/shamell-admin/agenda") {
    return pathname === "/shamell-admin/agenda" || pathname.startsWith("/shamell-admin/agenda/");
  }

  if (href === ON_COMING_EVENTS_ADMIN_PATH) {
    return pathname === ON_COMING_EVENTS_ADMIN_PATH;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function breadcrumbFromPath(pathname: string): string[] {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== "shamell-admin") return ["Admin"];
  const crumbs = ["Admin"];
  if (parts.length === 1) {
    crumbs.push("Agenda");
    return crumbs;
  }
  const seg = parts[1] ?? "";
  crumbs.push(breadcrumbLabel[seg] ?? seg);
  if (parts.length >= 3) {
    const sub = parts[2] ?? "";
    crumbs.push(breadcrumbLabel[sub] ?? sub);
  }
  return crumbs;
}

export default function ShamellAdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [adminName, setAdminName] = useState<string>("Administrator");
  const [adminEmail, setAdminEmail] = useState<string>("");
  const [onComingEventsBadgeCount, setOnComingEventsBadgeCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
    if (!token) {
      router.replace(ADMIN_LOGIN_PATH);
      return;
    }
    const raw = localStorage.getItem(ADMIN_USER_KEY);
    if (raw) {
      try {
        const u = JSON.parse(raw) as { fullName?: string; email?: string };
        setAdminName(u.fullName ?? "Administrator");
        setAdminEmail(u.email ?? "");
      } catch {
        /* ignore */
      }
    }
  }, [router]);

  useEffect(() => {
    const loadBadge = async () => {
      const token = getAdminBearerToken();
      if (!token) {
        setOnComingEventsBadgeCount(0);
        return;
      }
      const result = await fetchAdminVenueReservations(token, {
        status: "PAID",
        page: 1,
        perPage: 50,
      });
      if (!result.ok) {
        setOnComingEventsBadgeCount(0);
        return;
      }
      const lastSeenAt = readLastSeenPaidReservationAtMs();
      const count = result.reservations.filter((r) => {
        const createdAtMs = Date.parse(r.createdAt);
        return Number.isFinite(createdAtMs) && createdAtMs > lastSeenAt;
      }).length;
      setOnComingEventsBadgeCount(count);
    };

    void loadBadge();
    const onFocus = () => void loadBadge();
    const onRefresh = () => void loadBadge();
    window.addEventListener("focus", onFocus);
    window.addEventListener(ON_COMING_EVENTS_BADGE_REFRESH_EVENT, onRefresh);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener(ON_COMING_EVENTS_BADGE_REFRESH_EVENT, onRefresh);
    };
  }, []);

  const crumbs = useMemo(() => breadcrumbFromPath(pathname), [pathname]);

  const onLogout = () => {
    localStorage.removeItem(ADMIN_ACCESS_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
    notifyAdminSessionChanged();
    router.replace("/");
  };

  const navInner = (
    <>
      <div
        className={`border-b border-gold/20 px-3 py-4 max-lg:pt-[max(1rem,env(safe-area-inset-top,0px))] lg:px-4 ${
          sidebarCollapsed ? "flex flex-col items-center gap-3 py-5" : "flex items-center justify-between gap-3"
        }`}
      >
        <div
          className={`flex min-w-0 items-center gap-3 ${sidebarCollapsed ? "flex-col gap-2" : "flex-1"}`}
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gold/40 bg-gold/10">
            <Image
              src={bailarinaLogo}
              alt=""
              width={180}
              height={164}
              className="h-8 w-auto max-w-[2.35rem] object-contain object-center"
              aria-hidden
            />
          </div>
          {!sidebarCollapsed ? (
            <div className="min-w-0">
              <p className="font-brand text-[10px] tracking-[0.2em] text-gold/90">SHAMELL</p>
              <p className="font-brand text-xs tracking-[0.12em] text-foreground/90">ADMIN PANEL</p>
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg border border-gold/30 text-gold transition hover:bg-gold/10 max-lg:min-h-12 max-lg:min-w-12 lg:hidden"
            aria-label="Close sidebar"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            className="hidden h-9 w-9 items-center justify-center rounded-lg border border-gold/30 text-gold transition hover:bg-gold/10 lg:inline-flex"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setSidebarCollapsed((prev) => !prev)}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" strokeWidth={1.5} />
            ) : (
              <PanelLeftClose className="h-4 w-4" strokeWidth={1.5} />
            )}
          </button>
        </div>
      </div>

      <nav className="shamell-scrollbar flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden px-3 py-4">
        {navItems.map((item) => {
          const active = isNavItemActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              onClick={() => setSidebarOpen(false)}
              className={`relative flex items-center rounded-md px-3 py-2.5 font-brand text-[11px] tracking-[0.12em] transition-colors ${
                active
                  ? "border border-gold/35 bg-gold/15 text-gold"
                  : "border border-transparent text-foreground/70 hover:border-gold/20 hover:bg-gold/5 hover:text-gold"
              } ${sidebarCollapsed ? "justify-center" : "gap-3"} `}
            >
              <Icon className={`h-4 w-4 shrink-0 opacity-90 ${sidebarCollapsed ? "mx-auto" : ""}`} strokeWidth={1.5} />
              {!sidebarCollapsed ? (
                <span className="flex min-w-0 items-center gap-2">
                  <span>{item.label.toUpperCase()}</span>
                  {item.href === ON_COMING_EVENTS_LAYOUT_ADMIN_PATH ? (
                    <AdminNavNotification count={onComingEventsBadgeCount} />
                  ) : null}
                </span>
              ) : item.href === ON_COMING_EVENTS_LAYOUT_ADMIN_PATH ? (
                <AdminNavNotification count={onComingEventsBadgeCount} collapsed />
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-gold/20 p-4 max-lg:pb-[max(1rem,env(safe-area-inset-bottom,0px))]">
        {!sidebarCollapsed ? (
          <div className="admin-panel mb-3 flex items-center gap-3 rounded-md px-3 py-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/20 font-brand text-xs text-gold">
              {adminName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-body text-xs text-foreground/90">{adminName}</p>
              {adminEmail ? (
                <p className="truncate text-[10px] text-foreground/50">{adminEmail}</p>
              ) : null}
              <p className="text-[10px] text-gold/70">Administrator</p>
            </div>
          </div>
        ) : (
          <div className="mb-3 flex justify-center">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/20 font-brand text-xs text-gold">
              {adminName.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
        <Link
          href="/"
          className={`mb-2 flex w-full items-center justify-center rounded-md border border-gold/30 py-2 font-brand text-[10px] tracking-[0.14em] text-gold transition-colors hover:bg-gold/10 ${
            sidebarCollapsed ? "" : "gap-2"
          }`}
          title="Go to public site"
        >
          <Store className="h-3.5 w-3.5" strokeWidth={1.5} />
          {!sidebarCollapsed ? "VIEW SITE" : null}
        </Link>
        <button
          type="button"
          onClick={onLogout}
          title="Sign out"
          className="w-full rounded-md border border-gold/20 py-2 font-brand text-[10px] tracking-[0.14em] text-foreground/70 hover:border-gold/40 hover:text-gold"
        >
          {sidebarCollapsed ? "X" : "SIGN OUT"}
        </button>
      </div>
    </>
  );

  return (
    <div className="admin-theme flex h-dvh min-h-0 overflow-hidden bg-transparent text-foreground">
      {sidebarOpen ? (
        <button
          type="button"
          className="admin-overlay fixed inset-0 z-40 lg:hidden"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <aside
        className={`shamell-admin-sidebar fixed left-0 top-0 z-50 flex max-h-dvh flex-col border-r border-shamell-line-soft transition-all duration-200 max-lg:h-dvh lg:sticky lg:top-0 lg:h-screen lg:max-h-none lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${sidebarCollapsed ? "w-20" : "w-[min(100%,18rem)] max-sm:w-[min(100%,17rem)] sm:w-64"}`}
      >
        {navInner}
      </aside>

      <div className="shamell-admin-bg flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="admin-theme-main-header sticky top-0 z-30 flex shrink-0 items-center gap-3 px-4 max-lg:min-h-[calc(3.5rem+env(safe-area-inset-top,0))] max-lg:pt-[env(safe-area-inset-top,0px)] lg:h-14">
          <button
            type="button"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gold/30 text-gold transition hover:bg-gold/10 lg:hidden"
            aria-label="Open sidebar"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <div className="flex flex-1 items-center gap-2 text-[11px] font-brand tracking-widest text-foreground/60">
            {crumbs.map((c, i) => (
              <span key={`${c}-${i}`} className="flex items-center gap-2">
                {i > 0 ? <span className="text-gold/40">/</span> : null}
                <span className={i === crumbs.length - 1 ? "text-gold" : ""}>{c.toUpperCase()}</span>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="flex items-center gap-1.5 font-brand text-[10px] tracking-[0.12em] text-gold hover:text-gold-light"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              VIEW SITE
            </Link>
          </div>
        </header>

        <main className="admin-main min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-5 md:p-8 max-lg:pb-[max(1.25rem,env(safe-area-inset-bottom,0px))]">
          {children}
        </main>
      </div>
    </div>
  );
}
