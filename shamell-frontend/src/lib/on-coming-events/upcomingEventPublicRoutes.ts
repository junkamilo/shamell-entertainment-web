import { ON_COMING_EVENTS_PUBLIC_PATH } from "@/lib/on-coming-events/onComingEventsRoutes";

export function onComingEventHubHref(): string {
  return ON_COMING_EVENTS_PUBLIC_PATH;
}

export function onComingEventClassesHref(slug: string): string {
  return `${ON_COMING_EVENTS_PUBLIC_PATH}/${slug}/classes`;
}

export function onComingEventSeatsHref(slug: string): string {
  return `${ON_COMING_EVENTS_PUBLIC_PATH}/${slug}/seats`;
}

export function onComingEventDetailHref(slug: string): string {
  return `${ON_COMING_EVENTS_PUBLIC_PATH}/${slug}`;
}

export function onComingEventVenueReturnHref(slug?: string): string {
  if (!slug?.trim()) return `${ON_COMING_EVENTS_PUBLIC_PATH}/return`;
  const q = new URLSearchParams({ event_slug: slug.trim() });
  return `${ON_COMING_EVENTS_PUBLIC_PATH}/return?${q.toString()}`;
}

export function onComingEventFixedTicketReturnHref(slug: string): string {
  return `${ON_COMING_EVENTS_PUBLIC_PATH}/${slug}/return`;
}

export function onComingEventClassSessionReturnHref(slug: string): string {
  return `${ON_COMING_EVENTS_PUBLIC_PATH}/${slug}/classes/return`;
}

export function onComingEventClassPackageReturnHref(slug: string): string {
  return `${ON_COMING_EVENTS_PUBLIC_PATH}/${slug}/classes/package-return`;
}
