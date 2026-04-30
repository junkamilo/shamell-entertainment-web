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
  { label: "Galeria", href: "/#gallery", sectionId: "gallery" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const [showAdminEntry, setShowAdminEntry] = useState(false);

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
    <header
      className={`fixed top-0 left-0 right-0 z-90 border-b border-gold/20 backdrop-blur-sm ${
        isMenuOpen ? "bg-transparent" : "bg-background/90"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/#hero" className="font-brand text-gold text-sm tracking-[0.2em]">
          SHAMELL
        </Link>

        <nav className="hidden md:flex items-center gap-4 lg:gap-6">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`relative text-[11px] lg:text-xs font-brand tracking-[0.12em] transition-colors ${
                activeHref === item.href ? "text-gold" : "text-foreground/75 hover:text-gold"
              }`}
            >
              {item.label.toUpperCase()}
              {activeHref === item.href ? (
                <span className="absolute left-0 -bottom-1 h-px w-full bg-gold" />
              ) : null}
            </Link>
          ))}
          {showAdminEntry ? (
            <Link
              href="/shamell-admin"
              className="flex items-center gap-1.5 rounded-sm border border-gold/50 px-2 py-1 text-gold transition-colors hover:bg-gold/10"
              aria-label="Admin panel"
              title="Admin panel"
            >
              <FlameIcon className="h-6 w-4 shrink-0 text-gold" />
              <span className="font-brand text-[10px] tracking-[0.14em]">ADMIN</span>
            </Link>
          ) : null}
          <a href="/contacto" className="btn-outline-gold font-brand text-[11px] lg:text-xs">
            GET A INQUIRE
          </a>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          {showAdminEntry ? (
            <Link
              href="/shamell-admin"
              className="flex items-center gap-1 rounded-sm border border-gold/50 px-2 py-1 text-gold"
              aria-label="Admin panel"
            >
              <FlameIcon className="h-5 w-3.5 shrink-0" />
              <span className="font-brand text-[9px] tracking-[0.12em]">ADMIN</span>
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="text-gold p-2"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {isMenuOpen ? (
        <nav className="md:hidden absolute top-16 left-0 right-0 border-t border-gold/20 bg-black/45 backdrop-blur-xl px-4 py-3 flex flex-col gap-3">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setIsMenuOpen(false)}
              className={`text-xs font-brand tracking-[0.12em] ${
                activeHref === item.href ? "text-gold" : "text-foreground/75"
              }`}
            >
              {item.label.toUpperCase()}
            </Link>
          ))}
          <a
            href="/contacto"
            onClick={() => setIsMenuOpen(false)}
            className="btn-outline-gold font-brand text-xs text-center mt-1"
          >
            GET A INQUIRE
          </a>
          {showAdminEntry ? (
            <Link
              href="/shamell-admin"
              onClick={() => setIsMenuOpen(false)}
              className="mt-2 flex items-center justify-center gap-2 border border-gold/40 py-2 font-brand text-xs tracking-[0.12em] text-gold"
            >
              <FlameIcon className="h-6 w-4" />
              ADMIN PANEL
            </Link>
          ) : null}
        </nav>
      ) : null}
    </header>
  );
}
