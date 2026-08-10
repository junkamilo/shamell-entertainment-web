/** Narrow response shapes for standalone-chairs e2e / deep HTTP tests (no any). */

export type ErrorBody = {
  statusCode: number;
  message: string | string[];
  error?: string;
};

export type PublicChairListItemBody = {
  id: string;
  unitPrice: number;
  chairName: string;
  sortOrder: number;
  isActive: boolean;
};

export type PublicStandaloneChairsBody = {
  id: string | null;
  availableQuantity: number;
  unitPrice: number;
  updatedAt: string | null;
  isDefault: boolean;
  chairs: PublicChairListItemBody[];
};

export type AdminChairItemBody = {
  id: string;
  chairName: string;
  displayLabel?: string;
  unitPrice: number;
  sortOrder: number;
  isActive: boolean;
  isReserved: boolean;
  isOnFloorPlan: boolean;
  canDelete: boolean;
  canEditPrice: boolean;
};

export type AdminStandaloneChairsBody = {
  id: string | null;
  availableQuantity: number;
  unitPrice: number;
  updatedAt: string | null;
  isDefault: boolean;
  reservedCount: number;
  totalCount: number;
  chairs: AdminChairItemBody[];
};
