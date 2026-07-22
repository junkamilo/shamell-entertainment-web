"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ADMIN_SESSION_CHANGED_EVENT,
  isAdminLoggedIn,
} from "@/lib/adminSession";
import { cn } from "@/lib/utils";
import { useOnComingEventsSettings } from "@/hooks/use-on-coming-events-settings";
import { useHeaderNavOverflow } from "@/hooks/use-header-nav-fits";
import { ON_COMING_EVENTS_PUBLIC_PATH } from "@/lib/onComingEventsRoutes";
import bailarinaLogo from "@/public/01_bailarina.png";
import {
  buildHomeScrollSectionIds,
  buildSiteHeaderNavItems,
  type SiteHeaderNavItem,
} from "@/components/site-header-nav";

function isNavItemActive(
  pathname: string,
  activeSection: string,
  activeHref: string,
  item: SiteHeaderNavItem,
): boolean {
  if (pathname === "/") {
    return Boolean(item.sectionId && item.sectionId === activeSection);
  }
  if (
    item.sectionId === "on-coming-events" &&
    pathname.startsWith(ON_COMING_EVENTS_PUBLIC_PATH)
  ) {
    return true;
  }
  return activeHref === item.href;
}

function computeHomeActiveSectionId(sectionIds: string[]): string {
  if (typeof window === "undefined") {
    return sectionIds[0] ?? "hero";
  }
  const activationOffset = Math.min(168, Math.max(88, window.innerHeight * 0.2));
  const y = window.scrollY + activationOffset;
  let current = sectionIds[0] ?? "hero";
  for (const id of sectionIds) {
    const el = document.getElementById(id);
    if (!el) continue;
    const sectionTop = el.getBoundingClientRect().top + window.scrollY;
    if (sectionTop <= y + 1) {
      current = id;
    }
  }
  return current;
}

function HeaderBrandImage({
  compact,
  compactDesktop,
}: {
  compact?: boolean;
  compactDesktop?: boolean;
}) {
  return (
    <Image
      src={bailarinaLogo}
      alt="Shamell Entertainment SVCS LLC"
      width={180}
      height={164}
      className={cn(
        "w-auto object-contain object-left drop-shadow-[0_2px_14px_rgba(0,0,0,0.45)] transition-[opacity,filter] duration-300 group-hover:opacity-95",
        compact
          ? "h-11 max-w-16 sm:h-12 sm:max-w-18"
          : compactDesktop
            ? "h-12 max-w-18 lg:h-12 lg:max-w-20 xl:h-16 xl:max-w-24"
            : "h-12 max-w-18 sm:h-14 sm:max-w-20 lg:h-16 lg:max-w-24",
      )}
    />
  );
}

function DesktopNavLink({
  href,
  fullLabel,
  shortLabel,
  active,
  underlineWhenActive = true,
}: {
  href: string;
  fullLabel: string;
  shortLabel: string;
  active: boolean;
  underlineWhenActive?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group/nav relative inline-flex items-center justify-center overflow-hidden rounded-md border font-brand font-semibold uppercase leading-none transition-[color,background-color,border-color,box-shadow] duration-300",
        "min-h-9 whitespace-nowrap px-1.5 py-2 text-[0.625rem] tracking-[0.06em] lg:shrink xl:shrink-0 sm:min-h-10 sm:px-2",
        "xl:min-h-10 xl:px-2.5 xl:text-xs xl:tracking-[0.12em]",
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
      <span className="relative z-10 hidden xl:inline">{fullLabel}</span>
      <span className="relative z-10 xl:hidden">{shortLabel}</span>
      <motion.span
        className="absolute bottom-1.5 left-2 right-2 h-px origin-center bg-linear-to-r from-transparent via-gold to-transparent"
        initial={false}
        animate={{
          scaleX: active && underlineWhenActive ? 1 : 0,
          opacity: active && underlineWhenActive ? 0.85 : 0,
        }}
        whileHover={{ scaleX: 1, opacity: 0.75 }}
        transition={{ duration: 0.24, ease: "easeOut" }}
        aria-hidden
      />
    </Link>
  );
}

