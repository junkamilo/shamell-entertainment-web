import { fetchAdminEventTypes } from "@/app/shamell-admin/event-types/services/fetchAdminEventTypes";
import type { EventsEventTypeOption } from "../types/events.types";

export async function fetchAdminEventTypesForEvents(token: string): Promise<EventsEventTypeOption[]> {
  const types = await fetchAdminEventTypes(token);
  return types.map((t) => ({
    id: t.id,
    name: t.name,
    isActive: t.isActive,
  }));
}
