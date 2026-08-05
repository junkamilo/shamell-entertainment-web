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
