/** Dispatched when admin toggles venue layout publish state (header should refetch). */
export const VENUE_LAYOUT_SETTINGS_CHANGED_EVENT = "shamell:venue-layout-settings-changed";

export function notifyVenueLayoutSettingsChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(VENUE_LAYOUT_SETTINGS_CHANGED_EVENT));
}
