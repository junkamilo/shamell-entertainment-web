export type EventCatalogItem = {
  id: string;
  eventTypeName: string;
  description: string;
  eventTypes: string[];
  price: number | null;
  heroImageUrl: string | null;
  /** First catalog media; drives hero IMAGE vs VIDEO. */
  heroMediaType?: "IMAGE" | "VIDEO";
  heroPosterUrl?: string | null;
  heroPosterUrlMobile?: string | null;
};
