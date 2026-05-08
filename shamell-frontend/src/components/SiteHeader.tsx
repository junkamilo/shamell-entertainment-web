"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import FlameIcon from "@/components/FlameIcon";
import {
  ADMIN_SESSION_CHANGED_EVENT,
  isAdminLoggedIn,
} from "@/lib/adminSession";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  sectionId?: string;
};

const navItems: NavItem[] = [
  { label: "Inicio", href: "/#hero", sectionId: "hero" },
  { label: "Servicios", href: "/#services", sectionId: "services" },
  {
    label: "Experiencias Especiales",
    href: "/#experiences",
    sectionId: "experiences",
  },
  { label: "Acerca de", href: "/#about", sectionId: "about" },
  { label: "Galería", href: "/#gallery", sectionId: "gallery" },
];

function DesktopNavLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative whitespace-nowrap px-2 py-2 font-brand text-[10px] tracking-[0.16em] uppercase transition-colors duration-300 lg:px-2.5 lg:text-[11px]",
        active ? "text-gold" : "text-foreground/68 hover:text-gold-light",
      )}
    >
      <span className="relative z-10">{label}</span>
      <span
        className={cn(
          "pointer-events-none absolute inset-x-1 bottom-0.5 h-px origin-center scale-x-0 bg-linear-to-r from-transparent via-gold/90 to-transparent opacity-0 transition-[transform,opacity] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]",
          active && "scale-x-100 opacity-100",
          !active && "group-hover:scale-x-100 group-hover:opacity-100",
        )}
        aria-hidden
      />
      <span
        className={cn(
          "pointer-events-none absolute -inset-x-0.5 -inset-y-1 z-0 rounded-md bg-white/3 opacity-0 transition-opacity duration-300",
          "group-hover:opacity-100",
          active && "opacity-100 ring-1 ring-gold/15",
        )}
        aria-hidden
      />
    </Link>
  );
}

