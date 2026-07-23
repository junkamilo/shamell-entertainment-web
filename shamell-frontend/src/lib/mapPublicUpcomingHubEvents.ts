import type { OnComingEventHubCardItem } from "@/features/on-coming-events/components/OnComingEventHubCard";
import { parseApiInt } from "@/lib/fixedTicketInventory";
import { serviceCatalogMediaTypeFromUrl } from "@/lib/serviceCatalogMedia";

type EventsApiItem = {
  id?: string;
  eventTypeName?: string;
  description?: string;
  items?: string[];
  slug?: string;
  experienceType?: string;
  purchaseMode?: string;
  purchasable?: boolean;
  heroImageUrl?: string | null;
  heroMediaType?: string | null;
  images?: string[];
  fixedTicketCapacity?: unknown;
  ticketsSold?: unknown;
  ticketsRemaining?: unknown;
  tableCapacity?: unknown;
  tablesSold?: unknown;
  tablesRemaining?: unknown;
  eventStartsAt?: string;
};

function isValidEvent(item: EventsApiItem): item is EventsApiItem & {
  id: string;
  eventTypeName: string;
  description: string;
  items: string[];
} {
  return Boolean(
    item.id &&
      item.eventTypeName &&
      item.description &&
      Array.isArray(item.items) &&
      item.items.length > 0,
  );
}

export function mapPublicUpcomingHubEvents(data: unknown): OnComingEventHubCardItem[] {
  if (!Array.isArray(data)) return [];

  return (data as EventsApiItem[])
    .filter(isValidEvent)
    .flatMap((item) => {
      const imgs = Array.isArray(item.images)
        ? item.images.filter((u) => typeof u === "string" && u.trim())
        : [];
      const heroUrl =
        typeof item.heroImageUrl === "string" && item.heroImageUrl.trim()
          ? item.heroImageUrl.trim()
          : imgs.length > 0
            ? imgs[0]
            : null;
      const explicitMt =
        typeof item.heroMediaType === "string" && item.heroMediaType.trim()
          ? item.heroMediaType.trim().toUpperCase()
          : "";
      const heroMediaType: "IMAGE" | "VIDEO" =
        explicitMt === "VIDEO" || serviceCatalogMediaTypeFromUrl(heroUrl) === "VIDEO"
          ? "VIDEO"
          : "IMAGE";
      const slug = typeof item.slug === "string" ? item.slug.trim() : "";
      if (!slug) return [];

      const purchaseMode =
        item.purchaseMode === "venue_seating" ||
        item.purchaseMode === "classes" ||
        item.purchaseMode === "fixed_ticket" ||
        item.purchaseMode === "none"
          ? item.purchaseMode
          : item.experienceType === "VENUE_SEATING"
            ? "venue_seating"
            : item.experienceType === "CLASSES"
              ? "classes"
              : "none";
      const experienceType =
        item.experienceType === "VENUE_SEATING" || item.experienceType === "CLASSES"
          ? item.experienceType
          : null;

      return [
        {
          slug,
          eventTypeName: item.eventTypeName,
          heroImageUrl: heroUrl,
          heroMediaType,
          experienceType,
          purchaseMode,
          purchasable: item.purchasable === true,
          ...(parseApiInt(item.ticketsRemaining) !== undefined
            ? { ticketsRemaining: parseApiInt(item.ticketsRemaining) }
            : {}),
          ...(parseApiInt(item.fixedTicketCapacity) !== undefined
            ? { fixedTicketCapacity: parseApiInt(item.fixedTicketCapacity) }
            : {}),
          ...(parseApiInt(item.ticketsSold) !== undefined
            ? { ticketsSold: parseApiInt(item.ticketsSold) }
            : {}),
          ...(parseApiInt(item.tableCapacity) !== undefined
            ? { tableCapacity: parseApiInt(item.tableCapacity) }
            : {}),
          ...(parseApiInt(item.tablesRemaining) !== undefined
            ? { tablesRemaining: parseApiInt(item.tablesRemaining) }
            : {}),
          ...(parseApiInt(item.tablesSold) !== undefined
            ? { tablesSold: parseApiInt(item.tablesSold) }
            : {}),
          ...(typeof item.eventStartsAt === "string" && item.eventStartsAt
            ? { eventStartsAt: item.eventStartsAt }
            : {}),
        },
      ];
    });
}
