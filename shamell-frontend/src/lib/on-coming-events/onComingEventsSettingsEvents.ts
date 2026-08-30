/** Dispatched when admin changes on-coming public data (settings or hub events). */
export const ON_COMING_EVENTS_PUBLIC_DATA_CHANGED_EVENT =
  "shamell:on-coming-events-public-data-changed";

/** @deprecated Use ON_COMING_EVENTS_PUBLIC_DATA_CHANGED_EVENT */
export const ON_COMING_EVENTS_SETTINGS_CHANGED_EVENT =
  ON_COMING_EVENTS_PUBLIC_DATA_CHANGED_EVENT;

const BROADCAST_CHANNEL_NAME = "shamell:on-coming-events";

export function notifyOnComingEventsPublicDataChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(ON_COMING_EVENTS_PUBLIC_DATA_CHANGED_EVENT));
  try {
    const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    channel.postMessage({ type: "public-data-changed" });
    channel.close();
  } catch {
    /* BroadcastChannel unsupported */
  }
  void triggerHomeRevalidation();
}

/** @deprecated Use notifyOnComingEventsPublicDataChanged */
export function notifyOnComingEventsSettingsChanged(): void {
  notifyOnComingEventsPublicDataChanged();
}

export function subscribeOnComingEventsPublicDataChanged(
  onChange: () => void,
): () => void {
  if (typeof window === "undefined") return () => undefined;

  const handler = () => onChange();
  window.addEventListener(ON_COMING_EVENTS_PUBLIC_DATA_CHANGED_EVENT, handler);

  let channel: BroadcastChannel | null = null;
  try {
    channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    channel.onmessage = () => onChange();
  } catch {
    /* BroadcastChannel unsupported */
  }

  return () => {
    window.removeEventListener(ON_COMING_EVENTS_PUBLIC_DATA_CHANGED_EVENT, handler);
    channel?.close();
  };
}

async function triggerHomeRevalidation(): Promise<void> {
  try {
    await fetch("/api/revalidate/home", { method: "POST" });
  } catch {
    /* non-blocking */
  }
}
