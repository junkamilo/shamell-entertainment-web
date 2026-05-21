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
  createdAt?: string;
  updatedAt?: string;
  bookingCount?: number;
  galleryPhotoCount?: number;
};

export type EventFormSnapshot = {
  eventTypeId: string;
  description: string;
  itemsText: string;
  price: number | null;
};

export type EventsStats = {
  total: number;
  upcoming: number;
  completed: number;
  itemsTotal: number;
  nearestLabel: string;
};

export type CreateAdminEventBody = {
  eventTypeId: string;
  description: string;
  items: string[];
  showOnHome: boolean;
  price?: number;
};

export type UpdateAdminEventBody = {
  eventTypeId: string;
  description: string;
  items: string[];
  showOnHome: boolean;
  price?: number | null;
};
