/** Dispatched when admin toggles On Coming Events publish state (header should refetch). */
export const ON_COMING_EVENTS_SETTINGS_CHANGED_EVENT =
  "shamell:on-coming-events-settings-changed";

export function notifyOnComingEventsSettingsChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(ON_COMING_EVENTS_SETTINGS_CHANGED_EVENT));
}