export default function SiteHeader() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const [showAdminEntry, setShowAdminEntry] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const syncAdmin = () => setShowAdminEntry(isAdminLoggedIn());
    syncAdmin();
    window.addEventListener(ADMIN_SESSION_CHANGED_EVENT, syncAdmin);
    window.addEventListener("storage", syncAdmin);
    return () => {
      window.removeEventListener(ADMIN_SESSION_CHANGED_EVENT, syncAdmin);
      window.removeEventListener("storage", syncAdmin);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (pathname !== "/") return;

    const sectionIds = navItems
      .map((item) => item.sectionId)
      .filter((id): id is string => Boolean(id));

    const observers: IntersectionObserver[] = [];

    sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (!element) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveSection(id);
            }
          });
        },
        { rootMargin: "-35% 0px -50% 0px", threshold: 0.1 },
      );

      observer.observe(element);
      observers.push(observer);
    });

    return () => observers.forEach((observer) => observer.disconnect());
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isMenuOpen]);

  const activeHref = useMemo(() => {
    if (pathname === "/") {
      const bySection = navItems.find((item) => item.sectionId === activeSection);
      return bySection?.href ?? "/#hero";
    }

    if (pathname.startsWith("/blog")) return "/blog";
    if (pathname.startsWith("/contacto")) return "/contacto";

    return "";
  }, [activeSection, pathname]);

  return (
    <>
      <div
        className="pointer-events-none fixed top-0 left-0 right-0 z-91 h-px bg-linear-to-r from-transparent via-gold/35 to-transparent opacity-90"
        aria-hidden
      />

      <header
        className={cn(
          "fixed top-px left-0 right-0 z-90 transition-[background-color,box-shadow,backdrop-filter,border-color] duration-500 ease-out",
          scrolled || isMenuOpen
            ? "border-b border-gold/28 bg-[linear-gradient(180deg,rgba(10,6,14,0.92),rgba(8,6,10,0.72))] shadow-[0_18px_56px_rgba(0,0,0,0.62)] backdrop-blur-2xl"
            : "border-b border-gold/16 bg-[linear-gradient(180deg,rgba(12,8,16,0.58),rgba(12,8,16,0.28))] backdrop-blur-lg",
          isMenuOpen && "md:border-gold/20",
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-80"
          aria-hidden
        >
          <div className="absolute inset-x-0 top-0 h-10 bg-[radial-gradient(65%_120%_at_50%_0%,rgba(197,165,90,0.10),transparent_62%)]" />
        </div>

        <div className="mx-auto flex h-17 max-w-6xl items-center gap-3 px-4 sm:px-5">
          <Link
            href="/#hero"
            className="group relative flex shrink-0 items-center gap-2.5 pr-1"
          >
            <span
              className="hidden h-8 w-px bg-linear-to-b from-gold/5 via-gold/45 to-gold/5 sm:block"
              aria-hidden
            />
            <FlameIcon className="h-7 w-4 shrink-0 text-gold/90 transition-colors duration-300 group-hover:text-gold-light" />
            <span className="flex flex-col leading-none">
              <span className="font-brand text-sm tracking-[0.28em] text-gold transition-colors duration-300 group-hover:text-gold-light sm:text-[0.95rem]">
                SHAMELL
              </span>
              <span className="mt-1 hidden font-body text-[9px] tracking-[0.2em] text-foreground/45 uppercase sm:block">
                Performance Artistry
              </span>
            </span>
          </Link>

          <nav
            className="relative hidden min-w-0 flex-1 items-center justify-center gap-0 md:flex lg:gap-0.5"
            aria-label="Principal"
          >
            {navItems.map((item) => (
              <DesktopNavLink
                key={item.label}
                href={item.href}
                label={item.label.toUpperCase()}
                active={activeHref === item.href}
              />
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            {showAdminEntry ? (
              <Link
                href="/shamell-admin"
                className={cn(
                  "hidden items-center gap-1.5 rounded-md border border-gold/35 bg-black/25 px-2.5 py-1.5 text-gold transition-all duration-300 md:flex",
                  "hover:border-gold/55 hover:bg-gold/8 hover:shadow-[0_0_20px_rgba(197,165,90,0.12)]",
                )}
                aria-label="Panel de administración"
                title="Admin"
              >
                <FlameIcon className="h-5 w-3.5 shrink-0 opacity-90" />
                <span className="font-brand text-[10px] tracking-[0.18em]">ADMIN</span>
              </Link>
            ) : null}

            <a
              href="/contacto"
              className={cn(
                "relative hidden overflow-hidden rounded-md border border-gold/55 bg-gold/6 px-4 py-2.5 font-brand text-[10px] tracking-[0.22em] text-gold uppercase transition-all duration-300 md:inline-flex md:items-center md:justify-center",
                "before:pointer-events-none before:absolute before:inset-0 before:-translate-x-full before:bg-linear-to-r before:from-transparent before:via-white/10 before:to-transparent before:transition-transform before:duration-500",
                "hover:border-gold hover:text-gold-light hover:shadow-[0_0_24px_rgba(197,165,90,0.18)] hover:before:translate-x-full",
              )}
            >
              <span className="relative z-10">Inquire</span>
            </a>

            <div className="flex items-center gap-1 md:hidden">
              {showAdminEntry ? (
                <Link
                  href="/shamell-admin"
                  className="flex items-center gap-1 rounded-md border border-gold/40 bg-black/30 px-2 py-1.5 text-gold"
                  aria-label="Admin"
                >
                  <FlameIcon className="h-4 w-3 shrink-0" />
                  <span className="font-brand text-[9px] tracking-[0.14em]">ADMIN</span>
                </Link>
              ) : null}
              <button
                type="button"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className="rounded-md border border-gold/25 p-2 text-gold transition-colors hover:border-gold/45 hover:bg-white/5"
                aria-expanded={isMenuOpen}
                aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
              >
                {isMenuOpen ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile: full-height overlay */}
      <div
        className={cn(
          "fixed inset-0 z-80 bg-black/70 backdrop-blur-md transition-opacity duration-300 md:hidden",
          isMenuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-hidden={!isMenuOpen}
        onClick={() => setIsMenuOpen(false)}
      />

      <nav
        className={cn(
          "fixed left-0 right-0 top-[calc(4.25rem+1px)] z-85 flex max-h-[min(85dvh,calc(100dvh-5rem))] flex-col border-b border-gold/20 bg-[oklch(0.08_0.02_45/0.97)] shadow-[0_24px_48px_rgba(0,0,0,0.65)] backdrop-blur-2xl transition-[opacity,transform,visibility] duration-300 ease-out md:hidden",
          isMenuOpen
            ? "visible translate-y-0 opacity-100"
            : "invisible -translate-y-2 opacity-0 pointer-events-none",
        )}
        aria-label="Menú móvil"
        aria-hidden={!isMenuOpen}
      >
        <div className="shamell-scrollbar mx-auto flex w-full max-w-md flex-1 flex-col gap-0 overflow-y-auto px-6 py-6">
          {navItems.map((item, i) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setIsMenuOpen(false)}
              style={{ transitionDelay: isMenuOpen ? `${40 + i * 45}ms` : "0ms" }}
              className={cn(
                "border-b border-white/6 py-4 font-brand text-sm tracking-[0.2em] uppercase transition-[color,opacity,transform] duration-300",
                activeHref === item.href ? "text-gold" : "text-foreground/75",
                isMenuOpen ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
              )}
            >
              {item.label}
            </Link>
          ))}
          <a
            href="/contacto"
            onClick={() => setIsMenuOpen(false)}
            className={cn(
              "btn-outline-gold mx-auto mt-6 w-full max-w-xs py-3 text-center font-brand text-xs tracking-[0.2em]",
              isMenuOpen ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
            )}
            style={{ transitionDelay: isMenuOpen ? `${40 + navItems.length * 45}ms` : "0ms" }}
          >
            Inquire
          </a>
          {showAdminEntry ? (
            <Link
              href="/shamell-admin"
              onClick={() => setIsMenuOpen(false)}
              className={cn(
                "mt-4 flex items-center justify-center gap-2 border border-gold/35 py-3 font-brand text-xs tracking-[0.18em] text-gold transition-all",
                isMenuOpen ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
              )}
              style={{ transitionDelay: isMenuOpen ? `${40 + (navItems.length + 1) * 45}ms` : "0ms" }}
            >
              <FlameIcon className="h-6 w-4" />
              ADMIN PANEL
            </Link>
          ) : null}
        </div>
      </nav>
    </>
  );
}
