/**
 * Vertical order of section `id`s on `app/page.tsx`.
 * Note: `ExperiencesSection` renders SERVICE CATALOG (`id="services"`);
 * `ServicesSection` renders TYPES OF EVENTS (`id="experiences"`).
 */
export const HOME_SECTION_SCROLL_ORDER = [
  "hero",
  "services",
  "experiences",
  "about",
  "on-coming-events",
  "gallery",
] as const;

export type SiteHeaderNavItem = {
  label: string;
  shortLabel: string;
  href: string;
  sectionId?: string;
  /** Omit from compact inline nav (logo covers home). */
  hideInCompactNav?: boolean;
};

const baseNavItems: SiteHeaderNavItem[] = [
  {
    label: "HOME",
    shortLabel: "HOME",
    href: "/#hero",
    sectionId: "hero",
    hideInCompactNav: true,
  },
  {
    label: "SERVICE CATALOG",
    shortLabel: "CATALOG",
    href: "/#services",
    sectionId: "services",
  },
  {
    label: "TYPES OF EVENTS",
    shortLabel: "EVENTS",
    href: "/#experiences",
    sectionId: "experiences",
  },
  {
    label: "ABOUT",
    shortLabel: "ABOUT",
    href: "/#about",
    sectionId: "about",
  },
  {
    label: "GALLERY",
    shortLabel: "GALLERY",
    href: "/#gallery",
    sectionId: "gallery",
  },
];

const onComingEventsNavItem: SiteHeaderNavItem = {
  label: "ON COMING EVENTS",
  shortLabel: "ON COMING",
  href: "/#on-coming-events",
  sectionId: "on-coming-events",
};

export function buildSiteHeaderNavItems(
  onComingEventsEnabled: boolean,
): SiteHeaderNavItem[] {
  if (!onComingEventsEnabled) return baseNavItems;
  const items = [...baseNavItems];
  const galleryIndex = items.findIndex((item) => item.sectionId === "gallery");
  const insertAt = galleryIndex >= 0 ? galleryIndex : items.length;
  items.splice(insertAt, 0, onComingEventsNavItem);
  return items;
}

export function buildHomeScrollSectionIds(
  onComingEventsEnabled: boolean,
): string[] {
  if (!onComingEventsEnabled) {
    return HOME_SECTION_SCROLL_ORDER.filter((id) => id !== "on-coming-events");
  }
  return [...HOME_SECTION_SCROLL_ORDER];
}

export function desktopNavItems(
  items: SiteHeaderNavItem[],
  compact: boolean,
): SiteHeaderNavItem[] {
  if (!compact) return items;
  return items.filter((item) => !item.hideInCompactNav);
}

export type HomeSectionId = (typeof HOME_SECTION_SCROLL_ORDER)[number];

/** Canonical home deep link for a section id (e.g. `services` → `/#services`). */
export function homeSectionHref(sectionId: string): string {
  return `/#${sectionId}`;
}

export function readHomeHashSectionId(): string | null {
  if (typeof window === "undefined") return null;
  if (window.location.pathname !== "/") return null;
  const raw = window.location.hash.replace(/^#/, "").trim();
  return raw || null;
}

/** Fixed header clearance when scrolling to a home section. */
export function homeSectionScrollTop(sectionEl: HTMLElement): number {
  const headerOffset = Math.min(120, Math.max(72, window.innerHeight * 0.12));
  return Math.max(
    0,
    sectionEl.getBoundingClientRect().top + window.scrollY - headerOffset,
  );
}

export function scrollWindowToHomeSection(sectionId: string): boolean {
  if (typeof window === "undefined") return false;
  const el = document.getElementById(sectionId);
  if (!el) return false;
  window.scrollTo({ top: homeSectionScrollTop(el), left: 0, behavior: "auto" });
  return true;
}

/**
 * While true, scroll-spy must not rewrite `location.hash`.
 * Prevents layout-shift after back/forward from overwriting `/#services` with
 * `/#on-coming-events` before the intentional hash scroll finishes.
 */
let homeHashScrollLockUntil = 0;

export function lockHomeHashScroll(durationMs = 1600): void {
  homeHashScrollLockUntil = Date.now() + Math.max(0, durationMs);
}

export function isHomeHashScrollLocked(): boolean {
  return Date.now() < homeHashScrollLockUntil;
}

/**
 * Keep `location.hash` aligned with the visible home section without pushing history.
 * Ensures leaving the home page snapshots the section the user was actually viewing.
 * Hero uses a clean `/` (no hash).
 */
export function syncHomeSectionHash(sectionId: string): void {
  if (typeof window === "undefined") return;
  if (window.location.pathname !== "/") return;
  if (!sectionId.trim()) return;
  if (isHomeHashScrollLocked()) return;

  const nextHash = sectionId === "hero" ? "" : `#${sectionId}`;
  if (window.location.hash === nextHash) return;

  const url = `${window.location.pathname}${window.location.search}${nextHash}`;
  window.history.replaceState(window.history.state, "", url);
}
