import { ON_COMING_EVENTS_PUBLIC_PATH } from "@/lib/onComingEventsRoutes";

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
