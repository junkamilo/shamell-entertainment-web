"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type NavItem = {
  label: string;
  href: string;
  sectionId?: string;
};

const navItems: NavItem[] = [
  { label: "Inicio", href: "/#hero", sectionId: "hero" },
  { label: "Acerca de", href: "/#about", sectionId: "about" },
  { label: "Servicios", href: "/#services", sectionId: "services" },
  {
    label: "Experiencias Especiales",
    href: "/#experiences",
    sectionId: "experiences",
  },
  { label: "Galeria", href: "/#gallery", sectionId: "gallery" },
  { label: "Blog", href: "/blog" },
  { label: "Contacto", href: "/#contacto", sectionId: "contacto" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");

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
    if (pathname.startsWith("/contacto")) return "/#contacto";

    return "";
  }, [activeSection, pathname]);

  return (
    <header className="fixed top-0 left-0 right-0 z-90 border-b border-gold/20 bg-background/90 backdrop-blur-sm">
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
        </nav>

        <button
          type="button"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          className="md:hidden text-gold p-2"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {isMenuOpen ? (
        <nav className="md:hidden border-t border-gold/20 bg-background/95 px-4 py-3 flex flex-col gap-3">
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
        </nav>
      ) : null}
    </header>
  );
}
