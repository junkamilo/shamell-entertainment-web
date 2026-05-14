"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import {
  ADMIN_SESSION_CHANGED_EVENT,
  isAdminLoggedIn,
} from "@/lib/adminSession";
import { cn } from "@/lib/utils";
import bailarinaLogo from "@/public/01_bailarina.png";

type NavItem = {
  label: string;
  href: string;
  sectionId?: string;
};

const navItems: NavItem[] = [
  { label: "HOME", href: "/#hero", sectionId: "hero" },
  { label: "SERVICE CATALOG", href: "/#services", sectionId: "services" },
  {
    label: "TYPES OF EVENTS",
    href: "/#experiences",
    sectionId: "experiences",
  },
  { label: "ABOUT", href: "/#about", sectionId: "about" },
  { label: "GALLERY", href: "/#gallery", sectionId: "gallery" },
];

/** DOM order on `/` — used to pick the "current" section while scrolling (last section whose top passed the activation line). */
const homeScrollSectionIds = navItems
  .map((item) => item.sectionId)
  .filter((id): id is string => Boolean(id));

function computeHomeActiveSectionId(): string {
  if (typeof window === "undefined") {
    return homeScrollSectionIds[0] ?? "hero";
  }
  const activationOffset = Math.min(168, Math.max(88, window.innerHeight * 0.2));
  const y = window.scrollY + activationOffset;
  let current = homeScrollSectionIds[0] ?? "hero";
  for (const id of homeScrollSectionIds) {
    const el = document.getElementById(id);
    if (!el) continue;
    const sectionTop = el.getBoundingClientRect().top + window.scrollY;
    if (sectionTop <= y + 1) {
      current = id;
    }
  }
  return current;
}

