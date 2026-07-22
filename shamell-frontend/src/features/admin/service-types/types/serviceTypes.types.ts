export type ServiceTypeItem = {
  id: string;
  name: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  serviceCount?: number;
  galleryPhotoCount?: number;
};

export type FilterTab = "all" | "active" | "inactive";

export type UpsertServiceTypeBody = {
  name: string;
};

export type ServiceTypesStats = {
  total: number;
  active: number;
  inactive: number;
};
