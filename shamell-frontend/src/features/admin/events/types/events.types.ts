export type CatalogImage = {
  id: string;
  imageUrl: string;
  mediaType?: string;
};

export type EventsEventTypeOption = {
  id: string;
  name: string;
  isActive: boolean;
};

export type EventPublicSection = "GENERAL" | "UPCOMING_EVENTS";
export type UpcomingExperienceType = "CLASSES" | "VENUE_SEATING";
export type UpcomingClassVariant = "GROUP" | "PERSONAL";

/** Inline experience selector for an upcoming event form. */
export type UpcomingExperienceMode = "NORMAL" | "FIXED_EVENT" | "RECURRING_WEEKLY";

export type AdminEvent = {
  id: string;
  eventTypeId: string;
  eventTypeName: string;
  description: string;
  items: string[];
  price: number | null;
  catalogImages: CatalogImage[];
  isActive: boolean;
  showOnHome: boolean;
  publicSection: EventPublicSection;
  slug?: string | null;
  experienceType?: UpcomingExperienceType | null;
  classVariant?: UpcomingClassVariant | null;
  createdAt?: string;
  updatedAt?: string;
  bookingCount?: number;
  galleryPhotoCount?: number;
};

export type EventFormSnapshot = {
  eventTypeId: string;
  eventName: string;
  description: string;
  itemsText: string;
  price: number | null;
  publicSection: EventPublicSection;
  experienceMode?: UpcomingExperienceMode;
  scheduleKey?: string;
  enableVenueSeating?: boolean;
  fixedTicketCapacityInput?: string;
  monthPackageEnabled?: boolean;
  monthPackagePrice?: string;
  monthPackageLabel?: string;
};

export type EventsStats = {
  total: number;
  activeCount: number;
  inactiveCount: number;
  itemsTotal: number;
};

export type EventsStatsBarVariant = "general" | "upcomingSite";

export type CreateAdminEventBody = {
  eventTypeId?: string;
  eventTypeName?: string;
  description: string;
  items: string[];
  showOnHome: boolean;
  publicSection: EventPublicSection;
  experienceType?: UpcomingExperienceType | null;
  classVariant?: UpcomingClassVariant | null;
  price?: number;
};

export type UpdateAdminEventBody = {
  eventTypeId?: string;
  eventTypeName?: string;
  description: string;
  items: string[];
  showOnHome: boolean;
  publicSection: EventPublicSection;
  experienceType?: UpcomingExperienceType | null;
  classVariant?: UpcomingClassVariant | null;
  price?: number | null;
};
