export type AdminService = {
  id: string;
  serviceTypeId: string;
  serviceTypeName: string;
  description: string;
  items: string[];
  price: number | null;
  imageUrl: string | null;
  isActive: boolean;
  bookingCount?: number;
  galleryPhotoCount?: number;
};

export type FilterTab = "all" | "active" | "inactive";

export type ServicesStats = {
  total: number;
  active: number;
  inactive: number;
  itemsTotal: number;
};

export type ServiceFormSnapshot = {
  serviceTypeId: string;
  description: string;
  itemsText: string;
  price: number | null;
};
