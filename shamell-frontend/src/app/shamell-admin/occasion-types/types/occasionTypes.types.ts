export type OccasionTypeItem = {
  id: string;
  name: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  bookingCount?: number;
  eventTypeLinkCount?: number;
};

export type FilterTab = "all" | "active" | "inactive";

export type UpsertOccasionTypeBody = {
  name: string;
};
