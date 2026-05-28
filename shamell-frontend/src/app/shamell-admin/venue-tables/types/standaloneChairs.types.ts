export type StandaloneChairInventoryItem = {
  id: string;
  chairName: string;
  displayLabel: string;
  unitPrice: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type StandaloneChairConfig = {
  id: string | null;
  availableQuantity: number;
  unitPrice: number;
  updatedAt: string | null;
  isDefault: boolean;
  chairs?: StandaloneChairInventoryItem[];
};

export type StandaloneChairConfigPayload = {
  availableQuantity: number;
  unitPrice: number;
};

export const STANDALONE_CHAIR_MAX_QUANTITY = 500;

export const STANDALONE_CHAIR_DISPLAY_LABEL = "Chair";