function HeaderBrandImage({ compact }: { compact?: boolean }) {
  return (
    <Image
      src={bailarinaLogo}
      alt="Shamell Entertainment SVCS LLC"
      width={180}
      height={164}
      priority
      className={cn(
        "w-auto object-contain object-left drop-shadow-[0_2px_14px_rgba(0,0,0,0.45)] transition-[opacity,filter] duration-300 group-hover:opacity-95",
        compact
          ? "h-11 max-w-16 sm:h-12 sm:max-w-18"
          : "h-12 max-w-18 sm:h-14 sm:max-w-20 md:h-15 md:max-w-22 lg:h-16 lg:max-w-24",
      )}
    />
  );
}

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
        "group/nav relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md border font-brand text-[0.625rem] font-semibold uppercase leading-none tracking-[0.08em] transition-[color,background-color,border-color,box-shadow] duration-300 sm:text-[0.6875rem] sm:tracking-widest lg:text-xs lg:tracking-[0.11em] xl:tracking-[0.12em]",
        "min-h-9 whitespace-nowrap px-2 py-2 sm:min-h-10 sm:px-2.5 lg:px-3",
        active
          ? "border-gold/50 bg-black/45 text-gold shadow-[inset_0_1px_0_rgba(197,165,90,0.12)]"
          : "border-transparent text-foreground/72 hover:border-gold/22 hover:bg-white/6 hover:text-gold-light",
      )}
    >
      {active ? (
        <motion.span
          layoutId="header-active-nav"
          className="absolute inset-0 rounded-md bg-gold/8"
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          aria-hidden
        />
      ) : null}
      <span className="relative z-10">{label}</span>
      <motion.span
        className="absolute bottom-1.5 left-2 right-2 h-px origin-center bg-linear-to-r from-transparent via-gold to-transparent"
        initial={false}
        animate={{ scaleX: active ? 1 : 0, opacity: active ? 0.85 : 0 }}
        whileHover={{ scaleX: 1, opacity: 0.75 }}
        transition={{ duration: 0.24, ease: "easeOut" }}
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
  const [desktopEffectsEnabled, setDesktopEffectsEnabled] = useState(false);

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
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const syncViewport = () => setDesktopEffectsEnabled(mediaQuery.matches);

    syncViewport();
    mediaQuery.addEventListener("change", syncViewport);

    return () => mediaQuery.removeEventListener("change", syncViewport);
  }, []);

  useEffect(() => {
    if (pathname !== "/") return;

    const sync = () => {
      setActiveSection(computeHomeActiveSectionId());
    };

    sync();
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync, { passive: true });
    window.addEventListener("hashchange", sync);
    const t = window.setTimeout(sync, 120);

    return () => {
      window.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      window.removeEventListener("hashchange", sync);
      window.clearTimeout(t);
    };
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
      const bySection = navItems.find(
        (item) => item.sectionId === activeSection,
      );
      return bySection?.href ?? "/#hero";
    }

    if (pathname === "/gallery") return "/#gallery";

    if (pathname.startsWith("/blog")) return "/blog";
    if (pathname.startsWith("/contacto")) return "/contacto";

    return "";
  }, [activeSection, pathname]);
  const headerElevated = scrolled || isMenuOpen;

  return (
    <>
      <div
        className="pointer-events-none fixed top-0 left-0 right-0 z-91 h-px bg-linear-to-r from-transparent via-gold/35 to-transparent opacity-90"
        aria-hidden
      />

      <motion.header
        initial={{ y: -22, opacity: 0 }}
        animate={{
          y: 0,
          opacity: 1,
          boxShadow: headerElevated
            ? "0 18px 56px rgba(0,0,0,0.62)"
            : "0 10px 34px rgba(0,0,0,0.22)",
          backdropFilter: desktopEffectsEnabled
            ? headerElevated
              ? "blur(18px)"
              : "blur(8px)"
            : "blur(2px)",
        }}
        transition={{
          duration: desktopEffectsEnabled ? 0.48 : 0.3,
          ease: [0.16, 1, 0.3, 1],
        }}
        className={cn(
          "fixed top-px left-0 right-0 z-90 transition-[background-color,border-color] duration-500 ease-out",
          headerElevated
            ? "border-b border-gold/28 bg-[linear-gradient(180deg,rgba(10,6,14,0.94),rgba(8,6,10,0.78))] shadow-[0_18px_56px_rgba(0,0,0,0.62)] md:backdrop-blur-xl"
            : "border-b border-gold/16 bg-[linear-gradient(180deg,rgba(12,8,16,0.68),rgba(12,8,16,0.36))] md:backdrop-blur-md",
          isMenuOpen && "md:border-gold/20",
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-80"
          aria-hidden
        >
          <div className="absolute inset-x-0 top-0 h-10 bg-[radial-gradient(65%_120%_at_50%_0%,rgba(197,165,90,0.10),transparent_62%)]" />
        </div>

        <div className="relative mx-auto w-full max-w-[1920px] px-4 py-2.5 sm:px-6 md:px-8 lg:px-10 xl:px-12">
          {/* Desktop: margin | logo + nav row ············ ADMIN | Inquire | margin */}
          <div className="hidden min-h-17 w-full items-center justify-between gap-6 md:flex lg:gap-8 xl:gap-10">
            <div className="flex min-w-0 flex-1 items-center gap-4 lg:gap-6 xl:gap-8">
              <motion.div
                whileHover={{
                  scale: 1.035,
                  y: -1,
                  filter: "drop-shadow(0 0 14px rgba(197,165,90,0.18))",
                }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                <Link
                  href="/#hero"
                  className="group relative flex shrink-0 items-center rounded-sm outline-offset-4 focus-visible:outline-2 focus-visible:outline-gold/45"
                >
                  <HeaderBrandImage />
                </Link>
              </motion.div>

              <nav
                className="flex min-w-0 flex-1 justify-center overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                aria-label="Main navigation"
              >
                <div className="flex w-max flex-nowrap items-center justify-center gap-x-1 sm:gap-x-1.5 lg:gap-x-2 xl:gap-x-2.5">
                  {navItems.map((item) => (
                    <DesktopNavLink
                      key={item.label}
                      href={item.href}
                      label={item.label.toUpperCase()}
                      active={activeHref === item.href}
                    />
                  ))}
                </div>
              </nav>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-2.5 lg:gap-3">
              {showAdminEntry ? (
                <motion.div
                  whileHover={{
                    scale: 1.025,
                    y: -1,
                    boxShadow: "0 0 22px rgba(197,165,90,0.18)",
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <Link
                    href="/shamell-admin"
                    className={cn(
                      "inline-flex min-h-9 items-center gap-1.5 rounded-md border border-gold/40 bg-black/30 px-2.5 py-2 text-gold transition-all duration-300 sm:min-h-10 sm:px-3",
                      "hover:border-gold/60 hover:bg-gold/10 hover:shadow-[0_0_20px_rgba(197,165,90,0.14)]",
                    )}
                    aria-label="Admin panel"
                    title="Admin"
                  >
                    <Image
                      src={bailarinaLogo}
                      alt=""
                      width={18}
                      height={20}
                      className="h-5 w-auto max-w-[18px] shrink-0 object-contain opacity-90"
                    />
                    <span className="font-brand text-xs font-semibold tracking-[0.16em] lg:tracking-[0.18em]">
                      ADMIN
                    </span>
                  </Link>
                </motion.div>
              ) : null}

              <motion.div
                whileHover={{
                  scale: 1.025,
                  y: -1,
                  boxShadow: "0 0 24px rgba(197,165,90,0.22)",
                }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <a
                  href="/contacto"
                  className={cn(
                    "relative inline-flex min-h-9 items-center justify-center overflow-hidden rounded-md border border-gold/55 bg-gold/8 px-3 py-2 font-brand text-xs font-semibold tracking-[0.18em] text-gold uppercase transition-all duration-300 sm:min-h-10 sm:px-4 lg:px-5 lg:tracking-[0.2em]",
                    "before:pointer-events-none before:absolute before:inset-0 before:-translate-x-full before:bg-linear-to-r before:from-transparent before:via-white/10 before:to-transparent before:transition-transform before:duration-500",
                    "hover:border-gold hover:bg-gold/14 hover:text-gold-light hover:shadow-[0_0_24px_rgba(197,165,90,0.2)] hover:before:translate-x-full",
                  )}
                >
                  <span className="relative z-10">Inquire</span>
                </a>
              </motion.div>
            </div>
          </div>

          {/* Mobile */}
          <div className="flex min-h-17 w-full items-center justify-between gap-3 md:hidden">
            <div className="transition-transform duration-200 ease-out will-change-transform hover:scale-[1.03] active:scale-[0.98]">
              <Link
                href="/#hero"
                className="group relative flex min-w-0 shrink-0 items-center rounded-sm outline-offset-4 focus-visible:outline-2 focus-visible:outline-gold/45"
              >
                <HeaderBrandImage compact />
              </Link>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {showAdminEntry ? (
                <div className="transition-transform duration-200 ease-out will-change-transform hover:scale-[1.02] active:scale-[0.98]">
                  <Link
                    href="/shamell-admin"
                    className="flex min-h-9 min-w-24 items-center justify-center rounded-md border border-gold/40 bg-black/30 px-3 py-1.5 text-center text-gold"
                    aria-label="Admin"
                  >
                    <span className="font-brand text-xs font-semibold tracking-[0.14em]">
                      ADMIN
                    </span>
                  </Link>
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className="rounded-md border border-gold/25 p-2 text-gold transition-[transform,colors] duration-200 ease-out will-change-transform hover:scale-[1.04] hover:border-gold/45 hover:bg-white/5 active:scale-[0.94]"
                aria-expanded={isMenuOpen}
                aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              >
                {isMenuOpen ? (
                  <X size={20} strokeWidth={1.5} />
                ) : (
                  <Menu size={20} strokeWidth={1.5} />
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {isMenuOpen ? (
          <>
            <motion.div
              key="mobile-header-overlay"
              className="fixed inset-0 z-80 bg-black/70 backdrop-blur-md md:hidden"
              aria-hidden
              onClick={() => setIsMenuOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
            />

            <motion.nav
              key="mobile-header-nav"
              className="fixed left-0 right-0 top-[calc(4.25rem+1px)] z-85 flex max-h-[min(85dvh,calc(100dvh-5rem))] flex-col border-b border-gold/20 bg-[oklch(0.08_0.02_45/0.97)] shadow-[0_24px_48px_rgba(0,0,0,0.65)] backdrop-blur-2xl md:hidden"
              aria-label="Mobile menu"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="shamell-scrollbar mx-auto flex w-full max-w-md flex-1 flex-col gap-0 overflow-y-auto px-6 py-6">
                {navItems.map((item) => (
                  <div key={item.label}>
                    <Link
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={cn(
                        "block border-b border-white/6 py-4 font-brand text-base font-medium tracking-[0.2em] uppercase transition-colors duration-300",
                        activeHref === item.href
                          ? "text-gold"
                          : "text-foreground/75 hover:text-gold-light",
                      )}
                    >
                      {item.label}
                    </Link>
                  </div>
                ))}
                <a
                  href="/contacto"
                  onClick={() => setIsMenuOpen(false)}
                  className="btn-outline-gold mx-auto mt-6 flex min-h-12 w-full max-w-xs items-center justify-center px-4 py-3 text-center font-brand tracking-[0.2em] transition-transform duration-200 ease-out will-change-transform hover:scale-[1.02] hover:shadow-[0_0_22px_rgba(197,165,90,0.18)] active:scale-[0.98] md:text-xs"
                >
                  Inquire
                </a>
                {showAdminEntry ? (
                  <div>
                    <Link
                      href="/shamell-admin"
                      onClick={() => setIsMenuOpen(false)}
                      className="mx-auto mt-4 flex min-h-12 w-full max-w-xs items-center justify-center gap-2 border border-gold/35 px-4 py-3 text-center font-brand text-xs tracking-[0.18em] text-gold transition-all hover:border-gold/55 hover:bg-gold/10"
                    >
                      <Image
                        src={bailarinaLogo}
                        alt=""
                        width={20}
                        height={24}
                        className="h-6 w-auto max-w-5 shrink-0 object-contain"
                      />
                      ADMIN PANEL
                    </Link>
                  </div>
                ) : null}
              </div>
            </motion.nav>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
