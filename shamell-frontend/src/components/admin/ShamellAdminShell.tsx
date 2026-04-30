"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarRange,
  ExternalLink,
  Home,
  ImageIcon,
  LayoutDashboard,
  Mail,
  Menu,
  Package,
  Shapes,
  Sparkles,
  Store,
  Tags,
  PanelsTopLeft,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import FlameIcon from "@/components/FlameIcon";
import {
  ADMIN_ACCESS_TOKEN_KEY,
  ADMIN_USER_KEY,
  notifyAdminSessionChanged,
} from "@/lib/adminSession";

type AdminNavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
};

const navItems: AdminNavItem[] = [
  { href: "/shamell-admin", label: "Panel", icon: LayoutDashboard },
  { href: "/shamell-admin/inquiries", label: "Consultas", icon: Mail },
  { href: "/shamell-admin/service-types", label: "Tipos de servicio", icon: Shapes },
  { href: "/shamell-admin/services", label: "Servicios", icon: Package },
  { href: "/shamell-admin/event-types", label: "Tipos de evento", icon: Tags },
  { href: "/shamell-admin/events", label: "Eventos", icon: CalendarRange },
  { href: "/shamell-admin/experiences", label: "Experiencias", icon: Sparkles },
  { href: "/shamell-admin/gallery-categories", label: "Categorias galeria", icon: PanelsTopLeft },
  { href: "/shamell-admin/gallery", label: "Galería", icon: ImageIcon },
  { href: "/shamell-admin/home-content", label: "Inicio / Hero", icon: Home },
];

const breadcrumbLabel: Record<string, string> = {
  "shamell-admin": "Admin",
  inquiries: "Consultas",
  "service-types": "Tipos de servicio",
  services: "Servicios",
  "event-types": "Tipos de evento",
  events: "Eventos",
  experiences: "Experiencias",
  "gallery-categories": "Categorias galeria",
  gallery: "Galería",
  "home-content": "Inicio",
};

function breadcrumbFromPath(pathname: string): string[] {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== "shamell-admin") return ["Admin"];
  const crumbs = ["Admin"];
  if (parts.length === 1) {
    crumbs.push("Panel");
    return crumbs;
  }
  const seg = parts[1] ?? "";
  crumbs.push(breadcrumbLabel[seg] ?? seg);
  return crumbs;
}

export default function ShamellAdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
      <div className="flex items-center gap-3 border-b border-gold/20 px-5 py-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/40 bg-gold/10">
          <FlameIcon className="h-8 w-6 text-gold" />
        </div>
        <div>
          <p className="font-brand text-[10px] tracking-[0.2em] text-gold/90">SHAMELL</p>
          <p className="font-brand text-xs tracking-[0.12em] text-foreground/90">ADMIN PANEL</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
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
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 font-brand text-[11px] tracking-[0.12em] transition-colors ${
                active
                  ? "border border-gold/35 bg-gold/15 text-gold"
                  : "border border-transparent text-foreground/70 hover:border-gold/20 hover:bg-gold/5 hover:text-gold"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0 opacity-90" strokeWidth={1.5} />
              {item.label.toUpperCase()}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gold/20 p-4">
        <div className="mb-3 flex items-center gap-3 rounded-md border border-gold/15 bg-black/30 px-3 py-2">
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
        <Link
          href="/"
          className="mb-2 flex w-full items-center justify-center gap-2 rounded-md border border-gold/30 py-2 font-brand text-[10px] tracking-[0.14em] text-gold transition-colors hover:bg-gold/10"
        >
          <Store className="h-3.5 w-3.5" strokeWidth={1.5} />
          IR AL SITIO
        </Link>
        <button
          type="button"
          onClick={onLogout}
          className="w-full rounded-md border border-gold/20 py-2 font-brand text-[10px] tracking-[0.14em] text-foreground/70 hover:border-gold/40 hover:text-gold"
        >
          CERRAR SESIÓN
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Mobile overlay */}
      {sidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          aria-label="Cerrar menú"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-gold/25 bg-[#070707] transition-transform duration-200 lg:sticky lg:top-0 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-end border-b border-gold/15 px-3 py-2 lg:hidden">
          <button
            type="button"
            className="text-gold p-2"
            aria-label="Cerrar sidebar"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {navInner}
      </aside>

      {/* Main */}
      <div className="flex h-screen flex-1 flex-col overflow-hidden lg:min-w-0">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-gold/20 bg-background/95 px-4 backdrop-blur-sm">
          <button
            type="button"
            className="rounded-md border border-gold/25 p-2 text-gold lg:hidden"
            aria-label="Abrir menú"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex flex-1 items-center gap-2 text-[11px] font-brand tracking-widest text-foreground/60">
            {crumbs.map((c, i) => (
              <span key={`${c}-${i}`} className="flex items-center gap-2">
                {i > 0 ? <span className="text-gold/40">/</span> : null}
                <span className={i === crumbs.length - 1 ? "text-gold" : ""}>{c.toUpperCase()}</span>
              </span>
            ))}
          </div>
          <Link
            href="/"
            className="flex items-center gap-1.5 font-brand text-[10px] tracking-[0.12em] text-gold hover:text-gold-light"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            VER SITIO
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto p-5 md:p-8">{children}</main>
      </div>
    </div>
  );
}
