export const ON_COMING_EVENTS_PUBLIC_PATH = "/on-coming-events";
export const ON_COMING_EVENTS_ADMIN_PATH = "/shamell-admin/on-coming-events";
export const ON_COMING_EVENTS_LAYOUT_ADMIN_PATH = "/shamell-admin/on-coming-events/layout";
export const SEATING_LAYOUT_ADMIN_LABEL = "Seating layout";

export const ON_COMING_EVENTS_SITE_TAB_UPCOMING = "upcoming";
export const ON_COMING_EVENTS_SITE_TAB_RESERVATION = "reservation";

export type OnComingEventsSiteTab =
  | typeof ON_COMING_EVENTS_SITE_TAB_UPCOMING
  | typeof ON_COMING_EVENTS_SITE_TAB_RESERVATION;

export function onComingEventsSiteAdminHref(
  tab: OnComingEventsSiteTab = ON_COMING_EVENTS_SITE_TAB_UPCOMING,
): string {
  return `${ON_COMING_EVENTS_ADMIN_PATH}?tab=${tab}`;
}

export function parseOnComingEventsSiteTab(
  raw: string | null | undefined,
): OnComingEventsSiteTab {
  return raw === ON_COMING_EVENTS_SITE_TAB_RESERVATION
    ? ON_COMING_EVENTS_SITE_TAB_RESERVATION
    : ON_COMING_EVENTS_SITE_TAB_UPCOMING;
}

/** @deprecated Use ON_COMING_EVENTS_PUBLIC_PATH */
export const VENUE_LAYOUT_PUBLIC_PATH = ON_COMING_EVENTS_PUBLIC_PATH;
/** @deprecated Use ON_COMING_EVENTS_ADMIN_PATH */
export const VENUE_LAYOUT_PROMO_ADMIN_PATH = ON_COMING_EVENTS_ADMIN_PATH;
