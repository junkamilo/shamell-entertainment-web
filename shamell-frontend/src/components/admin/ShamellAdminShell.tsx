"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarRange,
  ClipboardList,
  ExternalLink,
  ImageIcon,
  Inbox,
  Info,
  Menu,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Shapes,
  Store,
  Tags,
  PanelsTopLeft,
  UserPlus,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import FlameIcon from "@/components/FlameIcon";
import ThemeToggle from "@/features/theme/components/ThemeToggle";
import { useTheme } from "@/features/theme/hooks/useTheme";
import {
  ADMIN_ACCESS_TOKEN_KEY,
  ADMIN_USER_KEY,
  notifyAdminSessionChanged,
} from "@/lib/adminSession";

type AdminNavItem = {
  href: string;
  label: string;
  icon: typeof Inbox;
};

const navItems: AdminNavItem[] = [
  { href: "/shamell-admin", label: "Bandeja de entrada", icon: Inbox },
  { href: "/shamell-admin/service-types", label: "Tipos de servicio", icon: Shapes },
  { href: "/shamell-admin/services", label: "Servicios", icon: Package },
  { href: "/shamell-admin/occasion-types", label: "Tipos de ocasión", icon: ClipboardList },
  { href: "/shamell-admin/event-types", label: "Tipos de eventos", icon: Tags },
  { href: "/shamell-admin/events", label: "Eventos", icon: CalendarRange },
  { href: "/shamell-admin/gallery-categories", label: "Categorias galeria", icon: PanelsTopLeft },
  { href: "/shamell-admin/gallery", label: "Galería", icon: ImageIcon },
  { href: "/shamell-admin/about", label: "About Shamell", icon: Info },
  { href: "/shamell-admin/agregar-admin", label: "Agregar admin", icon: UserPlus },
];

const breadcrumbLabel: Record<string, string> = {
  "shamell-admin": "Admin",
  "service-types": "Tipos de servicio",
  services: "Servicios",
  "event-types": "Tipos de eventos",
  "occasion-types": "Tipos de ocasión",
  events: "Eventos",
  "gallery-categories": "Categorias galeria",
  gallery: "Galería",
  about: "About Shamell",
  "agregar-admin": "Agregar admin",
  "invite-admin": "Agregar admin",
};

function breadcrumbFromPath(pathname: string): string[] {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== "shamell-admin") return ["Admin"];
  const crumbs = ["Admin"];
  if (parts.length === 1) {
    crumbs.push("Bandeja de entrada");
    return crumbs;
  }
  const seg = parts[1] ?? "";
  crumbs.push(breadcrumbLabel[seg] ?? seg);
  return crumbs;
}

export default function ShamellAdminShell({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [adminName, setAdminName] = useState<string>("Administrador");
  const [adminEmail, setAdminEmail] = useState<string>("");

  useEffect(() => {
    const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
    if (!token) {
      router.replace("/admin/login");
      return;
    }
    const raw = localStorage.getItem(ADMIN_USER_KEY);
    if (raw) {
      try {
        const u = JSON.parse(raw) as { fullName?: string; email?: string };
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAdminName(u.fullName ?? "Administrador");
        setAdminEmail(u.email ?? "");
      } catch {
        /* ignore */
      }
    }
  }, [router]);

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
        className={`border-b border-gold/20 px-3 py-4 lg:px-4 ${
          sidebarCollapsed ? "flex flex-col items-center gap-3 py-5" : "flex items-center justify-between gap-3"
        }`}
      >
        <div
          className={`flex min-w-0 items-center gap-3 ${sidebarCollapsed ? "flex-col gap-2" : "flex-1"}`}
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold/10">
            <FlameIcon className="h-8 w-6 text-gold" />
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
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gold/30 text-gold transition hover:bg-gold/10 lg:hidden"
            aria-label="Cerrar menu lateral"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            className="hidden h-9 w-9 items-center justify-center rounded-lg border border-gold/30 text-gold transition hover:bg-gold/10 lg:inline-flex"
            aria-label={sidebarCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
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

      <nav className="shamell-scrollbar flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const active =
            item.href === "/shamell-admin"
              ? pathname === "/shamell-admin"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center rounded-md px-3 py-2.5 font-brand text-[11px] tracking-[0.12em] transition-colors ${
                active
                  ? "border border-gold/35 bg-gold/15 text-gold"
                  : "border border-transparent text-foreground/70 hover:border-gold/20 hover:bg-gold/5 hover:text-gold"
              } ${sidebarCollapsed ? "justify-center" : "gap-3"} `}
            >
              <Icon className={`h-4 w-4 shrink-0 opacity-90 ${sidebarCollapsed ? "mx-auto" : ""}`} strokeWidth={1.5} />
              {!sidebarCollapsed ? item.label.toUpperCase() : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gold/20 p-4">
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
              <p className="text-[10px] text-gold/70">Administrador</p>
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
          title="Ir al sitio"
        >
          <Store className="h-3.5 w-3.5" strokeWidth={1.5} />
          {!sidebarCollapsed ? "IR AL SITIO" : null}
        </Link>
        <button
          type="button"
          onClick={onLogout}
          title="Cerrar sesion"
          className="w-full rounded-md border border-gold/20 py-2 font-brand text-[10px] tracking-[0.14em] text-foreground/70 hover:border-gold/40 hover:text-gold"
        >
          {sidebarCollapsed ? "X" : "CERRAR SESIÓN"}
        </button>
      </div>
    </>
  );

  return (
    <div
      className={`admin-theme admin-theme-transition ${
        theme === "light" ? "admin-theme--light" : "admin-theme--dark"
      } flex h-screen overflow-hidden bg-background text-foreground`}
    >
      {sidebarOpen ? (
        <button
          type="button"
          className="admin-overlay fixed inset-0 z-40 lg:hidden"
          aria-label="Cerrar menú"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-gold/25 bg-background transition-all duration-200 lg:sticky lg:top-0 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${sidebarCollapsed ? "w-20" : "w-64"}`}
      >
        {navInner}
      </aside>

      <div className="flex h-screen flex-1 flex-col overflow-hidden lg:min-w-0">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-gold/20 bg-background/95 px-4 backdrop-blur-sm">
          <button
            type="button"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gold/30 text-gold transition hover:bg-gold/10 lg:hidden"
            aria-label="Abrir menu lateral"
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
            <ThemeToggle />
            <Link
              href="/"
              className="flex items-center gap-1.5 font-brand text-[10px] tracking-[0.12em] text-gold hover:text-gold-light"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              VER SITIO
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5 md:p-8">{children}</main>
      </div>
    </div>
  );
}
