export type EventActivityForm = {
  id?: string;
  clientKey?: string;
  title: string;
  description: string;
  accentColor: string;
  showText: boolean;
  displayOrder: number;
  isActive?: boolean;
  mediaUrl?: string | null;
  mediaType?: "IMAGE" | "VIDEO" | null;
  pendingMediaFile?: File | null;
};

/** Local draft package (create flow) or edit staging. `activityRefs` are activity clientKeys and/or persisted ids. */
export type FixedEventPackageForm = {
  clientKey: string;
  id?: string;
  title: string;
  description: string;
  badge: string;
  priceInput: string;
  capacityInput: string;
  arrivalStartTime: string;
  arrivalEndTime: string;
  activityRefs: string[];
  displayOrder: number;
  isActive?: boolean;
};

export type AdminFixedEventPackage = {
  id: string;
  title: string;
  description: string | null;
  badge: string | null;
  priceCents: number;
  price: number;
  capacity: number;
  arrivalStartTime: string;
  arrivalEndTime: string | null;
  arrivalLabel: string;
  displayOrder: number;
  isActive: boolean;
  activityIds: string[];
  blockingCount?: number;
  remaining?: number;
};

export type AdminEventActivity = {
  id: string;
  title: string;
  description: string | null;
  mediaUrl: string | null;
  mediaType: "IMAGE" | "VIDEO" | null;
  accentColor: string | null;
  showText: boolean;
  displayOrder: number;
  isActive?: boolean;
};
