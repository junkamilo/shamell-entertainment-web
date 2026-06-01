export type StandaloneChairReservationStatus = "PAID" | "PENDING_PAYMENT";

export type StandaloneChairInventoryItem = {
  id: string;
  chairName: string;
  displayLabel: string;
  unitPrice: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  isReserved: boolean;
  reservationStatus?: StandaloneChairReservationStatus;
  isOnFloorPlan: boolean;
  canDelete: boolean;
  canEditPrice: boolean;
};

export type StandaloneChairConfig = {
  id: string | null;
  availableQuantity: number;
  unitPrice: number;
  updatedAt: string | null;
  isDefault: boolean;
  reservedCount?: number;
  totalCount?: number;
  chairs?: StandaloneChairInventoryItem[];
};

export type StandaloneChairConfigPayload = {
  availableQuantity: number;
  unitPrice: number;
};

export const STANDALONE_CHAIR_MAX_QUANTITY = 500;

export const STANDALONE_CHAIR_DISPLAY_LABEL = "Chair";