export default function SiteHeader() {
  const pathname = usePathname();
  const { clientEnabled: onComingEventsEnabled } = useOnComingEventsSettings();
  const navItems = useMemo(
    () => buildSiteHeaderNavItems(onComingEventsEnabled),
    [onComingEventsEnabled],
  );
  const homeScrollSectionIds = useMemo(
    () => buildHomeScrollSectionIds(onComingEventsEnabled),
    [onComingEventsEnabled],
  );
  const desktopRowRef = useRef<HTMLDivElement>(null);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const [showAdminEntry, setShowAdminEntry] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [desktopEffectsEnabled, setDesktopEffectsEnabled] = useState(false);
  const [isLargeViewport, setIsLargeViewport] = useState(false);

  const navOverflows = useHeaderNavOverflow(
    desktopRowRef,
    isLargeViewport,
    navItems.length + (showAdminEntry ? 1 : 0),
  );
  const showDesktopShell = isLargeViewport && !navOverflows;
  const showMobileShell = !showDesktopShell;

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
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const syncViewport = () => {
      setIsLargeViewport(mediaQuery.matches);
      setDesktopEffectsEnabled(mediaQuery.matches);
    };

    syncViewport();
    mediaQuery.addEventListener("change", syncViewport);

    return () => mediaQuery.removeEventListener("change", syncViewport);
  }, []);

  useEffect(() => {
    if (pathname !== "/") return;

    const sync = () => {
      setActiveSection(computeHomeActiveSectionId(homeScrollSectionIds));
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
  }, [pathname, homeScrollSectionIds]);

  useEffect(() => {
    if (!showMobileShell) return;
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen, showMobileShell]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isMenuOpen]);

  useEffect(() => {
    if (showDesktopShell) setIsMenuOpen(false);
  }, [showDesktopShell]);

  const activeHref = useMemo(() => {
    if (pathname === "/") {
      const bySection = navItems.find((item) => item.sectionId === activeSection);
      return bySection?.href ?? "/#hero";
    }

    if (pathname === "/gallery") return "/#gallery";

    if (pathname.startsWith("/contacto")) return "/contacto";

    if (pathname.startsWith(ON_COMING_EVENTS_PUBLIC_PATH)) {
      return "/#on-coming-events";
    }

    return "";
  }, [activeSection, pathname, navItems]);
  const headerElevated = scrolled || (showMobileShell && isMenuOpen);

  return (
    <>
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
          "fixed top-0 left-0 right-0 z-90 transition-[background-color,border-color] duration-500 ease-out",
          headerElevated
            ? "border-b border-gold/28 bg-[linear-gradient(180deg,rgba(10,6,14,0.94),rgba(8,6,10,0.78))] shadow-[0_18px_56px_rgba(0,0,0,0.62)] lg:backdrop-blur-xl"
            : "border-b border-gold/16 bg-[linear-gradient(180deg,rgba(12,8,16,0.68),rgba(12,8,16,0.36))] lg:backdrop-blur-md",
          showMobileShell && isMenuOpen && "lg:border-gold/20",
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-80"
          aria-hidden
        >
          <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-gold/35 to-transparent" />
          <div className="absolute inset-x-0 top-0 h-10 bg-[radial-gradient(65%_120%_at_50%_0%,rgba(197,165,90,0.10),transparent_62%)]" />
        </div>

        <div className="relative mx-auto w-full max-w-[1920px] px-4 py-2.5 sm:px-6 lg:px-8 xl:px-12">
          {/* Desktop: logo + inline nav + ADMIN + Inquire (lg+, hidden when overflow forces hamburger) */}
          <div
            ref={desktopRowRef}
            className={cn(
              "min-h-17 w-full items-center justify-between gap-4 xl:gap-8",
              isLargeViewport ? "flex" : "hidden",
              !showDesktopShell &&
                "pointer-events-none invisible absolute inset-x-0 top-0 -z-10",
            )}
            aria-hidden={!showDesktopShell}
          >
            <div className="flex min-w-0 flex-1 items-center gap-3 xl:gap-8">
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
                  <HeaderBrandImage compactDesktop />
                </Link>
              </motion.div>

              <nav
                className="flex min-w-0 flex-1 justify-center"
                aria-label="Main navigation"
              >
                <div className="flex flex-nowrap items-center justify-center gap-x-1 lg:gap-x-1.5 xl:gap-x-2.5">
                  {navItems.map((item) => (
                    <div
                      key={item.label}
                      className={cn(
                        item.hideInCompactNav && "hidden xl:contents",
                      )}
                    >
                      <DesktopNavLink
                        href={item.href}
                        fullLabel={item.label}
                        shortLabel={item.shortLabel}
                        active={isNavItemActive(
                          pathname,
                          activeSection,
                          activeHref,
                          item,
                        )}
                        underlineWhenActive={
                          !(
                            pathname === "/" &&
                            item.sectionId === "on-coming-events"
                          )
                        }
                      />
                    </div>
                  ))}
                </div>
              </nav>
            </div>

            <div className="flex shrink-0 items-center gap-2 xl:gap-3">
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
                    href="/admin"
                    className={cn(
                      "inline-flex min-h-9 items-center justify-center rounded-md border border-gold/40 bg-black/30 text-gold transition-all duration-300 sm:min-h-10",
                      "hover:border-gold/60 hover:bg-gold/10 hover:shadow-[0_0_20px_rgba(197,165,90,0.14)]",
                      "px-2.5 py-2 xl:gap-1.5 xl:px-3",
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
                    <span className="hidden font-brand text-xs font-semibold tracking-[0.16em] xl:inline xl:tracking-[0.18em]">
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
                    "relative inline-flex min-h-9 items-center justify-center overflow-hidden rounded-md border border-gold/55 bg-gold/8 px-3 py-2 font-brand text-xs font-semibold tracking-[0.16em] text-gold uppercase transition-all duration-300 sm:min-h-10 xl:px-5 xl:tracking-[0.2em]",
                    "before:pointer-events-none before:absolute before:inset-0 before:-translate-x-full before:bg-linear-to-r before:from-transparent before:via-white/10 before:to-transparent before:transition-transform before:duration-500",
                    "hover:border-gold hover:bg-gold/14 hover:text-gold-light hover:shadow-[0_0_24px_rgba(197,165,90,0.2)] hover:before:translate-x-full",
                  )}
                >
                  <span className="relative z-10">Inquire</span>
                </a>
              </motion.div>
            </div>
          </div>

          {/* Mobile / overflow fallback */}
          <div
            className={cn(
              "min-h-17 w-full items-center justify-between gap-3",
              showMobileShell ? "flex" : "hidden",
            )}
          >
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
                    href="/admin"
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
        {showMobileShell && isMenuOpen ? (
          <>
            <motion.div
              key="mobile-header-overlay"
              className="fixed inset-0 z-80 bg-black/70 backdrop-blur-md"
              aria-hidden
              onClick={() => setIsMenuOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
            />

            <motion.nav
              key="mobile-header-nav"
              className="fixed top-17 right-0 left-0 z-85 flex max-h-[min(85dvh,calc(100dvh-5rem))] flex-col border-b border-gold/20 bg-[oklch(0.08_0.02_45/0.97)] shadow-[0_24px_48px_rgba(0,0,0,0.65)] backdrop-blur-2xl"
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
                        isNavItemActive(pathname, activeSection, activeHref, item)
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
                  className="btn-outline-gold mx-auto mt-6 flex min-h-12 w-full max-w-xs items-center justify-center px-4 py-3 text-center font-brand tracking-[0.2em] transition-transform duration-200 ease-out will-change-transform hover:scale-[1.02] hover:shadow-[0_0_22px_rgba(197,165,90,0.18)] active:scale-[0.98]"
                >
                  Inquire
                </a>
                {showAdminEntry ? (
                  <div>
                    <Link
                      href="/admin"
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
