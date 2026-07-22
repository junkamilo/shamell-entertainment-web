export type EventTypeCatalogChannel = "BOOKING" | "UPCOMING_HUB";

export type OccasionUsage = "OCCASION_SINGLE" | "BESPOKE_PROJECT" | "BESPOKE_ROLE";

export type OccasionCatalogItem = {
  id: string;
  name: string;
  isActive: boolean;
};

export type EventTypeOccasionAssignment = {
  occasionTypeId: string;
  usage: OccasionUsage;
  sortOrder?: number;
  occasionName?: string;
};

export type EventTypeItem = {
  id: string;
  name: string;
  isActive: boolean;
  catalogChannel?: EventTypeCatalogChannel;
  createdAt?: string;
  updatedAt?: string;
  eventCount?: number;
  bookingCount?: number;
  galleryPhotoCount?: number;
  occasionAssignments?: EventTypeOccasionAssignment[];
};

export type EventTypeOccasionAssignmentPayload = {
  occasionTypeId: string;
  usage: "OCCASION_SINGLE";
};

export type UpsertEventTypeBody = {
  name: string;
  occasions: EventTypeOccasionAssignmentPayload[];
};

export type FilterTab = "all" | "active" | "inactive";

export type EventTypesStats = {
  total: number;
  active: number;
  inactive: number;
};
